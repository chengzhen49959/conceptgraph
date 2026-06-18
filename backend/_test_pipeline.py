"""Throwaway: run the concept-extraction core on ONE local file — no DB/Redis/S3.

parse -> chunk -> extract (the real, ported prompt) -> in-memory 3-band dedup that
mirrors services/concepts.resolve_concept (exact-name fast path, cosine NN,
auto-merge / LLM-judge / new bands, alias + merge_descriptions + re-embed on
merge), using the REAL confirm_same_concept / merge_descriptions LLM calls.

Writes a human-readable report + raw JSON next to the input file for inspection.
Run:  uv run --directory backend python _test_pipeline.py [path-to-file.md]
"""

import asyncio
import json
import re
import sys
from pathlib import Path

import numpy as np

from app.ai import (
    confirm_same_concept,
    embed_texts,
    extract_concepts,
    merge_descriptions,
)
from app.config import get_settings
from app.services.chunk import chunk_text
from app.services.parse import parse_document

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

    # --- pre-embed distinct concepts as "name: description" (worker.py form) --
    concept_text: dict[str, str] = {}
    for e in extractions:
        for c in e.concepts:
            k = c.name.strip().lower()
            if k and k not in concept_text:
                concept_text[k] = f"{c.name}: {c.description}"
    keys = list(concept_text)
    vlist = await embed_texts([concept_text[k] for k in keys]) if keys else []
    vec = {k: np.array(v, dtype=np.float32) for k, v in zip(keys, vlist)}

    # distinct concepts in document order (worker resolves each name once)
    ordered = []
    seen: set[str] = set()
    for e in extractions:
        for c in e.concepts:
            k = c.name.strip().lower()
            if k and k not in seen and k in vec:
                seen.add(k)
                ordered.append(c)

    # --- in-memory 3-band dedup (mirror of resolve_concept) ------------------
    accepted: list[dict] = []         # canonical nodes
    by_name: dict[str, int] = {}      # lower(name|alias) -> accepted idx
    name_to_idx: dict[str, int] = {}  # incoming lower(name) -> accepted idx
    st = {"new": 0, "exact": 0, "auto": 0, "judge_call": 0, "judge_merge": 0, "judge_split": 0}

    for c in ordered:
        k = c.name.strip().lower()
        emb = vec[k]
        if k in by_name:  # exact-name fast path
            name_to_idx[k] = by_name[k]
            st["exact"] += 1
            continue

        best_idx, best_sim = -1, -1.0
        for i, a in enumerate(accepted):
            sim = _cos(emb, a["emb"])
            if sim > best_sim:
                best_sim, best_idx = sim, i
        dist = 1.0 - best_sim if best_idx >= 0 else 1.0

        same, decided = False, "new"
        if best_idx >= 0 and dist <= s.merge_distance_auto:
            same, decided = True, "auto"
            st["auto"] += 1
        elif best_idx >= 0 and dist <= s.review_distance:
            st["judge_call"] += 1
            d = await confirm_same_concept(
                c.name, c.description, accepted[best_idx]["name"], accepted[best_idx]["description"]
            )
            same, decided = d.same_concept, "judge"
            st["judge_merge" if same else "judge_split"] += 1

        if same:
            a = accepted[best_idx]
            if c.name.lower() not in {x.lower() for x in [a["name"], *a["aliases"]]}:
                a["aliases"].append(c.name)
            if c.description and a["description"] and c.description != a["description"]:
                a["description"] = await merge_descriptions(a["name"], a["description"], c.description)
                a["emb"] = np.array(
                    (await embed_texts([f"{a['name']}: {a['description']}"]))[0], dtype=np.float32
                )
            a["mentions"] += 1
            a["merges"].append({"name": c.name, "via": decided, "sim": round(best_sim, 4)})
            by_name[c.name.lower()] = best_idx
            name_to_idx[k] = best_idx
        else:
            idx = len(accepted)
            accepted.append({
                "name": c.name, "description": c.description, "emb": emb,
                "aliases": list(c.aliases), "mentions": 1, "decided_by": decided,
                "nearest_sim": round(best_sim, 4) if best_idx >= 0 else None,
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

    print(
        f"[dedup] {len(accepted)} final concepts  "
        f"(new={st['new']} exact={st['exact']} auto={st['auto']} "
        f"judge={st['judge_call']}->merge {st['judge_merge']}/split {st['judge_split']})"
    )
    print(f"[relations] {len(rel_w)} after remap+dedup")
    print(f"[quality] glossary-leak descriptions: {len(leaks)}  sentence-punct names: {len(bad_names)}")

    # --- write artifacts ------------------------------------------------------
    nodes = sorted(accepted, key=lambda a: a["mentions"], reverse=True)
    relations = [
        {"source": k[0], "target": k[1], "relation": k[2], "weight": w}
        for k, w in sorted(rel_w.items(), key=lambda kv: kv[1], reverse=True)
    ]

    out_json = INPUT.with_name(INPUT.stem + ".pipeline.json")
    out_md = INPUT.with_name(INPUT.stem + ".pipeline.md")

    out_json.write_text(json.dumps({
        "input": str(INPUT),
        "settings": {
            "extract_model": s.extract_model, "confirm_model": s.confirm_model,
            "embed_model": s.embed_model,
            "merge_distance_auto": s.merge_distance_auto, "review_distance": s.review_distance,
        },
        "counts": {
            "chars": len(text), "chunks": len(chunks),
            "raw_concepts": raw_concepts, "distinct_names": len(ordered),
            "final_concepts": len(accepted), "raw_relations": raw_relations,
            "final_relations": len(relations), **st,
        },
        "quality": {"glossary_leaks": leaks, "sentence_punct_names": bad_names},
        "concepts": [
            {kk: a[kk] for kk in ("name", "description", "aliases", "mentions", "decided_by", "nearest_sim", "merges")}
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
    L.append(f"- models: extract=`{s.extract_model}` confirm=`{s.confirm_model}` embed=`{s.embed_model}`")
    L.append(f"- dedup bands (cosine dist): auto <= {s.merge_distance_auto} · judge <= {s.review_distance}\n")
    L.append("## Counts")
    L.append(f"- {len(text)} chars -> {len(chunks)} chunks -> {raw_concepts} raw concepts "
             f"({len(ordered)} distinct names) -> **{len(accepted)} final concepts**")
    L.append(f"- dedup: new={st['new']} · exact-name={st['exact']} · auto-merge={st['auto']} · "
             f"judge calls={st['judge_call']} (merged {st['judge_merge']} / split {st['judge_split']})")
    L.append(f"- relations: {raw_relations} raw -> **{len(relations)} after remap+dedup**\n")
    L.append("## Quality")
    L.append(f"- glossary-leak descriptions (reference 本文/作者/...): **{len(leaks)}**"
             + (f" -> {', '.join(leaks)}" if leaks else " (ok)"))
    L.append(f"- sentence-punctuation names (should be 0): **{len(bad_names)}**"
             + (f" -> {', '.join(bad_names)}" if bad_names else " (ok)") + "\n")
    L.append(f"## Final concepts ({len(nodes)}) — by mention count\n")
    for a in nodes:
        al = f"  · aliases: {', '.join(a['aliases'])}" if a["aliases"] else ""
        if a["merges"]:
            mg = "  · merged: " + ", ".join(f"{m['name']}({m['via']})" for m in a["merges"])
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
