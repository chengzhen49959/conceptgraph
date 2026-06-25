"""Local pipeline smoke — run the REAL ingestion pipeline against a local file and
dump the resulting concept graph to the test dir as JSON + a readable Markdown
report.

Replicates ``app/worker.py::ingest_document`` stage for stage, minus the two
pieces a local run doesn't need:
  * S3 — reads the file straight off disk instead of ``get_object``.
  * the Redis merge-lock — a single document has no concurrency to serialize.
Every AI + DB call is the SAME code the worker runs, so this faithfully exercises
F4 merge/dedup, the two-level cluster hierarchy (P2), and the doc summary (P3).

Usage (run from backend/ so .env.local + the venv resolve):
    cd backend && .venv/bin/python ../test/pipeline_smoke.py <file> [out-dir]

Needs DATABASE_URL + OPENAI_API_KEY in backend/.env.local and a reachable Aurora
+ OpenAI. Creates a throwaway *shared* workspace, ingests the document through it,
writes the report, then deletes that workspace (CASCADE) so Aurora isn't littered
(set KEEP=1 to keep it for manual inspection).
"""

import asyncio
import json
import os
import sys
import uuid
from collections import Counter
from datetime import datetime, timezone
from itertools import combinations
from pathlib import Path

# Make `app...` importable when run from the repo root or from backend/.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from sqlalchemy import delete, func, select, update  # noqa: E402

from app.ai import (  # noqa: E402
    CandidateConcept,
    embed_text,
    embed_texts,
    extract_concepts,
    select_core_concepts,
    summarize_document,
)
from app.db import _sessionmaker  # noqa: E402
from app.models import (  # noqa: E402
    Chunk,
    Cluster,
    Concept,
    ConceptAlias,
    ConceptMention,
    Document,
    Edge,
    Workspace,
)
from app.services.chunk import chunk_text  # noqa: E402
from app.services.clustering import recompute_clusters  # noqa: E402
from app.services.concepts import (  # noqa: E402
    add_alias,
    add_mention,
    resolve_concept,
    upsert_edge,
)
from app.services.parse import parse_document  # noqa: E402
from app.worker import _MIN_COOCCUR  # noqa: E402 — mirror the worker's co-occurrence floor

_SOURCE_TYPE = {".pdf": "pdf", ".md": "markdown", ".markdown": "markdown", ".txt": "text"}


def _log(msg: str) -> None:
    print(msg, flush=True)


