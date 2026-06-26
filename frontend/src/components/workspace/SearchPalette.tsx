'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, Sparkles } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  askStream,
  search,
  type AskContext,
  type GraphCluster,
  type GraphNode,
} from '@/lib/api'

const DEBOUNCE_MS = 250
const MIN_QUERY = 2

// A citation is one or more bracketed 1-based indices: [3], [1][2], or [1, 2].
// Mirrors the backend's `parse_citations` so the graph can light cited concepts
// live as the answer streams, before the authoritative `done` set arrives.
const CITATION_RE = /\[(\d+(?:\s*[,;]\s*\d+)*)\]/g

function citedIndices(answer: string): Set<number> {
  const out = new Set<number>()
  for (const m of answer.matchAll(CITATION_RE)) {
    for (const tok of m[1].split(/[,;]/)) {
      const n = Number(tok.trim())
      if (Number.isInteger(n) && n > 0) out.add(n)
    }
  }
  return out
}

/** Concept ids the answer-so-far cites, mapped n → passage → concept_ids. Used for
 *  the live highlight while streaming; `done` later supplies the final set. */
function citedConceptIds(answer: string, ctx: AskContext | null): Set<string> {
  const ids = new Set<string>()
  if (!ctx) return ids
  const byN = new Map(ctx.passages.map((p) => [p.n, p.concept_ids]))
  for (const n of citedIndices(answer)) {
    for (const cid of byN.get(n) ?? []) ids.add(cid)
  }
  return ids
}

export function SearchPalette({
  open,
  onOpenChange,
  nodes,
  clusters,
  workspaceId,
  onPick,
  onPickTopic,
  onCited,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodes: GraphNode[]
  clusters: GraphCluster[]
  workspaceId?: string
  onPick: (id: string) => void
  onPickTopic: (id: string) => void
  // Concepts the streamed answer relies on — the graph lights these and dims the
  // rest. Updated live as the answer streams; settles on the `done` set. Empty set
  // clears the highlight.
  onCited: (ids: ReadonlySet<string>) => void
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

  // Ask mode (F8 RAG Q&A): the same palette, switched to a streamed, cited answer.
  // `null` = search mode; a string = the question being answered.
  const [askQuestion, setAskQuestion] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [askCtx, setAskCtx] = useState<AskContext | null>(null)
  const [askError, setAskError] = useState<string | null>(null)
  const [streaming, setStreaming] = useState(false)
  const askAbortRef = useRef<AbortController | null>(null)

  // Reset everything that's per-session: invalidate in-flight fetches, drop the
  // answer, return to search mode. Does NOT clear the graph highlight — the lit
  // concepts persist on the canvas after the palette closes (that's the reveal).
  const resetTransient = () => {
    seqRef.current++
    askAbortRef.current?.abort()
    setQuery('')
    setRelated(null)
    setLoading(false)
    setAskQuestion(null)
    setAnswer('')
    setAskCtx(null)
    setAskError(null)
    setStreaming(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) resetTransient()
    onOpenChange(next)
  }

  // Leave ask mode back to search — abort any in-flight answer but keep the query so
  // the user can refine it. The graph highlight stays until they pick or ask again.
  const exitAsk = () => {
    askAbortRef.current?.abort()
    setStreaming(false)
    setAskQuestion(null)
    setAnswer('')
    setAskCtx(null)
    setAskError(null)
  }

  // Fire a question: switch to ask mode, stream the answer, light cited concepts on
  // the graph live (parsed from the partial answer) and authoritatively on `done`.
  const runAsk = (raw: string) => {
    const question = raw.trim()
    if (question.length < MIN_QUERY) return
    askAbortRef.current?.abort()
    const ac = new AbortController()
    askAbortRef.current = ac

    setAskQuestion(question)
    setAnswer('')
    setAskCtx(null)
    setAskError(null)
    setStreaming(true)
    onCited(new Set())

    let acc = ''
    let ctx: AskContext | null = null
    askStream(
      question,
      workspaceId,
      {
        onContext: (c) => {
          ctx = c
          setAskCtx(c)
        },
        onDelta: (t) => {
          acc += t
          setAnswer(acc)
          onCited(citedConceptIds(acc, ctx))
        },
        onDone: (ids) => {
          setStreaming(false)
          onCited(new Set(ids))
        },
        onError: (detail) => {
          setAskError(detail)
          setStreaming(false)
        },
      },
      ac.signal,
    ).catch((e: unknown) => {
      if (ac.signal.aborted) return
      setAskError((e as Error).message)
      setStreaming(false)
    })
  }

  // Debounced vector recall (search mode only). Every state update happens inside
  // the timer callback; a short query just skips the fetch and the render gates any
  // stale results out by length.
  useEffect(() => {
    if (askQuestion !== null) return // ask mode owns the surface; no search fetch
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
  }, [query, workspaceId, mentionsById, askQuestion])

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
      title={askQuestion !== null ? 'Ask the library' : 'Search concepts'}
      description={
        askQuestion !== null
          ? 'A cited answer from your library, with the concepts it relies on lit on the graph'
          : 'Find a concept or topic and jump to it in the graph'
      }
    >
      <CommandInput
        placeholder={
          askQuestion !== null
            ? 'Ask a follow-up, or press ← to search…'
            : 'Search concepts, topics, or ask a question…'
        }
        value={query}
        onValueChange={setQuery}
        onKeyDown={(e) => {
          // In ask mode the input is a question box: Enter re-asks, Esc/← go back.
          if (askQuestion !== null && e.key === 'Enter' && query.trim()) {
            e.preventDefault()
            runAsk(query)
          }
        }}
      />

      {askQuestion !== null ? (
        <AskView
          question={askQuestion}
          answer={answer}
          ctx={askCtx}
          error={askError}
          streaming={streaming}
          mentionsById={mentionsById}
          onBack={exitAsk}
          onPickConcept={(id) => {
            onPick(id)
            handleOpenChange(false)
          }}
        />
      ) : (
        <CommandList>
          {showEmpty && <CommandEmpty>No matches found.</CommandEmpty>}

          {/* Ask affordance — explicit, top of the list, so Enter on a typed query
              answers it. Always mounted (forceMount) so cmdk's filter never hides it. */}
          {active && (
            <CommandGroup heading="Ask" forceMount>
              <CommandItem
                value={`ask:${query}`}
                forceMount
                onSelect={() => runAsk(query)}
              >
                <Sparkles className="size-4 text-muted-foreground" />
                <span className="truncate">
                  Ask the library: <span className="font-medium">“{query.trim()}”</span>
                </span>
              </CommandItem>
            </CommandGroup>
          )}

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
      )}
    </CommandDialog>
  )
}

