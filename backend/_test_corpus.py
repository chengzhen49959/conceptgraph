"""Throwaway: run the concept pipeline over a FOLDER of documents — one merged
graph, no DB/Redis/S3. The multi-document sibling of _test_pipeline.py.

It tests what a single file cannot: cross-document dedup (does the same concept
across many papers collapse to ONE node?) and offline clustering. Pipeline:
parse+chunk each file -> extract every chunk (the real prompt) -> dedup across
the WHOLE corpus (exact + embedding block + match_concept) -> Leiden clusters +
labels. Writes corpus.pipeline.md + .json to the out dir.

Run:  uv run --directory backend python _test_corpus.py <corpus_dir> <out_dir>
"""

import asyncio
import json
import os
import re
import sys
from pathlib import Path

import numpy as np

from app.ai import (
    embed_texts,
    extract_concepts,
    label_cluster,
    match_concept,
    merge_descriptions,
)
from app.ai.extract import ChunkExtraction
from app.config import get_settings
from app.services.chunk import chunk_text
from app.services.clustering import _partition
from app.services.parse import parse_document

CORPUS_DIR = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("../test/corpus")
OUT_DIR = Path(sys.argv[2]) if len(sys.argv) > 2 else CORPUS_DIR.parent

# Cap chunks per document — a representative full-text sample (intro + method +
# results head) keeps the run fast and cheap without losing the core concepts.
# 0 = no cap. Override with MAX_CHUNKS_PER_DOC=N.
MAX_CHUNKS_PER_DOC = int(os.environ.get("MAX_CHUNKS_PER_DOC", "18"))

_SRC_TYPE = {".md": "markdown", ".markdown": "markdown", ".txt": "text", ".pdf": "pdf"}

# A glossary description must NOT reference its source.
_GLOSSARY_LEAK = re.compile(
    r"本文|本书|这篇|这本|本章|本节|作者|文中|书中|this paper|the document|the author|the paper",
    re.I,
)
_SENTENCE_PUNCT = re.compile(r"[。！？!?…;；]|\.\.\.")
# Person-name regression: paper authors must never become concepts — validates
# the extract.py person-exclusion rule on English text too.
_FORBIDDEN_PERSON = {
    "麦基", "mckee", "vaswani", "devlin", "lewis", "brown", "radford", "liu",
    "raffel", "kaplan", "wei", "ouyang", "karpukhin", "guu", "izacard",
}


def _cos(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-12))


def _doc_title(path: Path, text: str) -> str:
    """Corpus .md files open with "# title"; fall back to the filename."""
    head = text.lstrip().splitlines()[0] if text.strip() else ""
    return head[2:].strip() if head.startswith("# ") else path.stem


