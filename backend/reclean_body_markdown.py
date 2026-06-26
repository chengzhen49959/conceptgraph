"""One-off: re-apply `_clean_extraction_noise` to every stored `body_markdown`.

Documents ingested before the noise-stripping shipped (or before a later rule was
added, e.g. the `<br>` collapse) kept their raw `body_markdown`; the reader serves
that column verbatim, so the noise still shows. Re-cleaning in place fixes the
READER only — it does not touch chunks/embeddings/concepts (those are corrected on a
real re-ingest). Idempotent and noise-only, so safe to re-run.

Run from `backend/` (so `.env.local` resolves):
    .venv/bin/python reclean_body_markdown.py          # dry-run: report only
    .venv/bin/python reclean_body_markdown.py --apply   # write the changes
"""

import asyncio
import sys

from sqlalchemy import select

from app.db import _sessionmaker
from app.models import Document
from app.services.parse import _clean_extraction_noise

APPLY = "--apply" in sys.argv


async def main() -> None:
    sm = _sessionmaker()
    async with sm() as session:
        rows = (
            await session.execute(
                select(Document.id, Document.title, Document.body_markdown).where(
                    Document.body_markdown.is_not(None)
                )
            )
        ).all()

    changed = []
    for doc_id, title, body in rows:
        cleaned = _clean_extraction_noise(body)
        if cleaned != body:
            changed.append((doc_id, title or "", len(body), len(cleaned)))

    print(f"documents with body_markdown: {len(rows)}; would change: {len(changed)}")
    for _, title, before, after in changed:
        print(f"  {title[:44]:44}  {before:>7} -> {after:>7} chars  (-{before - after})")

    if not changed:
        print("nothing to do.")
        return
    if not APPLY:
        print("\n(dry-run — re-run with --apply to write)")
        return

    async with sm() as session:
        for doc_id, *_ in changed:
            row = await session.get(Document, doc_id)
            row.body_markdown = _clean_extraction_noise(row.body_markdown)
        await session.commit()
    print(f"\nAPPLIED to {len(changed)} document(s).")


if __name__ == "__main__":
    asyncio.run(main())
