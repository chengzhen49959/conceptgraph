'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ChevronRight, FileText, X } from 'lucide-react'
import {
  type ConceptDetail as ConceptData,
  type ConceptPassage,
  type GraphData,
  type GraphNode,
  getConcept,
  getConceptPassages,
} from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  )
}

const EMPTY_DOCS: ReadonlySet<string> = new Set()
const SNIPPET_BEFORE = 120 // chars kept before the matched term
const SNIPPET_AFTER = 160 // chars kept after it
const FALLBACK_LEN = 240 // head of the chunk shown when no term is found

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** A readable window of `content` around the first occurrence of any term,
 *  with the term itself preserved for highlighting. Chunks are ~512 tokens, so
 *  showing the whole thing would bury the mention; this trims to the sentence
 *  or two around it. Falls back to the head of the chunk when no term matches
 *  (alias morphology, stemming, casing the search missed). */
function snippetAround(content: string, terms: string[]): string {
  const lc = content.toLowerCase()
  let at = -1
  let hitLen = 0
  for (const t of terms) {
    const i = lc.indexOf(t.toLowerCase())
    if (i !== -1 && (at === -1 || i < at)) {
      at = i
      hitLen = t.length
    }
  }
  if (at === -1) {
    return content.length > FALLBACK_LEN ? content.slice(0, FALLBACK_LEN) + '…' : content
  }
  const start = Math.max(0, at - SNIPPET_BEFORE)
  const end = Math.min(content.length, at + hitLen + SNIPPET_AFTER)
  return (
    (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '')
  )
}

/** Renders `text` with every occurrence of any term wrapped in <mark>. Terms
 *  are matched case-insensitively and as plain substrings (no word boundary —
 *  Chinese has none). Longest-first so a term isn't pre-empted by a shorter one
 *  that is its prefix. */
