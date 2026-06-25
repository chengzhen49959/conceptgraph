'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { search, type GraphCluster, type GraphNode } from '@/lib/api'

const DEBOUNCE_MS = 250
const MIN_QUERY = 2

export function SearchPalette({
  open,
  onOpenChange,
  nodes,
  clusters,
  workspaceId,
  onPick,
  onPickTopic,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodes: GraphNode[]
  clusters: GraphCluster[]
  workspaceId?: string
  onPick: (id: string) => void
  onPickTopic: (id: string) => void
}) {
  // Topics are the sole grouping in this app, so they search alongside concepts:
  // a topic appears as its own result (focus the whole cluster) AND tags each of
  // its concepts, so typing a topic name surfaces the topic first, then its
  // members. Concept counts come from the nodes — the graph carries no per-topic
  // totals.
  const { topicById, topicRows } = useMemo(() => {
    const counts = new Map<string, number>()
    for (const n of nodes) {
      if (n.cluster_id) counts.set(n.cluster_id, (counts.get(n.cluster_id) ?? 0) + 1)
    }
    const byId = new Map<string, string>()
    const rows: { id: string; label: string; count: number }[] = []
    for (const c of clusters) {
      if (!c.label) continue
      byId.set(c.id, c.label)
      rows.push({ id: c.id, label: c.label, count: counts.get(c.id) ?? 0 })
    }
    rows.sort((a, b) => b.count - a.count)
    return { topicById: byId, topicRows: rows }
  }, [nodes, clusters])

  // Mention count per node — lets a passage hit (which isn't a graph node) route
  // a click to the most prominent of the concepts it mentions, using data the
  // client already holds.
  const mentionsById = useMemo(
    () => new Map(nodes.map((n) => [n.id, n.mentions])),
    [nodes],
  )

  // The graph is loaded whole, so cmdk does instant substring matching over it.
  // Vector recall is the part the client can't do — fetched (debounced) from the
  // backend and layered in as extra groups that bypass cmdk's filter (forceMount)
  // so a conceptual query surfaces nodes whose names never matched the text.
  const [query, setQuery] = useState('')
  const [related, setRelated] = useState<{
    concepts: { id: string; name: string; cluster_id: string | null; mentions: number }[]
    passages: {
      chunk_id: string
      document_title: string
      snippet: string
      target: string | null
    }[]
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const seqRef = useRef(0)

  // Close resets here (in the handler, not an effect) so a reopen starts clean
  // without a stale-results flash; also invalidates any in-flight fetch.
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      seqRef.current++
      setQuery('')
      setRelated(null)
      setLoading(false)
    }
    onOpenChange(next)
  }

  // Debounced vector recall. Every state update happens inside the timer callback
  // (never synchronously in the effect body); a short query just skips the fetch
  // and the render gates any stale results out by length.
  useEffect(() => {
    const q = query.trim()
    if (q.length < MIN_QUERY) return
    const seq = ++seqRef.current
    const ql = q.toLowerCase()
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await search(q, workspaceId)
        if (seqRef.current !== seq) return // a newer query already fired
        setRelated({
          // Drop semantic concepts the instant substring group already shows.
          concepts: r.concepts
            .filter((c) => !c.name.toLowerCase().includes(ql))
            .map((c) => ({
              id: c.id,
              name: c.name,
              cluster_id: c.cluster_id,
              mentions: c.mentions,
            })),
          passages: r.passages.map((p) => ({
            chunk_id: p.chunk_id,
            document_title: p.document_title,
            snippet: p.snippet,
            target: primaryConcept(p.concept_ids, mentionsById),
          })),
        })
      } catch {
        if (seqRef.current === seq) setRelated(null)
      } finally {
        if (seqRef.current === seq) setLoading(false)
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query, workspaceId, mentionsById])

  // Below the minimum query length there's no fetch, so gate stale results out.
  const active = query.trim().length >= MIN_QUERY
  const relatedConcepts = active ? (related?.concepts ?? []) : []
  const passages = active ? (related?.passages ?? []) : []
  // cmdk's built-in Empty counts only its filtered (substring) items, so it would
  // wrongly show "No matches" above forceMounted semantic results. Render it only
  // when there's genuinely nothing to show from any source.
  const showEmpty =
    !loading && relatedConcepts.length === 0 && passages.length === 0

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Search concepts"
      description="Find a concept or topic and jump to it in the graph"
    >
      <CommandInput
        placeholder="Search concepts, topics, or describe an idea…"
        onValueChange={setQuery}
      />
      <CommandList>
        {showEmpty && <CommandEmpty>No matches found.</CommandEmpty>}
        <CommandGroup heading="Topics">
          {topicRows.map((t) => (
            <CommandItem
              key={t.id}
              value={t.label}
              onSelect={() => {
                onPickTopic(t.id)
                handleOpenChange(false)
              }}
            >
              <span className="truncate">{t.label}</span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {t.count} concept{t.count === 1 ? '' : 's'}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Concepts">
          {nodes.map((n) => {
            const topic = n.cluster_id ? topicById.get(n.cluster_id) : undefined
            return (
              <CommandItem
                key={n.id}
                value={n.name}
                keywords={topic ? [topic] : undefined}
                onSelect={() => {
                  onPick(n.id)
                  handleOpenChange(false)
                }}
              >
                <span className="truncate">{n.name}</span>
                <span className="ml-auto flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  {topic && (
                    <span className="max-w-[140px] truncate">{topic}</span>
                  )}
                  <span>
                    {n.mentions} mention{n.mentions === 1 ? '' : 's'}
                  </span>
                </span>
              </CommandItem>
            )
          })}
        </CommandGroup>

        {/* Vector recall — forceMounted so cmdk's substring filter doesn't hide
            results whose names never matched the query text. */}
        {relatedConcepts.length > 0 && (
          <CommandGroup heading="Related concepts" forceMount>
            {relatedConcepts.map((c) => {
              const topic = c.cluster_id ? topicById.get(c.cluster_id) : undefined
              return (
                <CommandItem
                  key={c.id}
                  value={`related:${c.id}`}
                  forceMount
                  onSelect={() => {
                    onPick(c.id)
                    handleOpenChange(false)
                  }}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="ml-auto flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    {topic && (
                      <span className="max-w-[140px] truncate">{topic}</span>
                    )}
                    <span>
                      {c.mentions} mention{c.mentions === 1 ? '' : 's'}
                    </span>
                  </span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        {passages.length > 0 && (
          <CommandGroup heading="Source passages" forceMount>
            {passages.map((p) => (
              <CommandItem
                key={p.chunk_id}
                value={`passage:${p.chunk_id}`}
                forceMount
                disabled={!p.target}
                onSelect={() => {
                  if (!p.target) return
                  onPick(p.target)
                  handleOpenChange(false)
                }}
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-xs text-muted-foreground">
                    {p.document_title}
                  </span>
                  <span className="line-clamp-2 text-sm">{p.snippet}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}

/** Pick the most-mentioned concept a passage touches, using the graph's loaded
 *  mention counts. Concepts missing from the graph (deleted/gated) are skipped;
 *  null when the passage mentions none that survive. */
function primaryConcept(
  conceptIds: string[],
  mentionsById: Map<string, number>,
): string | null {
  let best: string | null = null
  let bestMentions = -1
  for (const id of conceptIds) {
    const m = mentionsById.get(id)
    if (m === undefined) continue
    if (m > bestMentions) {
      bestMentions = m
      best = id
    }
  }
  return best
}
