'use client'

import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ExternalLink, Loader2, X } from 'lucide-react'
import type { DocumentContent } from '@/lib/api'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { DocumentOutline, type Heading } from './DocumentOutline'
import { ConceptHoverCard } from './ConceptHoverCard'

/**
 * The reading view — the source-text counterpart of the graph. Renders a
 * document's parsed Markdown and turns every mention of one of its concepts into
 * a clickable chip that hands off to the graph (provenance: "this concept came
 * from here"). Purely presentational: the parent owns the fetch and passes the
 * payload + loading flag in.
 */

// The slice of the hast tree we walk. Kept local so the file needs no `hast`
// type dependency; the shape we touch (text/element/children) is stable.
type HNode = {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HNode[]
}

type Matcher = { regex: RegExp; byKey: Map<string, string> } | null

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Bare host for the source chip (drops www.). Null on an unparseable URL — the
// header falls back to the plain "Original" link then.
function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

// A word char for JS `\b` purposes (ASCII only — `\b` does not see CJK as a word
// edge, which is exactly why a blanket `\b(?:…)\b` never matched Chinese names).
const WORD_EDGE = /[A-Za-z0-9_]/

// Per-term boundary: guard a term with `\b` only on the side that starts/ends with
// an ASCII word char. Latin names keep "cat" from matching inside "category"; CJK
// names (no ASCII edge) match bare, even when flanked by other Han characters.
function boundedAlt(key: string): string {
  const left = WORD_EDGE.test(key[0]) ? '\\b' : ''
  const right = WORD_EDGE.test(key[key.length - 1]) ? '\\b' : ''
  return left + escapeRegExp(key) + right
}

// One case-insensitive alternation over every concept name + alias, longest first
// so "self-attention" wins over "attention". Boundaries are baked per-term (see
// boundedAlt) so Latin and CJK names both link correctly. Null when there is
// nothing to match — keeps the render path branchless for concept-less docs.
function buildMatcher(concepts: DocumentContent['concepts']): Matcher {
  const byKey = new Map<string, string>()
  for (const c of concepts) {
    for (const s of [c.name, ...c.aliases]) {
      const key = s.trim().toLowerCase()
      if (key) byKey.set(key, c.id) // dup spellings collapse to one concept
    }
  }
  if (byKey.size === 0) return null
  const alts = [...byKey.keys()]
    .sort((a, b) => b.length - a.length)
    .map(boundedAlt)
    .join('|')
  return { regex: new RegExp(`(?:${alts})`, 'gi'), byKey }
}

// Don't relink inside code (changes meaning) or existing links (invalid nesting).
const SKIP_TAGS = new Set(['code', 'pre', 'a'])

function splitText(value: string, matcher: NonNullable<Matcher>): HNode[] {
  const { regex, byKey } = matcher
  regex.lastIndex = 0
  const out: HNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = regex.exec(value)) !== null) {
    const id = byKey.get(m[0].toLowerCase())
    if (id) {
      if (m.index > last)
        out.push({ type: 'text', value: value.slice(last, m.index) })
      out.push({
        type: 'element',
        tagName: 'conceptref',
        properties: { conceptId: id },
        children: [{ type: 'text', value: m[0] }],
      })
      last = m.index + m[0].length
    }
    if (regex.lastIndex === m.index) regex.lastIndex++ // guard zero-width matches
  }
  if (last < value.length) out.push({ type: 'text', value: value.slice(last) })
  return out.length ? out : [{ type: 'text', value }]
}

// A rehype plugin that swaps concept mentions inside text nodes for <conceptref>
// elements carrying the concept id, which the components map renders as chips.
// Walks in place, skipping code/links. Dependency-free (no unist-util-visit).
function highlightConcepts(matcher: Matcher) {
  return () => (tree: HNode) => {
    if (!matcher) return
    const walk = (node: HNode) => {
      if (!node.children) return
      if (node.tagName && SKIP_TAGS.has(node.tagName)) return
      const next: HNode[] = []
      for (const child of node.children) {
        if (child.type === 'text' && typeof child.value === 'string') {
          next.push(...splitText(child.value, matcher))
        } else {
          walk(child)
          next.push(child)
        }
      }
      node.children = next
    }
    walk(tree)
  }
}

const HEADING_TAG = /^h[1-6]$/

// Stamp every heading with a sequential id (`heading-0`, `heading-1`, …) so the
// outline can scroll to it. Reading the outline back from these rendered headings
// (DOM order = walk order) keeps the list and its anchors in lockstep — no second
// Markdown parse that could disagree (e.g. on setext headings).
function annotateHeadings() {
  return () => (tree: HNode) => {
    let n = 0
    const walk = (node: HNode) => {
      if (!node.children) return
      for (const child of node.children) {
        if (child.type === 'element' && child.tagName && HEADING_TAG.test(child.tagName)) {
          child.properties = { ...(child.properties ?? {}), id: `heading-${n++}` }
        }
        walk(child)
      }
    }
    walk(tree)
  }
}