function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  const re = useMemo(() => {
    const valid = terms.filter(Boolean).map(escapeRegExp).sort((a, b) => b.length - a.length)
    return valid.length ? new RegExp(`(${valid.join('|')})`, 'gi') : null
  }, [terms])
  if (!re) return <>{text}</>
  // split on a single capturing group → odd indices are the matched terms.
  return (
    <>
      {text.split(re).map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-sm bg-primary/20 px-0.5 text-foreground">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  )
}

export function ConceptPanel({
  node,
  graph,
  onClose,
  onNavigate,
}: {
  node: GraphNode
  graph: GraphData
  onClose: () => void
  onNavigate: (id: string) => void
}) {
  // Fetched data is tagged with the concept id it belongs to. The view derives
  // both the current-concept data and its loading flag from that tag, so a
  // concept switch resets to "loading" by comparison alone — no synchronous
  // setState in the effect body (which would cascade renders). setState happens
  // only in the async settle callbacks; `alive` drops a response that lost its
  // race to a newer selection.
  const [detailState, setDetailState] = useState<{
    key: string
    data: ConceptData | null
  } | null>(null)
  useEffect(() => {
    let alive = true
    getConcept(node.id)
      .then((d) => {
        if (alive) setDetailState({ key: node.id, data: d })
      })
      .catch((e) => {
        toast.error((e as Error).message)
        if (alive) setDetailState({ key: node.id, data: null })
      })
    return () => {
      alive = false
    }
  }, [node.id])
  const detail = detailState?.key === node.id ? detailState.data : null
  const loading = detailState?.key !== node.id

  // Source passages load on their own track: the chunk text is large and not
  // always read, so it must not gate the header/stats above. Same keyed shape.
  const [passagesState, setPassagesState] = useState<{
    key: string
    data: ConceptPassage[]
  } | null>(null)
  useEffect(() => {
    let alive = true
    getConceptPassages(node.id)
      .then((d) => {
        if (alive) setPassagesState({ key: node.id, data: d.passages })
      })
      .catch((e) => {
        toast.error((e as Error).message)
        if (alive) setPassagesState({ key: node.id, data: [] })
      })
    return () => {
      alive = false
    }
  }, [node.id])
  const passages = passagesState?.key === node.id ? passagesState.data : null
  const passagesLoading = passagesState?.key !== node.id

  const byDoc = useMemo(() => {
    const groups = new Map<
      string,
      { document_id: string; title: string; items: ConceptPassage[] }
    >()
    for (const p of passages ?? []) {
      let g = groups.get(p.document_id)
      if (!g) {
        g = { document_id: p.document_id, title: p.document_title, items: [] }
        groups.set(p.document_id, g)
      }
      g.items.push(p)
    }
    return [...groups.values()]
  }, [passages])

  // Highlight the concept's own name and every merged alias inside each passage.
  const terms = useMemo(
    () => [node.name, ...(detail?.aliases ?? [])].filter(Boolean),
    [node.name, detail?.aliases],
  )

  // Per-document expand state. Stored keyed on the concept so switching concepts
  // resets to the default without a state-resetting effect: a stale key reads as
  // "no overrides". Default open when the whole list is small; collapsed when a
  // wall of passages would otherwise dominate the panel. Each toggle flips a doc
  // away from that default.
  const [opened, setOpened] = useState<{ key: string; docs: Set<string> }>({
    key: node.id,
    docs: new Set(),
  })
  const overrides = opened.key === node.id ? opened.docs : EMPTY_DOCS
  const defaultOpen = (passages?.length ?? 0) > 0 && passages!.length <= 6
  const isOpen = (docId: string) =>
    overrides.has(docId) ? !defaultOpen : defaultOpen
  const toggleDoc = (docId: string) => {
    setOpened((prev) => {
      const docs = new Set(prev.key === node.id ? prev.docs : [])
      if (docs.has(docId)) docs.delete(docId)
      else docs.add(docId)
      return { key: node.id, docs }
    })
  }

  // Neighbours come from the already-loaded graph, not the API.
  const neighbors = useMemo(() => {
    const byId = new Map(graph.nodes.map((n) => [n.id, n.name]))
    const seen = new Set<string>()
    const out: { id: string; name: string }[] = []
    for (const l of graph.links) {
      const other =
        l.source === node.id ? l.target : l.target === node.id ? l.source : null
      if (other && !seen.has(other)) {
        seen.add(other)
        out.push({ id: other, name: byId.get(other) ?? other })
      }
    }
    return out
  }, [graph, node.id])

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex items-start justify-between gap-2 border-b p-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{node.name}</h2>
          {detail?.cluster_label && (
            <Badge variant="secondary" className="mt-1 font-normal">
              {detail.cluster_label}
            </Badge>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 p-4">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="mentions" value={detail?.mentions ?? node.mentions} />
            <Stat label="connections" value={detail?.degree ?? neighbors.length} />
            <Stat label="documents" value={detail?.documents.length ?? 0} />
          </div>

          <Separator />

          {node.description && (
            <Section title="Description">
              <p className="text-sm leading-relaxed text-foreground/90">
                {node.description}
              </p>
            </Section>
          )}

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <>
              {detail && detail.aliases.length > 0 && (
                <Section title={`Aliases (${detail.aliases.length})`}>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.aliases.map((a) => (
                      <Badge key={a} variant="outline" className="font-normal">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </Section>
              )}

            </>
          )}

          {passagesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            byDoc.length > 0 && (
              <Section title="Sources">
                <ul className="space-y-1.5">
                  {byDoc.map((g) => {
                    const open = isOpen(g.document_id)
                    return (
                      <li
                        key={g.document_id}
                        className="overflow-hidden rounded-md border"
                      >
                        <button
                          onClick={() => toggleDoc(g.document_id)}
                          aria-expanded={open}
                          className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm hover:bg-accent"
                        >
                          <ChevronRight
                            className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${
                              open ? 'rotate-90' : ''
                            }`}
                          />
                          <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate" title={g.title}>
                            {g.title}
                          </span>
                          <Badge
                            variant="secondary"
                            className="shrink-0 font-normal tabular-nums"
                          >
                            {g.items.length}
                          </Badge>
                        </button>
                        {open && (
                          <div className="space-y-2 border-t bg-muted/30 px-2.5 py-2">
                            {g.items.map((p) => (
                              <p
                                key={p.chunk_id}
                                className="text-xs leading-relaxed text-foreground/80"
                              >
                                <Highlighted
                                  text={snippetAround(p.content, terms)}
                                  terms={terms}
                                />
                              </p>
                            ))}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </Section>
            )
          )}

          {neighbors.length > 0 && (
            <Section title={`Connected concepts (${neighbors.length})`}>
              <div className="flex flex-wrap gap-1.5">
                {neighbors.map((nb) => (
                  <button
                    key={nb.id}
                    onClick={() => onNavigate(nb.id)}
                    className="rounded-md border px-2 py-1 text-xs transition-colors hover:bg-accent"
                  >
                    {nb.name}
                  </button>
                ))}
              </div>
            </Section>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
