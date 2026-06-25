'use client'

import { useEffect, useState } from 'react'
import {
  type ConceptDetail,
  type ConceptPassage,
  getConcept,
  getConceptPassages,
} from '@/lib/api'
import { Highlighted, snippetAround } from '@/lib/passage-format'

/**
 * The page-preview analogue (Obsidian's hover preview): a small peek at a concept
 * — its topic, description, and a couple of source passages — shown when hovering a
 * concept chip or graph node. Fetches lazily on first hover and caches per concept
 * id (module-level), so hovering many chips in a long document never storms the API
 * and re-hovering is instant.
 */

type Preview = { detail: ConceptDetail | null; passages: ConceptPassage[] }

const cache = new Map<string, Promise<Preview>>()

function load(id: string): Promise<Preview> {
  let p = cache.get(id)
  if (!p) {
    p = Promise.all([
      getConcept(id).catch(() => null),
      getConceptPassages(id)
        .then((r) => r.passages)
        .catch(() => [] as ConceptPassage[]),
    ]).then(([detail, passages]) => ({ detail, passages }))
    cache.set(id, p)
  }
  return p
}

export function ConceptHoverCard({
  conceptId,
  name,
}: {
  conceptId: string
  name: string
}) {
  // Keyed by concept id so a hover switch reads as "loading" by comparison alone —
  // no synchronous reset setState in the effect (which would cascade renders).
  const [state, setState] = useState<{ key: string; preview: Preview } | null>(null)
  useEffect(() => {
    let alive = true
    load(conceptId).then((p) => {
      if (alive) setState({ key: conceptId, preview: p })
    })
    return () => {
      alive = false
    }
  }, [conceptId])
  const preview = state?.key === conceptId ? state.preview : null

  const terms = preview?.detail
    ? [name, ...preview.detail.aliases].filter(Boolean)
    : [name]
  const top = preview?.passages.slice(0, 2) ?? []
  const description = preview?.detail?.description

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="truncate font-medium">{name}</span>
        {preview?.detail?.cluster_label && (
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
            {preview.detail.cluster_label}
          </span>
        )}
      </div>

      {preview === null ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : (
        <>
          {description && (
            <p className="text-xs leading-relaxed text-foreground/80">{description}</p>
          )}
          {top.length > 0 && (
            <div className="space-y-1 border-t pt-2">
              {top.map((p) => (
                <p
                  key={p.chunk_id}
                  className="line-clamp-3 text-xs leading-relaxed text-muted-foreground"
                >
                  <Highlighted text={snippetAround(p.content, terms)} terms={terms} />
                </p>
              ))}
            </div>
          )}
          {!description && top.length === 0 && (
            <p className="text-xs text-muted-foreground">No description yet.</p>
          )}
        </>
      )}
    </div>
  )
}
