"""Throwaway: run the concept-extraction core on ONE local file — no DB/Redis/S3.

parse -> chunk -> extract (the real, ported prompt) -> in-memory dedup that mirrors
services/concepts.resolve_concept: exact-name fast path, then embeddings BLOCK the
top-k nearest candidates and the REAL match_concept LLM call decides the merge
(alias + merge_descriptions + re-embed on merge).

Writes a human-readable report + raw JSON next to the input file for inspection.
Run:  uv run --directory backend python _test_pipeline.py [path-to-file.md]
"""

import asyncio
import json
import re
import sys
from collections import Counter
from pathlib import Path

import numpy as np

from app.ai import (
    CandidateConcept,
    embed_texts,
    extract_concepts,
    match_concept,
    merge_descriptions,
    select_core_concepts,
    summarize_document,
)
from app.config import get_settings
from app.services.chunk import chunk_text
from app.services.parse import parse_document
from app.services.thesis import grounds_in, thesis_anchor

INPUT = Path(
    sys.argv[1]
    if len(sys.argv) > 1
    else "/Users/gongchengzhen/Downloads/麦基《故事》剧本分析与诊断框架.md"
)

# A glossary description must NOT reference the source — these leaks violate the
# ported "self-contained description" rule.
_GLOSSARY_LEAK = re.compile(
    r"本文|本书|这篇|这本|本章|本节|作者|文中|书中|this paper|the document|the author|the paper",
    re.I,
)
_SENTENCE_PUNCT = re.compile(r"[。！？!?…;；]|\.\.\.")

# Regression guard for the 麦基/McKee bug: the test document's AUTHOR must never
# surface as a concept. The extraction prompt now excludes persons; this asserts
# it stays fixed. Compared case-insensitively against final concept names.
_FORBIDDEN_PERSON = {"麦基", "mckee", "robert mckee", "罗伯特·麦基", "罗伯特•麦基"}


def _cos(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-12))


