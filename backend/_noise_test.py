"""Read-only extraction-noise test: run the REAL pipeline parser (`parse_document`)
on local PDFs and report whether the user-facing text still carries noise.

No worker, no DB, no S3, no OpenAI, no code change — just the pure parse function the
ingest pipeline calls. For each PDF it prints, BEFORE vs AFTER cleaning:
  - residual noise-marker counts (picture placeholders, picture-text blocks, <br>)
  - what each rule removed
  - OVER-DELETION scan: any removed block that contains a real sentence or a
    'Figure N' / 'Table N' caption (would be content loss), and any bare-number line
    deleted that looks like body content rather than a page number.
"""

import re
import sys
import unicodedata
from glob import glob

import fitz
import pymupdf4llm

from app.services import parse as P

PDFS = sorted(glob("/Users/gongchengzhen/Downloads/*.pdf"))
ONLY = sys.argv[1:]  # optional substring filters

# Noise signatures to grep for in the FINAL user-facing text.
SIG = {
    "==> picture … omitted": re.compile(r"==> picture \[[^\]]*\] intentionally omitted"),
    "picture-text marker": re.compile(r"-{5} (?:Start|End) of picture text -{5}"),
    "<br>": re.compile(r"<br\s*/?>", re.IGNORECASE),
}
# Over-deletion probes.
PROSE = re.compile(r"(?:\b[a-z]{3,}\b[ ,]+){6,}")  # ≥6 real words in a row = a sentence
CAPTION = re.compile(r"\b(?:Figure|Fig\.?|Table)\s+\d+", re.IGNORECASE)


def parse_raw_and_clean(data: bytes):
    with fitz.open(stream=data, filetype="pdf") as doc:
        md = pymupdf4llm.to_markdown(doc, show_progress=False)
    raw = unicodedata.normalize("NFC", P._strip_references(md))
    cleaned = P._clean_extraction_noise(raw)
    return raw, cleaned


def main() -> None:
    targets = [p for p in PDFS if not ONLY or any(o.lower() in p.lower() for o in ONLY)]
    print(f"testing {len(targets)} PDF(s)\n")
    grand = {"over_deletion_flags": 0}
    for path in targets:
        name = path.rsplit("/", 1)[-1]
        with open(path, "rb") as f:
            data = f.read()
        raw, cleaned = parse_raw_and_clean(data)

        print("=" * 80)
        print(f"### {name}")
        print(f"    raw {len(raw)} → cleaned {len(cleaned)} chars  (removed {len(raw) - len(cleaned)})")

        # 1) residual noise in the FINAL text — the headline pass/fail.
        print("    residual noise in user-facing text:")
        clean_ok = True
        for label, rx in SIG.items():
            n = len(rx.findall(cleaned))
            print(f"      {label:26} {n}")
            if n:
                clean_ok = False
        print(f"    >>> {'CLEAN ✓' if clean_ok else 'NOISE REMAINS ✗'}")

        # 2) over-deletion: scan every removed picture-text block for prose/caption.
        flagged = []
        for b in P._PICTURE_TEXT_BLOCK_RE.findall(raw):
            inner = re.sub(r"<br\s*/?>", " ", b)
            if PROSE.search(inner) or CAPTION.search(inner):
                flagged.append(inner)
        # 3) over-deletion: bare-number lines removed — confirm sequential page numbers.
        t = P._PICTURE_TEXT_BLOCK_RE.sub("", raw)
        t = P._PICTURE_PLACEHOLDER_RE.sub("", t)
        t = re.sub(r"<br\s*/?>", " ", t)
        t = P._HYPHEN_BREAK_RE.sub(r"\1\2", t)
        nums = [int(m.strip()) for m in P._PAGE_NUMBER_RE.findall(t) if m.strip().isdigit()]
        odd = [n for n in nums if n > 300]

        print(f"    over-deletion scan: blocks-with-prose/caption={len(flagged)}  "
              f"page-num-lines={len(nums)} (max {max(nums) if nums else 0}, odd>300={len(odd)})")
        for f in flagged[:5]:
            print("      [BLOCK PROSE?] ", (f[:160] + "…") if len(f) > 160 else f)
        if odd:
            print("      [ODD NUMBERS] ", odd[:20])
        grand["over_deletion_flags"] += len(flagged) + len(odd)

    print("\n" + "=" * 80)
    print(f"TOTAL over-deletion flags across all docs: {grand['over_deletion_flags']}")


if __name__ == "__main__":
    main()