async def main() -> None:
    s = get_settings()
    files = sorted(p for p in CORPUS_DIR.iterdir() if p.suffix.lower() in _SRC_TYPE)
    if not files:
        print(f"no documents in {CORPUS_DIR}")
        return

    # --- parse + chunk every file, tagging each chunk with its source doc -----
    titles: dict[str, str] = {}   # doc_id -> title
    chunks_per_doc: dict[str, int] = {}
    tagged: list[tuple[str, str]] = []  # (doc_id, chunk_content)
    capped = 0
    for path in files:
        text = parse_document(path.read_bytes(), _SRC_TYPE[path.suffix.lower()])
        chunks = chunk_text(text)
        if MAX_CHUNKS_PER_DOC and len(chunks) > MAX_CHUNKS_PER_DOC:
            chunks = chunks[:MAX_CHUNKS_PER_DOC]
            capped += 1
        doc_id = path.stem.split("__")[0]  # arxiv id for corpus files
        titles[doc_id] = _doc_title(path, text)
        chunks_per_doc[doc_id] = len(chunks)
        tagged.extend((doc_id, c.content) for c in chunks)
    cap_note = f" (cap {MAX_CHUNKS_PER_DOC}/doc, {capped} capped)" if MAX_CHUNKS_PER_DOC else ""
    print(f"[parse] {len(files)} docs -> {len(tagged)} chunks{cap_note}")

    # --- extract every chunk concurrently (worker-style), fault-tolerant ------
    # A long full-text run over a flaky tunnel mustn't die on one bad chunk:
    # failures degrade to an empty extraction and are counted, not raised. A
    # heartbeat every 25 chunks makes the long run observable in the log.
    total = len(tagged)
    counter = {"n": 0}

    async def _extract(text: str):
        try:
            return await extract_concepts(text)
        finally:
            counter["n"] += 1
            if counter["n"] % 25 == 0 or counter["n"] == total:
                print(f"  …extracted {counter['n']}/{total} chunks", flush=True)

    results = await asyncio.gather(
        *(_extract(t[1]) for t in tagged), return_exceptions=True
    )
    failed = sum(1 for r in results if isinstance(r, Exception))
    extractions = [
        ChunkExtraction(concepts=[], relations=[]) if isinstance(r, Exception) else r
        for r in results
    ]
    chunk_doc = [t[0] for t in tagged]  # doc id aligned with extractions
    raw_concepts = sum(len(e.concepts) for e in extractions)
    raw_relations = sum(len(e.relations) for e in extractions)
    print(f"[extract] {len(tagged) - failed} ok / {failed} failed -> "
          f"{raw_concepts} concepts, {raw_relations} relations (pre-dedup)")

    # --- pre-embed distinct concept names ("name: description") --------------
    concept_text: dict[str, str] = {}
    first: dict[str, object] = {}  # lower(name) -> first ExtractedConcept seen
    for e in extractions:
        for c in e.concepts:
            k = c.name.strip().lower()
            if k and k not in concept_text:
                concept_text[k] = f"{c.name}: {c.description}"
                first[k] = c
    keys = list(concept_text)
    vlist = await embed_texts([concept_text[k] for k in keys]) if keys else []
    vec = {k: np.array(v, dtype=np.float32) for k, v in zip(keys, vlist)}
    ordered = [first[k] for k in keys if k in vec]  # one resolution per distinct name

    # --- cross-corpus dedup: embeddings BLOCK top-k, LLM match_concept decides
    accepted: list[dict] = []          # canonical nodes
    by_name: dict[str, int] = {}       # lower(name|alias) -> accepted idx
    name_to_idx: dict[str, int] = {}   # incoming lower(name) -> accepted idx
    st = {"new": 0, "exact": 0, "match_call": 0, "matched": 0, "none": 0}

    for di, c in enumerate(ordered):
        if di and di % 50 == 0:
            print(f"  …deduped {di}/{len(ordered)} concepts", flush=True)
        k = c.name.strip().lower()
        emb = vec[k]
        if k in by_name:
            name_to_idx[k] = by_name[k]
            st["exact"] += 1
            continue

        scored = sorted(
            ((_cos(emb, a["emb"]), i) for i, a in enumerate(accepted)),
            key=lambda si: si[0], reverse=True,
        )
        cand = [(sim, i) for sim, i in scored if (1.0 - sim) <= s.block_distance][: s.block_top_k]
        best_sim = scored[0][0] if scored else None

        chosen, chosen_sim, reason = None, None, ""
        if cand:
            st["match_call"] += 1
            try:
                res = await match_concept(
                    c.name, c.description,
                    [{"name": accepted[i]["name"], "description": accepted[i]["description"]} for _, i in cand],
                )
            except Exception:  # tunnel blip -> treat as no match (safe: becomes a new node)
                res = None
                st["judge_fail"] = st.get("judge_fail", 0) + 1
            if res is not None:
                reason = res.reason
                if 0 <= res.match_index < len(cand):
                    chosen_sim, chosen = cand[res.match_index]
                    st["matched"] += 1
                else:
                    st["none"] += 1
            else:
                st["none"] += 1

        if chosen is not None:
            a = accepted[chosen]
            if c.name.lower() not in {x.lower() for x in [a["name"], *a["aliases"]]}:
                a["aliases"].append(c.name)
            if c.description and a["description"] and c.description != a["description"]:
                try:
                    a["description"] = await merge_descriptions(a["name"], a["description"], c.description)
                    a["emb"] = np.array(
                        (await embed_texts([f"{a['name']}: {a['description']}"]))[0], dtype=np.float32
                    )
                except Exception:  # blip -> keep current description + embedding
                    pass
            a["merges"].append({"name": c.name, "sim": round(chosen_sim, 4), "reason": reason})
            by_name[c.name.lower()] = chosen
            name_to_idx[k] = chosen
        else:
            idx = len(accepted)
            accepted.append({
                "name": c.name, "description": c.description, "emb": emb,
                "aliases": list(c.aliases), "mentions": 0, "docs": set(),
                "decided_by": "judged-distinct" if cand else "new",
                "nearest_sim": round(best_sim, 4) if best_sim is not None else None,
                "match_reason": reason if cand else None, "merges": [],
            })
            by_name[c.name.lower()] = idx
            name_to_idx[k] = idx
            st["new"] += 1

    # --- accumulate mentions + source docs over EVERY occurrence -------------
    for e, did in zip(extractions, chunk_doc):
        for c in e.concepts:
            idx = name_to_idx.get(c.name.strip().lower())
            if idx is not None:
                accepted[idx]["mentions"] += 1
                accepted[idx]["docs"].add(did)

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

    # --- clusters: Leiden over the concept graph (offline, no DB) -------------
    idx_of = {a["name"]: i for i, a in enumerate(accepted)}
    ig_edges, weights = [], []
    for (sname, tname, _rel), w in rel_w.items():
        ig_edges.append((idx_of[sname], idx_of[tname]))
        weights.append(w)
    communities = _partition(len(accepted), ig_edges, weights) if accepted else []
    label_results = await asyncio.gather(
        *(label_cluster([accepted[i]["name"] for i in com]) for com in communities),
        return_exceptions=True,
    )
    labels = [lab if isinstance(lab, str) else "Unlabeled" for lab in label_results]

    # --- quality flags --------------------------------------------------------
    leaks = [a["name"] for a in accepted if _GLOSSARY_LEAK.search(a["description"] or "")]
    bad_names = [a["name"] for a in accepted if _SENTENCE_PUNCT.search(a["name"])]
    persons = [a["name"] for a in accepted if a["name"].strip().lower() in _FORBIDDEN_PERSON]

    print(
        f"[dedup] {len(accepted)} final concepts  "
        f"(new={st['new']} exact={st['exact']} "
        f"match_calls={st['match_call']}->merged {st['matched']}/distinct {st['none']})"
    )
    print(f"[relations] {len(rel_w)} after remap+dedup   [clusters] {len(communities)}")
    print(f"[quality] person-names: {len(persons)} -> {persons or '(ok PASS)'}  "
          f"leaks: {len(leaks)}  punct: {len(bad_names)}")

    # --- write artifacts ------------------------------------------------------
    # rank by breadth (how many papers) then depth (mentions): cross-doc winners top.
    nodes = sorted(accepted, key=lambda a: (len(a["docs"]), a["mentions"]), reverse=True)

    def doc_list(a: dict) -> list[str]:
        return sorted(a["docs"])

    base = CORPUS_DIR.name or "corpus"
    out_json = OUT_DIR / f"{base}.pipeline.json"
    out_md = OUT_DIR / f"{base}.pipeline.md"

    out_json.write_text(json.dumps({
        "corpus_dir": str(CORPUS_DIR),
        "settings": {
            "extract_model": s.extract_model, "judge_model": s.judge_model,
            "embed_model": s.embed_model,
            "block_distance": s.block_distance, "block_top_k": s.block_top_k,
        },
        "documents": [{"id": d, "title": titles[d], "chunks": chunks_per_doc[d]}
                      for d in sorted(titles)],
        "counts": {
            "docs": len(files), "chunks": len(tagged), "chunks_failed": failed,
            "raw_concepts": raw_concepts, "distinct_names": len(ordered),
            "final_concepts": len(accepted), "raw_relations": raw_relations,
            "final_relations": len(rel_w), "clusters": len(communities), **st,
        },
        "quality": {"glossary_leaks": leaks, "sentence_punct_names": bad_names,
                    "forbidden_person_names": persons},
        "clusters": [
            {"label": lab, "size": len(com),
             "members": [accepted[i]["name"] for i in com]}
            for com, lab in sorted(zip(communities, labels), key=lambda cl: len(cl[0]), reverse=True)
        ],
        "concepts": [
            {"name": a["name"], "description": a["description"], "aliases": a["aliases"],
             "mentions": a["mentions"], "docs": doc_list(a), "n_docs": len(a["docs"]),
             "decided_by": a["decided_by"], "nearest_sim": a["nearest_sim"],
             "match_reason": a["match_reason"],
             "merges": [m["name"] for m in a["merges"]]}
            for a in nodes
        ],
        "relations": [
            {"source": k[0], "target": k[1], "relation": k[2], "weight": w}
            for k, w in sorted(rel_w.items(), key=lambda kv: kv[1], reverse=True)
        ],
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    L: list[str] = []
    L.append(f"# Corpus pipeline test — {CORPUS_DIR.name} ({len(files)} docs)\n")
    L.append(f"- models: extract=`{s.extract_model}` judge=`{s.judge_model}` embed=`{s.embed_model}`")
    L.append(f"- dedup: embeddings block top-{s.block_top_k} within cosine dist {s.block_distance}, "
             "LLM match_concept decides\n")

    L.append("## Counts")
    L.append(f"- {len(files)} docs -> {len(tagged)} chunks"
             + (f" ({failed} failed extraction)" if failed else "")
             + f" -> {raw_concepts} raw concepts "
             f"({len(ordered)} distinct names) -> **{len(accepted)} final concepts**")
    L.append(f"- dedup: new={st['new']} · exact-name={st['exact']} · "
             f"match calls={st['match_call']} (merged {st['matched']} / judged-distinct {st['none']})")
    L.append(f"- relations: {raw_relations} raw -> **{len(rel_w)} after remap+dedup** · "
             f"**{len(communities)} clusters**\n")

    L.append("## Quality")
    L.append(f"- forbidden person-names (should be 0): **{len(persons)}**"
             + (f" -> {', '.join(persons)} **FAIL**" if persons else " (ok **PASS**)"))
    L.append(f"- glossary-leak descriptions: **{len(leaks)}**"
             + (f" -> {', '.join(leaks)}" if leaks else " (ok)"))
    L.append(f"- sentence-punctuation names: **{len(bad_names)}**"
             + (f" -> {', '.join(bad_names)}" if bad_names else " (ok)") + "\n")

    cross = [a for a in nodes if len(a["docs"]) >= 2]
    L.append(f"## Cross-document concepts ({len(cross)}) — merged across ≥2 papers\n")
    L.append("The dedup payoff: one node, many sources.\n")
    for a in cross[:40]:
        al = f" · aliases: {', '.join(a['aliases'])}" if a["aliases"] else ""
        L.append(f"- **{a['name']}** — {len(a['docs'])} docs, x{a['mentions']}{al}  "
                 f"`{', '.join(doc_list(a))}`")
    L.append("")

    L.append(f"## Clusters ({len(communities)}) — vs the A–E reading-list themes\n")
    for com, lab in sorted(zip(communities, labels), key=lambda cl: len(cl[0]), reverse=True):
        members = ", ".join(accepted[i]["name"] for i in com[:18])
        more = f" … (+{len(com) - 18})" if len(com) > 18 else ""
        L.append(f"### {lab}  ({len(com)})")
        L.append(f"{members}{more}\n")

    L.append(f"## Documents ({len(files)})\n")
    for d in sorted(titles):
        L.append(f"- `{d}` — {titles[d]}  ({chunks_per_doc[d]} chunks)")
    L.append("")

    L.append(f"## All final concepts ({len(nodes)}) — by #docs then mentions\n")
    for a in nodes:
        al = f"  · aliases: {', '.join(a['aliases'])}" if a["aliases"] else ""
        mg = "  · merged: " + ", ".join(m["name"] for m in a["merges"]) if a["merges"] else ""
        L.append(f"### {a['name']}  [{len(a['docs'])} docs, x{a['mentions']}] [{a['decided_by']}]{al}")
        L.append(f"{a['description']}{mg}\n")

    rels = sorted(rel_w.items(), key=lambda kv: kv[1], reverse=True)
    L.append(f"## Relations ({len(rels)})\n")
    for (sname, tname, rel), w in rels:
        L.append(f"- {sname} —{rel}→ {tname}  (x{w})")
    out_md.write_text("\n".join(L), encoding="utf-8")

    print(f"\nwrote:\n  {out_md}\n  {out_json}")


if __name__ == "__main__":
    asyncio.run(main())
