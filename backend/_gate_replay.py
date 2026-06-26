"""Throwaway: iterate the core-gate FAST by caching extraction.

Extraction (parse -> chunk -> extract) is the 11-min long pole and is FIXED while
tuning the gate prompt, so cache its output (the candidate list + thesis anchor)
once and replay only `select_core_concepts` (~40s) on every gate edit. This holds
the candidate set constant — exactly what you want when tuning the gate, not the
extractor.

Run:  uv run --directory backend python _gate_replay.py <file>           # build cache if missing, run gate
      uv run --directory backend python _gate_replay.py <file> --rebuild  # force re-extract
"""

import asyncio
import json
import sys
import time
from collections import Counter
from pathlib import Path

from app.ai import (
    CandidateConcept,
    extract_concepts,
    select_core_concepts,
    summarize_document,
)
from app.ai.select_core import _is_survey
from app.services.chunk import chunk_text
from app.services.parse import parse_document
from app.services.thesis import grounds_in, thesis_anchor

INPUT = Path(sys.argv[1])
REBUILD = "--rebuild" in sys.argv[2:]
CACHE_DIR = Path("/private/tmp/claude-501/-Users-gongchengzhen-Documents-GitHub-vercel/"
                 "3f9830d1-2585-4ece-9642-2937b70e6183/scratchpad/candcache")
CACHE = CACHE_DIR / (INPUT.stem + ".candcache.json")


def _source_type(path: Path) -> str:
    ext = path.suffix.lower()
    return "pdf" if ext == ".pdf" else "markdown" if ext in (".md", ".markdown") else "text"


async def _build_cache() -> dict:
    data = INPUT.read_bytes()
    text = parse_document(data, _source_type(INPUT))
    chunks = chunk_text(text)
    print(f"[{INPUT.name}] parse {len(text)} chars -> {len(chunks)} chunks; extracting...", flush=True)
    extractions = await asyncio.gather(*(extract_concepts(c.content) for c in chunks))

    concept_first: dict = {}
    freq: Counter = Counter()
    for e in extractions:
        for c in e.concepts:
            k = c.name.strip().lower()
            if not k:
                continue
            freq[k] += 1
            concept_first.setdefault(k, c)
    keys = list(concept_first)

    doc_summary = await summarize_document([e.summary for e in extractions])
    thesis = thesis_anchor(text, INPUT.stem)
    cand = [
        {"name": concept_first[k].name, "description": concept_first[k].description,
         "freq": freq[k],
         "grounded": grounds_in(thesis, concept_first[k].name, *concept_first[k].aliases)}
        for k in keys
    ]
    payload = {"anchor": thesis or doc_summary, "candidates": cand}
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print(f"[{INPUT.name}] cached {len(cand)} candidates -> {CACHE}", flush=True)
    return payload


async def main() -> None:
    if CACHE.exists() and not REBUILD:
        payload = json.loads(CACHE.read_text(encoding="utf-8"))
        print(f"[{INPUT.name}] loaded {len(payload['candidates'])} candidates from cache", flush=True)
    else:
        payload = await _build_cache()

    candidates = [CandidateConcept(**c) for c in payload["candidates"]]
    anchor = payload["anchor"]
    print(f"[{INPUT.name}] is_survey={_is_survey(anchor)}  candidates={len(candidates)}  gate...", flush=True)

    t0 = time.perf_counter()
    core = await select_core_concepts(anchor, candidates)
    secs = round(time.perf_counter() - t0, 1)

    kept = sorted((c.name for c in candidates if c.name.strip().lower() in core), key=str.lower)
    print(f"[{INPUT.name}] gate {secs}s -> kept {len(kept)}/{len(candidates)}", flush=True)
    print("KEPT:", " | ".join(kept), flush=True)


if __name__ == "__main__":
    asyncio.run(main())
