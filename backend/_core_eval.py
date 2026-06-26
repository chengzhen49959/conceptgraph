"""Throwaway: run parse -> chunk -> extract -> core-gate on ONE file and dump the
candidate set + what the gate kept/dropped. No DB / Redis / S3 / embedding / dedup —
this isolates the EXTRACTION recall ceiling and the GATE precision in one cheap pass,
which is exactly what the recall-vs-precision scoring needs.

Mirrors worker.py's gate call (thesis_anchor + grounds_in + CandidateConcept) so the
kept set here equals what the worker would persist as core.

Run:  uv run --directory backend python _core_eval.py <file> <out-dir>
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
from app.services.chunk import chunk_text
from app.services.parse import parse_document
from app.services.thesis import grounds_in, thesis_anchor

try:  # present only after the survey-relaxation lever lands; report which docs fire
    from app.ai.select_core import _is_survey
except ImportError:  # pragma: no cover
    def _is_survey(_anchor: str) -> bool:
        return False

INPUT = Path(sys.argv[1])
OUT_DIR = Path(sys.argv[2]) if len(sys.argv) > 2 else INPUT.parent


def _source_type(path: Path) -> str:
    ext = path.suffix.lower()
    if ext == ".pdf":
        return "pdf"
    if ext in (".md", ".markdown"):
        return "markdown"
    return "text"


async def main() -> None:
    data = INPUT.read_bytes()
    text = parse_document(data, _source_type(INPUT))
    chunks = chunk_text(text)
    print(f"[{INPUT.name}] parse {len(text)} chars -> {len(chunks)} chunks")

    extractions = await asyncio.gather(*(extract_concepts(c.content) for c in chunks))
    raw = sum(len(e.concepts) for e in extractions)

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
    candidates = [
        CandidateConcept(
            name=concept_first[k].name,
            description=concept_first[k].description,
            freq=freq[k],
            grounded=grounds_in(thesis, concept_first[k].name, *concept_first[k].aliases),
        )
        for k in keys
    ]
    print(f"[{INPUT.name}] {len(keys)} candidates -> gate call...", flush=True)
    _t0 = time.perf_counter()
    core = await select_core_concepts(thesis or doc_summary, candidates)
    gate_secs = round(time.perf_counter() - _t0, 1)
    print(f"[{INPUT.name}] gate returned in {gate_secs}s", flush=True)

    kept = [c.name for c in candidates if c.name.strip().lower() in core]
    dropped = [c.name for c in candidates if c.name.strip().lower() not in core]
    print(f"[{INPUT.name}] {raw} raw -> {len(keys)} candidates -> "
          f"core-gate kept {len(kept)} / dropped {len(dropped)}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / (INPUT.stem + ".coreeval.json")
    out.write_text(json.dumps({
        "input": str(INPUT),
        "is_survey_detected": _is_survey(thesis or doc_summary),
        "chars": len(text),
        "chunks": len(chunks),
        "raw_concepts": raw,
        "candidates": len(keys),
        "kept": sorted(kept, key=str.lower),
        "dropped": sorted(dropped, key=str.lower),
        "grounded_candidates": sorted(
            (c.name for c in candidates if c.grounded), key=str.lower
        ),
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[{INPUT.name}] wrote {out}")


if __name__ == "__main__":
    asyncio.run(main())