/** The streamed answer surface: the question, the cited answer (with `[n]` markers
 *  rendered as chips that jump to the passage's concept), its sources, and the
 *  concepts it relied on. */
function AskView({
  question,
  answer,
  ctx,
  error,
  streaming,
  mentionsById,
  onBack,
  onPickConcept,
}: {
  question: string
  answer: string
  ctx: AskContext | null
  error: string | null
  streaming: boolean
  mentionsById: Map<string, number>
  onBack: () => void
  onPickConcept: (id: string) => void
}) {
  // n → the concept a citation chip jumps to (the passage's most-prominent concept).
  const targetByN = useMemo(() => {
    const m = new Map<number, string | null>()
    for (const p of ctx?.passages ?? [])
      m.set(p.n, primaryConcept(p.concept_ids, mentionsById))
    return m
  }, [ctx, mentionsById])

  // Concept id → display name, for the "Cited concepts" chips.
  const nameById = useMemo(
    () => new Map((ctx?.concepts ?? []).map((c) => [c.id, c.name])),
    [ctx],
  )

  // Concepts the answer actually cites (deduped, in first-citation order).
  const citedConcepts = useMemo(() => {
    const seen = new Set<string>()
    const out: { id: string; name: string }[] = []
    const byN = new Map((ctx?.passages ?? []).map((p) => [p.n, p.concept_ids]))
    for (const n of [...citedIndices(answer)].sort((a, b) => a - b)) {
      for (const id of byN.get(n) ?? []) {
        if (seen.has(id)) continue
        seen.add(id)
        out.push({ id, name: nameById.get(id) ?? '' })
      }
    }
    return out.filter((c) => c.name)
  }, [answer, ctx, nameById])

  return (
    <div className="max-h-[60vh] overflow-y-auto p-3 text-sm">
      <button
        type="button"
        onClick={onBack}
        className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to search
      </button>

      <p className="mb-2 font-medium">{question}</p>

      {error ? (
        <p className="rounded-md bg-destructive/10 p-2 text-destructive">{error}</p>
      ) : (
        <div className="leading-relaxed whitespace-pre-wrap">
          {renderAnswer(answer, targetByN, onPickConcept)}
          {streaming && (
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-foreground/60 align-text-bottom" />
          )}
        </div>
      )}

      {citedConcepts.length > 0 && (
        <div className="mt-3 border-t pt-2">
          <p className="mb-1 text-xs text-muted-foreground">Concepts cited</p>
          <div className="flex flex-wrap gap-1.5">
            {citedConcepts.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onPickConcept(c.id)}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary hover:bg-primary/20"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {ctx && ctx.passages.length > 0 && (
        <div className="mt-3 border-t pt-2">
          <p className="mb-1 text-xs text-muted-foreground">Sources</p>
          <ol className="space-y-1.5">
            {ctx.passages.map((p) => (
              <li key={p.chunk_id} className="flex gap-2">
                <span className="shrink-0 text-xs text-muted-foreground">[{p.n}]</span>
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground">
                    {p.document_title}
                  </p>
                  <p className="line-clamp-2 text-xs">{p.snippet}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

/** Render the answer text, turning each `[n]` citation into a small chip that jumps
 *  to that passage's concept. Plain text between markers is rendered as-is. */
function renderAnswer(
  text: string,
  targetByN: Map<number, string | null>,
  onPickConcept: (id: string) => void,
): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let key = 0
  for (const m of text.matchAll(CITATION_RE)) {
    const start = m.index ?? 0
    if (start > last) out.push(text.slice(last, start))
    let producedChip = false
    for (const tok of m[1].split(/[,;]/)) {
      const n = Number(tok.trim())
      if (!Number.isInteger(n) || n <= 0) continue
      producedChip = true
      const target = targetByN.get(n) ?? null
      out.push(
        <button
          key={`c${key++}`}
          type="button"
          disabled={!target}
          onClick={() => target && onPickConcept(target)}
          className="mx-0.5 rounded bg-muted px-1 align-super text-[0.65rem] text-muted-foreground hover:bg-primary/20 hover:text-primary disabled:cursor-default disabled:hover:bg-muted disabled:hover:text-muted-foreground"
        >
          {n}
        </button>,
      )
    }
    // A bracket with no valid (>0) index (e.g. `arr[0]`) isn't a citation — keep it
    // as literal text instead of swallowing it.
    if (!producedChip) out.push(m[0])
    last = start + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
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
