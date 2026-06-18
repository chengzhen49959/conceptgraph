"""Pipeline stage functions — parse, chunk, concepts (merge/dedup + edges),
clustering, storage, and workspace bootstrapping. Worker-agnostic: each takes
explicit inputs (and an AsyncSession where it touches the DB) so they're testable
in isolation and orchestrated by app/worker.py."""