// Reading-view typography, scoped via arbitrary variants so the file carries its
// own styling without the @tailwindcss/typography plugin.
const PROSE =
  'max-w-3xl text-sm leading-7 text-foreground/90 ' +
  '[&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-foreground ' +
  '[&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground ' +
  '[&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground ' +
  '[&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 ' +
  '[&_li]:my-1 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border ' +
  '[&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground ' +
  '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] ' +
  '[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4 ' +
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-semibold ' +
  '[&_table]:my-4 [&_table]:w-full [&_table]:text-left [&_th]:border [&_th]:border-border [&_th]:p-2 ' +
  '[&_td]:border [&_td]:border-border [&_td]:p-2 [&_img]:my-4 [&_img]:max-w-full [&_hr]:my-6 [&_hr]:border-border'

export function DocumentReader({
  content,
  loading,
  onClose,
  onSelectConcept,
  scrollToConceptId,
  onActiveConceptChange,
  localGraph,
}: {
  content: DocumentContent | null
  loading: boolean
  onClose: () => void
  onSelectConcept: (id: string) => void
  // The document's local-graph thumbnail (Obsidian's 关系图谱). Rendered in the
  // right rail above the outline, for the text path only (a web clip is an iframe of
  // the live page, no rail). The parent owns it so the graph keeps its full wiring.
  localGraph?: ReactNode
  // When set (and present in this doc), scroll the prose to that concept's first
  // mention and pulse it. Drives both "open in reader" jumps and graph→text sync.
  scrollToConceptId?: string | null
  // Reports the concept whose mention is currently nearest the top of the reader as
  // you scroll (text→graph sync); null when none is in view. Must be stable.
  onActiveConceptChange?: (id: string | null) => void
}) {
  // A web clip carries its origin URL; a file upload never does. That single flag
  // splits the two reading modes the user asked for: a clip shows its *original
  // page* (embedded), an upload shows its *parsed source text* (with inline concept
  // links). source_url is the same discriminator the backend uses (documents.py).
  const sourceUrl = content?.source_url ?? null
  const isWeb = sourceUrl !== null
  const host = sourceUrl ? hostOf(sourceUrl) : null

  // The prose scroll container. Concept-jump + sync effects query
  // `[data-concept-id]` chips inside it and scroll within it (not the window).
  const scrollRef = useRef<HTMLDivElement>(null)

  const matcher = useMemo(
    () => buildMatcher(content?.concepts ?? []),
    [content?.concepts],
  )
  // Canonical name per concept id, for the hover preview's title (the chip's own
  // text is the surface form, which may be an alias).
  const conceptNameById = useMemo(
    () => new Map((content?.concepts ?? []).map((c) => [c.id, c.name])),
    [content?.concepts],
  )

  // Derive the plugin/component prop types straight from <Markdown> so this file
  // needs no `unified`/`hast` type imports. The casts bridge our local HNode shape
  // to react-markdown's; the runtime contract (tree walk, custom tag) is unchanged.
  type MdProps = ComponentProps<typeof Markdown>
  const rehypePlugins = useMemo(
    () =>
      [highlightConcepts(matcher), annotateHeadings()] as unknown as MdProps['rehypePlugins'],
    [matcher],
  )
  const components = useMemo(
    () =>
      ({
        conceptref: ({
          node,
          children,
        }: {
          node?: HNode
          children?: ReactNode
        }) => {
          const id = node?.properties?.conceptId as string | undefined
          if (!id) return <>{children}</>
          return (
            <HoverCard>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  data-concept-id={id}
                  onClick={() => onSelectConcept(id)}
                  className="rounded-sm bg-primary/10 px-0.5 font-medium text-primary underline-offset-2 hover:bg-primary/20 hover:underline"
                >
                  {children}
                </button>
              </HoverCardTrigger>
              <HoverCardContent>
                <ConceptHoverCard conceptId={id} name={conceptNameById.get(id) ?? ''} />
              </HoverCardContent>
            </HoverCard>
          )
        },
      }) as unknown as MdProps['components'],
    [onSelectConcept, conceptNameById],
  )

  // Outline, read straight back from the rendered headings (the rehype plugin
  // stamped their ids) so the list and its scroll anchors can never disagree.
  // Re-reads whenever the document body changes; null container / web clip / empty
  // body all collapse to no outline.
  const [headings, setHeadings] = useState<Heading[]>([])
  useEffect(() => {
    const root = scrollRef.current
    if (isWeb || loading || !content?.markdown || !root) {
      setHeadings([])
      return
    }
    const els = root.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6')
    setHeadings(
      Array.from(els).map((el) => ({
        id: el.id,
        depth: Number(el.tagName[1]),
        text: el.textContent?.trim() ?? '',
      })),
    )
  }, [content?.markdown, loading, isWeb])
  const showOutline = headings.length > 1

  // Scroll the prose to a concept's first mention and pulse it. The chips may not
  // be painted the instant a doc opens, so wait for them via MutationObserver, then
  // give up after a moment. Matched against the rendered `data-concept-id` chips —
  // a future re-ingest storing per-mention offsets could anchor this exactly
  // instead of to the first string match.
  useEffect(() => {
    const root = scrollRef.current
    if (!scrollToConceptId || isWeb || !root || !content?.markdown) return
    const sel = `[data-concept-id="${scrollToConceptId}"]`
    const tryScroll = () => {
      const el = root.querySelector<HTMLElement>(sel)
      if (!el) return false
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.remove('concept-pulse')
      void el.offsetWidth // reflow so re-adding restarts the animation
      el.classList.add('concept-pulse')
      return true
    }
    if (tryScroll()) return
    const obs = new MutationObserver(() => {
      if (tryScroll()) obs.disconnect()
    })
    obs.observe(root, { childList: true, subtree: true })
    const timer = window.setTimeout(() => obs.disconnect(), 3000)
    return () => {
      obs.disconnect()
      window.clearTimeout(timer)
    }
  }, [scrollToConceptId, content?.id, content?.markdown, isWeb])

  // text→graph sync: report the concept whose chip is nearest the top of the
  // reader as you scroll, so the graph can highlight it. One IntersectionObserver
  // over the chips (cheap, async); the upper-40% band (`-60%` bottom margin) keeps
  // "active" to what you're actually reading. Throttled to a frame and de-duped so
  // it only fires on a real change.
  useEffect(() => {
    const root = scrollRef.current
    if (!onActiveConceptChange || isWeb || !root || !content?.markdown) return
    const chips = Array.from(root.querySelectorAll<HTMLElement>('[data-concept-id]'))
    if (chips.length === 0) return
    const visible = new Set<HTMLElement>()
    let raf = 0
    let lastId: string | null = null
    const recompute = () => {
      let top: HTMLElement | null = null
      let topY = Infinity
      for (const el of visible) {
        const y = el.getBoundingClientRect().top
        if (y < topY) {
          topY = y
          top = el
        }
      }
      const id = top?.getAttribute('data-concept-id') ?? null
      if (id !== lastId) {
        lastId = id
        onActiveConceptChange(id)
      }
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target as HTMLElement)
          else visible.delete(e.target as HTMLElement)
        }
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(recompute)
      },
      { root, rootMargin: '0px 0px -60% 0px', threshold: 0 },
    )
    chips.forEach((c) => obs.observe(c))
    return () => {
      obs.disconnect()
      cancelAnimationFrame(raf)
      onActiveConceptChange(null)
    }
  }, [content?.id, content?.markdown, isWeb, onActiveConceptChange])

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <header className="flex items-center gap-2 border-b px-4 py-2">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold" title={content?.title}>
            {content?.title ?? 'Loading…'}
          </h2>
          {host && (
            <p className="truncate text-xs text-muted-foreground" title={sourceUrl ?? undefined}>
              {host}
            </p>
          )}
        </div>
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ExternalLink className="size-3.5" />
            Original
          </a>
        )}
        <button
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Close reader"
        >
          <X className="size-4" />
        </button>
      </header>

      {isWeb && sourceUrl && !loading ? (
        // Web clip: show the original page itself, embedded. The clip's parsed
        // text still feeds the graph; here the user asked to read the *source URL*.
        // A site that refuses framing renders blank — the header keeps a working
        // "Original ↗" link for that case.
        <iframe
          src={sourceUrl}
          title={content?.title ?? 'Source page'}
          className="min-h-0 w-full flex-1 border-0 bg-white"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex min-h-0 flex-1">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
            {loading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : content?.markdown ? (
              <div className={PROSE}>
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={rehypePlugins}
                  components={components}
                >
                  {content.markdown}
                </Markdown>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                <p className="text-sm">
                  Source text isn’t available for this document yet.
                </p>
                {sourceUrl && (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary underline"
                  >
                    Open the original ↗
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Right rail (Obsidian's panel stack): the document's local-graph
              panel on top, the heading outline below. Hidden on narrow widths. */}
          {(localGraph || showOutline) && (
            <aside className="hidden w-64 shrink-0 flex-col border-l md:flex">
              {localGraph && <div className="shrink-0 border-b">{localGraph}</div>}
              {showOutline && (
                <DocumentOutline
                  headings={headings}
                  containerRef={scrollRef}
                  className="min-h-0 flex-1"
                />
              )}
            </aside>
          )}
        </div>
      )}
    </div>
  )
}
