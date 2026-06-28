'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import {
  type AskPassage,
  type ChatToolEvent,
  type GraphNode,
  chatStream,
  createConversation,
} from '@/lib/api'

// The in-product research agent, docked beside the graph. A multi-turn chat that
// streams the agent's tool activity, answer, sources, and cited concepts; the cited
// concepts light up on the canvas (via `onCited`) and a click jumps to a node
// (`onSelectConcept`). Kept always-mounted (slides in/out) so the conversation
// survives toggling the dock; "New chat" or a workspace change resets it.

type DisplayMsg = {
  role: 'user' | 'assistant'
  content: string
  sources: AskPassage[]
  tools: ChatToolEvent[]
  citedIds: string[]
}

// What the agent is doing, phrased for the student.
const TOOL_LABEL: Record<string, string> = {
  get_overview: 'Mapping the topics',
  find_concept: 'Finding the concept',
  search_passages: 'Searching passages',
  get_concept: 'Reading a concept',
}

export function ChatPanel({
  open,
  onClose,
  workspaceId,
  nodes,
  onCited,
  onSelectConcept,
}: {
  open: boolean
  onClose: () => void
  workspaceId: string | undefined
  nodes: GraphNode[]
  onCited: (ids: ReadonlySet<string>) => void
  onSelectConcept: (id: string) => void
}) {
  const [messages, setMessages] = useState<DisplayMsg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const conversationIdRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const nameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const n of nodes) m.set(n.id, n.name)
    return m
  }, [nodes])

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  // Rewrite the in-flight assistant turn (always the last message) immutably.
  const updateLast = useCallback((fn: (m: DisplayMsg) => DisplayMsg) => {
    setMessages((prev) => {
      if (!prev.length) return prev
      const next = prev.slice()
      next[next.length - 1] = fn(next[next.length - 1])
      return next
    })
  }, [])

  const newChat = useCallback(() => {
    abortRef.current?.abort()
    conversationIdRef.current = null
    setMessages([])
    setStreaming(false)
    onCited(new Set())
  }, [onCited])

  const send = useCallback(async () => {
    const content = input.trim()
    if (!content || streaming) return
    setInput('')
    setStreaming(true)
    setMessages((prev) => [
      ...prev,
      { role: 'user', content, sources: [], tools: [], citedIds: [] },
      { role: 'assistant', content: '', sources: [], tools: [], citedIds: [] },
    ])
    requestAnimationFrame(scrollToBottom)

    // Live highlight: union of concepts the agent surfaces as it works, replaced by
    // the authoritative cited set on `done`.
    const live = new Set<string>()
    try {
      if (!conversationIdRef.current) {
        const conv = await createConversation(workspaceId)
        conversationIdRef.current = conv.id
      }
      const ac = new AbortController()
      abortRef.current = ac
      await chatStream(
        conversationIdRef.current,
        content,
        {
          onTool: (ev) => updateLast((m) => ({ ...m, tools: [...m.tools, ev] })),
          onSources: (passages) => {
            updateLast((m) => {
              const byN = new Map(m.sources.map((s) => [s.n, s]))
              for (const p of passages) byN.set(p.n, p)
              return { ...m, sources: [...byN.values()].sort((a, b) => a.n - b.n) }
            })
            for (const p of passages) for (const c of p.concept_ids) live.add(c)
            onCited(new Set(live))
            requestAnimationFrame(scrollToBottom)
          },
          onDelta: (text) => {
            updateLast((m) => ({ ...m, content: m.content + text }))
            requestAnimationFrame(scrollToBottom)
          },
          onDone: (citedIds) => {
            updateLast((m) => ({ ...m, citedIds }))
            onCited(new Set(citedIds.length ? citedIds : live))
          },
          onError: (detail) =>
            updateLast((m) => ({ ...m, content: m.content || `⚠️ ${detail}` })),
        },
        ac.signal,
      )
    } catch (e) {
      const msg = (e as Error).message
      // Abort is expected on New chat / unmount — don't surface it.
      if (!/abort/i.test(msg)) {
        updateLast((m) => ({ ...m, content: m.content || `⚠️ ${msg}` }))
        toast.error(msg)
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }, [input, streaming, workspaceId, onCited, updateLast, scrollToBottom])

  return (
    <aside
      className={`absolute inset-y-0 right-0 z-30 flex w-96 flex-col border-l bg-background shadow-xl transition-transform duration-200 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-hidden={!open}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="text-sm font-semibold">Research agent</div>
        <div className="flex items-center gap-1">
          <button
            onClick={newChat}
            className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
          >
            New chat
          </button>
          <button
            onClick={onClose}
            aria-label="Close chat"
            className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
          >
            ✕
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Ask about your library. Try “I’m overwhelmed — where do I start with
            attention mechanisms?”
          </div>
        )}
        {messages.map((m, i) => (
          <ChatMessageView
            key={i}
            msg={m}
            nameById={nameById}
            onSelectConcept={onSelectConcept}
            streaming={
              streaming && i === messages.length - 1 && m.role === 'assistant'
            }
          />
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
        className="border-t p-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
          rows={2}
          placeholder="Message the agent…"
          className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            {streaming ? 'Thinking…' : 'Send'}
          </button>
        </div>
      </form>
    </aside>
  )
}

function ChatMessageView({
  msg,
  nameById,
  onSelectConcept,
  streaming,
}: {
  msg: DisplayMsg
  nameById: Map<string, string>
  onSelectConcept: (id: string) => void
  streaming: boolean
}) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
          {msg.content}
        </div>
      </div>
    )
  }
  // Before the first token lands we show a typing indicator instead of an empty
  // bubble; once text streams in, a soft caret trails the latest character.
  const awaitingFirstToken = streaming && !msg.content
  return (
    <div className="space-y-2">
      {msg.tools.length > 0 && <ToolActivity tools={msg.tools} streaming={streaming} />}
      {awaitingFirstToken && <TypingIndicator />}
      {msg.content && (
        <div className="text-sm leading-relaxed text-foreground">
          <Markdown>{msg.content}</Markdown>
          {streaming && (
            <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-foreground/60 align-middle" />
          )}
        </div>
      )}
      {msg.sources.length > 0 && (
        <Sources sources={msg.sources} onSelectConcept={onSelectConcept} />
      )}
      {msg.citedIds.length > 0 && (
        <CitedConcepts
          ids={msg.citedIds}
          nameById={nameById}
          onSelectConcept={onSelectConcept}
        />
      )}
    </div>
  )
}

// Three softly-bouncing dots — the "agent is thinking" cue shown until the first
// token arrives. Staggered delays give the Claude/Gemini-style wave.
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1" aria-label="Agent is thinking">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50"
          style={{ animationDelay: `${delay}ms`, animationDuration: '1s' }}
        />
      ))}
    </div>
  )
}

function ToolActivity({
  tools,
  streaming,
}: {
  tools: ChatToolEvent[]
  streaming: boolean
}) {
  // Distinct tools used, in order — a compact trace of how the agent worked.
  const steps: string[] = []
  for (const t of tools) {
    if (t.status !== 'started') continue
    const label = TOOL_LABEL[t.name] ?? t.name
    if (steps[steps.length - 1] !== label) steps.push(label)
  }
  if (!steps.length) return null
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      {streaming && (
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary/70" />
      )}
      <span className="truncate">{steps.join(' · ')}</span>
    </div>
  )
}

function Sources({
  sources,
  onSelectConcept,
}: {
  sources: AskPassage[]
  onSelectConcept: (id: string) => void
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-2">
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Sources
      </div>
      <ol className="space-y-1.5">
        {sources.map((s) => (
          <li key={s.n} className="text-xs">
            <button
              onClick={() => s.concept_ids[0] && onSelectConcept(s.concept_ids[0])}
              className="block w-full text-left hover:opacity-80"
            >
              <span className="font-medium text-foreground">[{s.n}]</span>{' '}
              <span className="text-foreground">{s.document_title}</span>
              <span className="mt-0.5 block line-clamp-2 text-muted-foreground">
                {s.snippet}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

// Renders the agent's answer as markdown. No `prose` plugin in this project, so
// each element carries its own spacing/weight — enough for the bold, lists, and
// headings the agent emits without dragging in a typography dependency.
function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => (
          <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        h1: ({ children }) => (
          <h1 className="mb-1.5 mt-2 text-base font-semibold first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-1.5 mt-2 text-sm font-semibold first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-1 mt-2 text-sm font-semibold first:mt-0">{children}</h3>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2 hover:opacity-80"
          >
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="mb-2 overflow-x-auto rounded-md bg-muted p-2 text-xs last:mb-0">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-2 border-border pl-3 text-muted-foreground last:mb-0">
            {children}
          </blockquote>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  )
}

function CitedConcepts({
  ids,
  nameById,
  onSelectConcept,
}: {
  ids: string[]
  nameById: Map<string, string>
  onSelectConcept: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      <span className="text-[11px] text-muted-foreground">Concepts cited:</span>
      {ids.map((id) => (
        <button
          key={id}
          onClick={() => onSelectConcept(id)}
          className="rounded-full border bg-background px-2 py-0.5 text-[11px] text-foreground hover:bg-muted"
        >
          {nameById.get(id) ?? 'concept'}
        </button>
      ))}
    </div>
  )
}
