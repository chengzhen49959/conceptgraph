"""Throwaway: fetch a fixed arXiv reading list to local .md files (one per paper).

Simulates a student collecting a corpus. Default = abstracts only (a single arXiv
API call); --fulltext also downloads each PDF for the heavier extraction run.

Run:  uv run --directory backend python _fetch_arxiv.py <out_dir> [--fulltext]
Writes <out_dir>/<arxiv_id>__<slug>.md      = "# <title>\n\n<abstract>"
       <out_dir>/../corpus_pdf/<arxiv_id>.pdf   (only with --fulltext)
"""

import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

# arXiv ids grouped by the user's reading-list themes (A–E). The theme is kept
# only for reference; title + abstract come from the API.
CORPUS: dict[str, str] = {
    # A — Transformer / foundation models
    "1706.03762": "A", "1810.04805": "A", "2005.14165": "A",
    "1907.11692": "A", "2303.18223": "A", "2001.08361": "A",
    # B — retrieval / RAG
    "2005.11401": "B", "2004.04906": "B", "2002.08909": "B", "2410.12837": "B",
    "2208.03299": "B", "2007.01282": "B", "1911.00172": "B", "2007.00808": "B",
    # C — graph RAG / knowledge structure
    "2404.16130": "C", "2410.05779": "C", "2501.13958": "C", "2405.16506": "C",
    # D — reasoning / prompting / fine-tuning & alignment
    "2201.11903": "D", "2203.02155": "D", "2106.09685": "D",
    # E — evaluation / hallucination
    "2311.05232": "E", "2109.07958": "E", "2307.03172": "E",
}

ATOM = "{http://www.w3.org/2005/Atom}"
API = "http://export.arxiv.org/api/query"
UA = {"User-Agent": "Mozilla/5.0 (concept-graph corpus test; mailto:test@example.com)"}


def slug(title: str) -> str:
    s = re.sub(r"[^\w\s-]", "", title.lower())
    s = re.sub(r"[\s_-]+", "-", s).strip("-")
    return s[:60]


def fetch_metadata(ids: list[str]) -> dict[str, dict]:
    """One API call for all ids -> {arxiv_id: {title, abstract}}."""
    url = f"{API}?id_list={','.join(ids)}&max_results={len(ids)}"
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        root = ET.fromstring(r.read())
    out: dict[str, dict] = {}
    for entry in root.findall(f"{ATOM}entry"):
        raw_id = entry.findtext(f"{ATOM}id", "")  # http://arxiv.org/abs/1706.03762v7
        m = re.search(r"abs/([\d.]+)", raw_id)
        if not m:
            continue
        title = " ".join((entry.findtext(f"{ATOM}title") or "").split())
        summary = " ".join((entry.findtext(f"{ATOM}summary") or "").split())
        out[m.group(1)] = {"title": title, "abstract": summary}
    return out


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    fulltext = "--fulltext" in sys.argv
    out_dir = Path(args[0]) if args else Path("../test/corpus")
    out_dir.mkdir(parents=True, exist_ok=True)

    ids = list(CORPUS)
    meta = fetch_metadata(ids)
    print(f"[arxiv] requested {len(ids)} -> got {len(meta)} entries")

    written, missing = 0, []
    for aid in ids:
        m = meta.get(aid)
        if not m or not m["abstract"]:
            missing.append(aid)
            continue
        (out_dir / f"{aid}__{slug(m['title'])}.md").write_text(
            f"# {m['title']}\n\n{m['abstract']}\n", encoding="utf-8"
        )
        written += 1
    print(f"[write] {written} md files -> {out_dir}")
    if missing:
        print(f"[warn] no abstract for: {missing}")

    if fulltext:
        pdf_dir = out_dir.parent / "corpus_pdf"
        pdf_dir.mkdir(parents=True, exist_ok=True)
        for aid in ids:
            dest = pdf_dir / f"{aid}.pdf"
            if dest.exists():
                continue
            try:
                req = urllib.request.Request(f"https://arxiv.org/pdf/{aid}", headers=UA)
                with urllib.request.urlopen(req, timeout=120) as r:
                    dest.write_bytes(r.read())
                print(f"[pdf] {aid}")
            except Exception as e:  # noqa: BLE001 — best-effort, report and continue
                print(f"[pdf-fail] {aid}: {e}")
        print(f"[pdf] -> {pdf_dir}")


if __name__ == "__main__":
    main()