async def _ingest(file_path: Path, sessionmaker) -> tuple[uuid.UUID, uuid.UUID]:
    """Run the worker pipeline inline against `file_path`. Returns (workspace_id, doc_id)."""
    source_type = _SOURCE_TYPE.get(file_path.suffix.lower(), "text")
    data = file_path.read_bytes()

    # --- Parse + chunk (lock-free) ----------------------------------------
    text = parse_document(data, source_type)
    chunks = chunk_text(text)
    _log(f"  parse → {len(text):,} chars · chunk → {len(chunks)} chunks ({source_type})")
    if not chunks:
        raise SystemExit("no chunks produced — empty document?")

    # --- Embed chunks ------------------------------------------------------
    chunk_vectors = await embed_texts([c.content for c in chunks])
    _log(f"  embed chunks → {len(chunk_vectors)} vectors")

    # --- Extract per chunk (concurrent, LLM) -------------------------------
    extractions = await asyncio.gather(*(extract_concepts(c.content) for c in chunks))
    raw_mentions = sum(len(e.concepts) for e in extractions)
    raw_relations = sum(len(e.relations) for e in extractions)
    _log(f"  extract → {raw_mentions} concept mentions, {raw_relations} relations (pre-merge)")

    # --- Collect distinct concepts (text + representative obj + passage freq) --
    concept_text: dict[str, str] = {}
    concept_first: dict = {}
    freq: Counter = Counter()
    for ext in extractions:
        for c in ext.concepts:
            key = c.name.strip().lower()
            if not key:
                continue
            freq[key] += 1
            if key not in concept_text:
                concept_text[key] = f"{c.name}: {c.description}"
                concept_first[key] = c
    keys = list(concept_text)
    _log(f"  distinct concept surface-forms → {len(keys)}")

    # --- Doc summary (P3) --------------------------------------------------
    doc_summary = await summarize_document([e.summary for e in extractions])
    summary_vec = await embed_text(doc_summary) if doc_summary else None
    _log(f"  doc summary → {len(doc_summary)} chars")

    # --- Core gate (reduce-pass salience): keep only what the doc develops --
    core = await select_core_concepts(
        doc_summary,
        [
            CandidateConcept(
                name=concept_first[k].name,
                description=concept_first[k].description,
                freq=freq[k],
            )
            for k in keys
        ],
    )
    _log(f"  core gate → {len(core)}/{len(keys)} concepts kept")

    # --- Embed only the core concepts for the merge step -------------------
    core_keys = [k for k in keys if k in core]
    concept_vectors = await embed_texts([concept_text[k] for k in core_keys]) if core_keys else []
    concept_vec = dict(zip(core_keys, concept_vectors))

    # --- Create throwaway workspace + document, persist chunks -------------
    workspace_id = uuid.uuid4()
    async with sessionmaker() as session:
        session.add(
            Workspace(
                id=workspace_id,
                owner_id=f"smoke-{workspace_id}",  # unique → dodges the private-ws index
                type="shared",
                name=f"smoke {file_path.name}",
            )
        )
        # Flush the workspace on its own so its row exists before the document's
        # FK check — a combined flush can emit the document insert first.
        await session.flush()
        doc = Document(
            workspace_id=workspace_id,
            title=file_path.stem,
            source_type=source_type,
            status="embedding",
            s3_key=f"local:{file_path.name}",
        )
        session.add(doc)
        await session.flush()
        doc_id = doc.id
        chunk_ids: list[uuid.UUID] = []
        for cd, vec in zip(chunks, chunk_vectors):
            row = Chunk(
                document_id=doc_id, content=cd.content, content_hash=cd.content_hash, embedding=vec
            )
            session.add(row)
            await session.flush()
            chunk_ids.append(row.id)
        await session.commit()

    # --- Phase 1: resolve every concept to an id (merge LLM, no lock) ------
    cache: dict[str, uuid.UUID] = {}
    alias_pairs: list[tuple[uuid.UUID, str]] = []
    for ext in extractions:
        for c in ext.concepts:
            key = c.name.strip().lower()
            if not key or key not in core or key not in concept_vec:
                continue
            if key not in cache:
                await resolve_concept(
                    sessionmaker, workspace_id, c.name, c.description, concept_vec[key], cache
                )
            alias_pairs.extend((cache[key], a) for a in c.aliases)
    # Distinct concept IDS (cache maps each surface-form → an id; many forms can
    # share one id after a merge, so count values, not keys).
    nodes = len(set(cache.values()))
    _log(f"  resolve/merge → {nodes} concept nodes ({raw_mentions - nodes} folded by dedup)")

    # --- Phase 2: provenance + edges + summary (pure DB) -------------------
    cooccur: Counter = Counter()
    async with sessionmaker() as session:
        for cid, alias in alias_pairs:
            await add_alias(session, cid, alias)
        for chunk_id, ext in zip(chunk_ids, extractions):
            ids_here: set[uuid.UUID] = set()
            for c in ext.concepts:
                cid = cache.get(c.name.strip().lower())
                if cid is not None:
                    await add_mention(session, cid, chunk_id, doc_id)
                    ids_here.add(cid)
            for a, b in combinations(sorted(ids_here), 2):
                cooccur[(a, b)] += 1
            for rel in ext.relations:
                sk, tk = rel.source.strip().lower(), rel.target.strip().lower()
                if sk in cache and tk in cache:
                    await upsert_edge(session, workspace_id, cache[sk], cache[tk], rel.relation)
        for (a, b), n in cooccur.items():
            if n >= _MIN_COOCCUR:
                await upsert_edge(session, workspace_id, a, b, "", kind="cooccur", weight=n)
        await session.execute(
            update(Document)
            .where(Document.id == doc_id)
            .values(summary=doc_summary, summary_embedding=summary_vec, status="done")
        )
        await session.commit()

    # --- Phase 3: clusters (P2 two-level hierarchy) -----------------------
    leaf_count = await recompute_clusters(sessionmaker, workspace_id)
    _log(f"  recompute_clusters → {leaf_count} leaf clusters")
    return workspace_id, doc_id