async def main() -> None:
    s = get_settings()
    data = INPUT.read_bytes()
    text = parse_document(data, "markdown")
    chunks = chunk_text(text)
    print(f"[parse] {len(text)} chars -> [chunk] {len(chunks)} chunks")

    # --- extract (real new prompt), concurrent like the worker ---------------
    extractions = await asyncio.gather(*(extract_concepts(c.content) for c in chunks))
    raw_concepts = sum(len(e.concepts) for e in extractions)
    raw_relations = sum(len(e.relations) for e in extractions)
    print(f"[extract] {raw_concepts} concepts, {raw_relations} relations (pre-dedup)")

    # --- collect distinct concepts (text + first obj + passage freq) ---------
    concept_text: dict[str, str] = {}
    concept_first: dict = {}
    freq: Counter = Counter()
    for e in extractions:
        for c in e.concepts:
            k = c.name.strip().lower()
            if not k:
                continue
            freq[k] += 1
            if k not in concept_text:
                concept_text[k] = f"{c.name}: {c.description}"
                concept_first[k] = c
    keys = list(concept_text)

    # --- core gate (reduce-pass salience): keep only what the doc develops ---
    # Anchored on the document's framing (title + abstract + intro + conclusion),
    # not the aggregate summary — mirror of worker.py.
    doc_summary = await summarize_document([e.summary for e in extractions])
    thesis = thesis_anchor(text, INPUT.stem)
    core = await select_core_concepts(
        thesis or doc_summary,
        [CandidateConcept(name=concept_first[k].name,
                          description=concept_first[k].description, freq=freq[k],
                          grounded=grounds_in(thesis, concept_first[k].name, *concept_first[k].aliases))
         for k in keys],
    )
    print(f"[core-gate] {len(core)}/{len(keys)} concepts kept "
          f"(dropped {len(keys) - len(core)})")

    # --- embed only the core concepts as "name: description" (worker.py form) -
    core_keys = [k for k in keys if k in core]
    vlist = await embed_texts([concept_text[k] for k in core_keys]) if core_keys else []
    vec = {k: np.array(v, dtype=np.float32) for k, v in zip(core_keys, vlist)}

    # distinct concepts in document order (worker resolves each name once)
    ordered = []
    seen: set[str] = set()
    for e in extractions:
        for c in e.concepts:
            k = c.name.strip().lower()
            if k and k not in seen and k in vec:
                seen.add(k)
                ordered.append(c)

    # --- in-memory dedup: embeddings BLOCK top-k, LLM match_concept decides ---
    accepted: list[dict] = []         # canonical nodes
    by_name: dict[str, int] = {}      # lower(name|alias) -> accepted idx
    name_to_idx: dict[str, int] = {}  # incoming lower(name) -> accepted idx
    st = {"new": 0, "exact": 0, "match_call": 0, "matched": 0, "none": 0}

    for c in ordered:
        k = c.name.strip().lower()
        emb = vec[k]
        if k in by_name:  # exact-name fast path
            name_to_idx[k] = by_name[k]
            st["exact"] += 1
            continue

        # Block: nearest accepted nodes within block_distance, capped at top-k.
        scored = sorted(
            ((_cos(emb, a["emb"]), i) for i, a in enumerate(accepted)),
            key=lambda si: si[0], reverse=True,
        )
        cand = [(sim, i) for sim, i in scored if (1.0 - sim) <= s.block_distance][: s.block_top_k]
        best_sim = scored[0][0] if scored else None

        chosen, chosen_sim, reason = None, None, ""
        if cand:
            st["match_call"] += 1
            res = await match_concept(
                c.name, c.description,
                [{"name": accepted[i]["name"], "description": accepted[i]["description"]} for _, i in cand],
            )
            reason = res.reason
            if 0 <= res.match_index < len(cand):
                chosen_sim, chosen = cand[res.match_index]
                st["matched"] += 1
            else:
                st["none"] += 1

        if chosen is not None:
            a = accepted[chosen]
            if c.name.lower() not in {x.lower() for x in [a["name"], *a["aliases"]]}:
                a["aliases"].append(c.name)
            if c.description and a["description"] and c.description != a["description"]:
                a["description"] = await merge_descriptions(a["name"], a["description"], c.description)
                a["emb"] = np.array(
                    (await embed_texts([f"{a['name']}: {a['description']}"]))[0], dtype=np.float32
                )
            a["mentions"] += 1
            a["merges"].append({"name": c.name, "sim": round(chosen_sim, 4), "reason": reason})
            by_name[c.name.lower()] = chosen
            name_to_idx[k] = chosen
        else:
            idx = len(accepted)
            accepted.append({
                "name": c.name, "description": c.description, "emb": emb,
                "aliases": list(c.aliases), "mentions": 1,
                "decided_by": "judged-distinct" if cand else "new",
                "nearest_sim": round(best_sim, 4) if best_sim is not None else None,
                "match_reason": reason if cand else None,
                "merges": [],
            })
            by_name[c.name.lower()] = idx
            name_to_idx[k] = idx
            st["new"] += 1

    # --- relations: remap endpoints to canonical names, dedup with weight ----
    rel_w: dict[tuple, int] = {}
    for e in extractions:
        for r in e.relations:
            si = name_to_idx.get(r.source.strip().lower())
            ti = name_to_idx.get(r.target.strip().lower())
            if si is None or ti is None or si == ti:
                continue
            key = (accepted[si]["name"], accepted[ti]["name"], r.relation)
            rel_w[key] = rel_w.get(key, 0) + 1

    # --- quality flags --------------------------------------------------------
    leaks = [a["name"] for a in accepted if _GLOSSARY_LEAK.search(a["description"] or "")]
    bad_names = [a["name"] for a in accepted if _SENTENCE_PUNCT.search(a["name"])]
    persons = [a["name"] for a in accepted if a["name"].strip().lower() in _FORBIDDEN_PERSON]

    print(
        f"[dedup] {len(accepted)} final concepts  "
        f"(new={st['new']} exact={st['exact']} "
        f"match_calls={st['match_call']}->merged {st['matched']}/distinct {st['none']})"
    )
    print(f"[relations] {len(rel_w)} after remap+dedup")
    print(f"[quality] glossary-leak descriptions: {len(leaks)}  sentence-punct names: {len(bad_names)}")
    print(f"[quality] forbidden person-names: {len(persons)} -> {persons or '(ok PASS)'}")

    # --- write artifacts ------------------------------------------------------
    nodes = sorted(accepted, key=lambda a: a["mentions"], reverse=True)
    relations = [
        {"source": k[0], "target": k[1], "relation": k[2], "weight": w}
        for k, w in sorted(rel_w.items(), key=lambda kv: kv[1], reverse=True)
    ]

    out_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else INPUT.parent
    out_dir.mkdir(parents=True, exist_ok=True)
    out_json = out_dir / (INPUT.stem + ".pipeline.json")
    out_md = out_dir / (INPUT.stem + ".pipeline.md")

    out_json.write_text(json.dumps({
        "input": str(INPUT),
        "settings": {
            "extract_model": s.extract_model, "judge_model": s.judge_model,
            "embed_model": s.embed_model,
            "block_distance": s.block_distance, "block_top_k": s.block_top_k,
        },
        "counts": {
            "chars": len(text), "chunks": len(chunks),
            "raw_concepts": raw_concepts, "distinct_names": len(ordered),
            "final_concepts": len(accepted), "raw_relations": raw_relations,
            "final_relations": len(relations), **st,
        },
        "quality": {"glossary_leaks": leaks, "sentence_punct_names": bad_names,
                    "forbidden_person_names": persons},
        "concepts": [
            {kk: a.get(kk) for kk in ("name", "description", "aliases", "mentions",
                                      "decided_by", "nearest_sim", "match_reason", "merges")}
            for a in nodes
        ],
        "relations": relations,
        "raw_extractions": [
            {"chunk": i, "chars": len(chunks[i].content),
             "concepts": [c.model_dump() for c in e.concepts],
             "relations": [r.model_dump() for r in e.relations]}
            for i, e in enumerate(extractions)
        ],
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    L = []
    L.append(f"# Pipeline test — {INPUT.name}\n")
    L.append(f"- input: `{INPUT}`")
    L.append(f"- models: extract=`{s.extract_model}` judge=`{s.judge_model}` embed=`{s.embed_model}`")
    L.append(f"- dedup: embeddings block top-{s.block_top_k} within cosine dist {s.block_distance}, "
             "LLM match_concept decides\n")
    L.append("## Counts")
    L.append(f"- {len(text)} chars -> {len(chunks)} chunks -> {raw_concepts} raw concepts "
             f"({len(ordered)} distinct names) -> **{len(accepted)} final concepts**")
    L.append(f"- dedup: new={st['new']} · exact-name={st['exact']} · "
             f"match calls={st['match_call']} (merged {st['matched']} / judged-distinct {st['none']})")
    L.append(f"- relations: {raw_relations} raw -> **{len(relations)} after remap+dedup**\n")
    L.append("## Quality")
    L.append(f"- forbidden person-names (should be 0): **{len(persons)}**"
             + (f" -> {', '.join(persons)} **FAIL**" if persons else " (ok **PASS**)"))
    L.append(f"- glossary-leak descriptions (reference 本文/作者/...): **{len(leaks)}**"
             + (f" -> {', '.join(leaks)}" if leaks else " (ok)"))
    L.append(f"- sentence-punctuation names (should be 0): **{len(bad_names)}**"
             + (f" -> {', '.join(bad_names)}" if bad_names else " (ok)") + "\n")
    L.append(f"## Final concepts ({len(nodes)}) — by mention count\n")
    for a in nodes:
        al = f"  · aliases: {', '.join(a['aliases'])}" if a["aliases"] else ""
        if a["merges"]:
            mg = "  · merged: " + ", ".join(m["name"] for m in a["merges"])
        else:
            mg = ""
        L.append(f"### {a['name']}  x{a['mentions']} [{a['decided_by']}]{al}")
        L.append(f"{a['description']}{mg}\n")
    L.append(f"## Relations ({len(relations)})\n")
    for r in relations:
        L.append(f"- {r['source']} —{r['relation']}→ {r['target']}  (x{r['weight']})")
    out_md.write_text("\n".join(L), encoding="utf-8")

    print(f"\nwrote:\n  {out_md}\n  {out_json}")


if __name__ == "__main__":
    asyncio.run(main())