async def _report(workspace_id: uuid.UUID, doc_id: uuid.UUID, sessionmaker) -> dict:
    """Read the persisted graph back into a plain dict for dumping."""
    async with sessionmaker() as session:
        doc = await session.get(Document, doc_id)
        concepts = (
            await session.execute(
                select(Concept.id, Concept.name, Concept.description, Concept.cluster_id, Concept.origin)
                .where(Concept.workspace_id == workspace_id)
                .order_by(Concept.name)
            )
        ).all()
        aliases = (
            await session.execute(
                select(ConceptAlias.concept_id, ConceptAlias.alias)
                .join(Concept, Concept.id == ConceptAlias.concept_id)
                .where(Concept.workspace_id == workspace_id)
            )
        ).all()
        mention_rows = (
            await session.execute(
                select(ConceptMention.concept_id, func.count())
                .join(Concept, Concept.id == ConceptMention.concept_id)
                .where(Concept.workspace_id == workspace_id)
                .group_by(ConceptMention.concept_id)
            )
        ).all()
        clusters = (
            await session.execute(
                select(Cluster.id, Cluster.label, Cluster.parent_id).where(
                    Cluster.workspace_id == workspace_id
                )
            )
        ).all()
        edges = (
            await session.execute(
                select(Edge.source_concept_id, Edge.target_concept_id, Edge.relation, Edge.weight)
                .where(Edge.workspace_id == workspace_id, Edge.kind == "relation")
            )
        ).all()
        # Co-occurrence edges are a hidden clustering substrate, not relations; count
        # them separately so the report shows how much they densified the graph.
        cooccur_edges = (
            await session.execute(
                select(func.count())
                .select_from(Edge)
                .where(Edge.workspace_id == workspace_id, Edge.kind == "cooccur")
            )
        ).scalar() or 0

    name_of = {c.id: c.name for c in concepts}
    alias_of: dict[uuid.UUID, list[str]] = {}
    for cid, a in aliases:
        alias_of.setdefault(cid, []).append(a)
    mentions = {cid: n for cid, n in mention_rows}
    cluster_label = {cl.id: (cl.label or "(unlabeled)") for cl in clusters}
    cluster_parent = {cl.id: cl.parent_id for cl in clusters}
    leaf_ids = {cl.id for cl in clusters if cl.id not in set(cluster_parent.values())}
    parent_ids = {pid for pid in cluster_parent.values() if pid is not None}

    # concepts grouped under their leaf cluster
    members: dict[uuid.UUID | None, list[str]] = {}
    for c in concepts:
        members.setdefault(c.cluster_id, []).append(c.name)

    # build the cluster hierarchy: parent → [leaf → members]
    tree: list[dict] = []
    for pid in sorted(parent_ids, key=lambda x: cluster_label[x]):
        kids = [cl.id for cl in clusters if cluster_parent.get(cl.id) == pid]
        tree.append(
            {
                "parent": cluster_label[pid],
                "leaves": [
                    {"label": cluster_label[k], "concepts": sorted(members.get(k, []))}
                    for k in kids
                ],
            }
        )
    # leaf clusters with no parent
    for cl in clusters:
        if cl.id in leaf_ids and cluster_parent.get(cl.id) is None:
            tree.append(
                {
                    "parent": None,
                    "leaves": [{"label": cluster_label[cl.id], "concepts": sorted(members.get(cl.id, []))}],
                }
            )

    return {
        "document": doc.title,
        "summary": doc.summary,
        "counts": {
            "concepts": len(concepts),
            "aliases": len(aliases),
            "edges": len(edges),
            "cooccur_edges": cooccur_edges,
            "clusters_total": len(clusters),
            "clusters_leaf": len(leaf_ids),
            "clusters_parent": len(parent_ids),
            "singletons": sum(1 for ms in members.values() if len(ms) == 1),
        },
        "concepts": [
            {
                "name": c.name,
                "description": c.description,
                "origin": c.origin,
                "mentions": mentions.get(c.id, 0),
                "aliases": sorted(alias_of.get(c.id, [])),
                "cluster": cluster_label.get(c.cluster_id) if c.cluster_id else None,
            }
            for c in concepts
        ],
        "hierarchy": tree,
        "edges": sorted(
            (
                {
                    "source": name_of.get(e.source_concept_id, "?"),
                    "target": name_of.get(e.target_concept_id, "?"),
                    "relation": e.relation,
                    "weight": e.weight,
                }
                for e in edges
            ),
            key=lambda x: (-x["weight"], x["source"]),
        ),
    }


def _render_md(rep: dict, stamp: str) -> str:
    c = rep["counts"]
    lines = [
        f"# Pipeline smoke — {rep['document']}",
        "",
        f"_Generated {stamp}_",
        "",
        "## Summary (P3 — document summary)",
        "",
        rep["summary"] or "_(none)_",
        "",
        "## Counts",
        "",
        f"- **Concepts (post-merge):** {c['concepts']}",
        f"- **Aliases (folded surface forms):** {c['aliases']}",
        f"- **Edges (relations):** {c['edges']}",
        f"- **Edges (co-occurrence, clustering substrate):** {c['cooccur_edges']}",
        f"- **Clusters:** {c['clusters_leaf']} leaf / {c['clusters_parent']} parent ({c['clusters_total']} total)",
        f"- **Singleton clusters:** {c['singletons']}",
        "",
        "## Topic hierarchy (P2 — two-level Leiden)",
        "",
    ]
    for node in rep["hierarchy"]:
        if node["parent"]:
            lines.append(f"- **{node['parent']}**")
            for leaf in node["leaves"]:
                lines.append(f"  - {leaf['label']} — {', '.join(leaf['concepts'])}")
        else:
            for leaf in node["leaves"]:
                lines.append(f"- {leaf['label']} — {', '.join(leaf['concepts'])}")
    lines += ["", "## Concepts", ""]
    for con in rep["concepts"]:
        al = f" · aliases: {', '.join(con['aliases'])}" if con["aliases"] else ""
        lines.append(f"- **{con['name']}** ({con['mentions']} mentions, {con['cluster'] or 'no cluster'}){al}")
        lines.append(f"  - {con['description']}")
    lines += ["", "## Edges (top by weight)", ""]
    for e in rep["edges"][:60]:
        lines.append(f"- {e['source']} —[{e['relation']} ×{e['weight']}]→ {e['target']}")
    return "\n".join(lines) + "\n"


async def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("usage: pipeline_smoke.py <file> [out-dir]")
    file_path = Path(sys.argv[1]).resolve()
    if not file_path.exists():
        raise SystemExit(f"no such file: {file_path}")
    out_dir = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else file_path.parent
    out_dir.mkdir(parents=True, exist_ok=True)

    sessionmaker = _sessionmaker()
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    _log(f"== pipeline smoke: {file_path.name} ==")

    workspace_id = None
    try:
        workspace_id, doc_id = await _ingest(file_path, sessionmaker)
        rep = await _report(workspace_id, doc_id, sessionmaker)

        json_path = out_dir / f"{file_path.stem}.pipeline.json"
        md_path = out_dir / f"{file_path.stem}.pipeline.md"
        json_path.write_text(json.dumps(rep, indent=2, ensure_ascii=False))
        md_path.write_text(_render_md(rep, stamp))
        _log(f"\n== done ==\n  {json_path}\n  {md_path}")
        cc = rep["counts"]
        _log(
            f"  {cc['concepts']} concepts · {cc['aliases']} aliases · {cc['edges']} edges · "
            f"{cc['clusters_leaf']} leaf / {cc['clusters_parent']} parent clusters"
        )
    finally:
        if workspace_id is not None and not os.environ.get("KEEP"):
            async with sessionmaker() as session:
                await session.execute(delete(Workspace).where(Workspace.id == workspace_id))
                await session.commit()
            _log(f"  cleaned up throwaway workspace {workspace_id}")
        elif workspace_id is not None:
            _log(f"  KEEP=1 — left workspace {workspace_id} in Aurora")


if __name__ == "__main__":
    asyncio.run(main())
