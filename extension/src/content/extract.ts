// The only client-side processing: pull the page's main content out as Markdown.
// Injected on demand by the popup (chrome.scripting), then answers an EXTRACT
// message. Mozilla Readability isolates the article (strips nav/ads/sidebar/footer);
// Turndown converts that HTML to Markdown so headings, links, lists, code and tables
// survive instead of one wall of text. Page math (MathML) is pulled to $…$ LaTeX
// *before* Readability runs, since Readability would otherwise strip every <math>.
// Selection mode runs the same path on the highlighted HTML. We send only Markdown.
import { Readability } from '@mozilla/readability'
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'

export type ExtractScope = 'page' | 'selection'

// Page metadata scraped from the DOM. All optional — absent keys are omitted.
export interface ClipMetadata {
  author?: string
  publishedAt?: string
  siteName?: string
  image?: string
  description?: string
}

export interface ExtractResult {
  ok: boolean
  title: string
  text: string // Markdown
  sourceUrl: string
  metadata: ClipMetadata
  reason?: string // human-readable why, when ok === false
}

// --- Math (Wikipedia / MathML) → LaTeX, handled BEFORE Readability ------------------
// Readability scores <math> nodes as non-content and strips them outright, so a
// Turndown rule never sees them. Instead we walk the live DOM first, swap each math
// element for an inert text placeholder, and record its LaTeX; the placeholder is plain
// text that survives both Readability's pruning AND Turndown's backslash/underscore
// escaping (which would corrupt raw TeX), then gets substituted back to $…$ / $$…$$
// after Markdown conversion. Same path covers whole-page and selection.

// Pull the LaTeX source out of a math element: prefer the MathML <annotation>, fall
// back to the rendered image's alt. Strip the {\displaystyle …} / {\textstyle …}
// wrapper Wikipedia adds so the bare TeX reaches the graph.
function mathTex(el: Element): string | null {
  const ann = el.querySelector('annotation[encoding="application/x-tex"]')?.textContent
  const img = el.nodeName === 'IMG' ? el : el.querySelector('img')
  const tex = (ann ?? img?.getAttribute('alt') ?? '')
    .trim()
    .replace(/^\{\\(?:display|text)style\s*/, '')
    .replace(/\}\s*$/, '')
    .trim()
  return tex || null
}

// Bracket chars that don't occur in prose and aren't regex/Markdown-special, so nothing
// between here and restoreMath() mangles the token.
const mathToken = (i: number) => ` ⟦MATH${i}⟧ `

// Replace every math element under `root` with a placeholder, returning the index→LaTeX
// map. Mutates `root` (callers pass a document clone or a throwaway container).
function inlineMath(root: ParentNode): string[] {
  const map: string[] = []
  for (const el of Array.from(root.querySelectorAll('.mwe-math-element'))) {
    const tex = mathTex(el)
    if (!tex) continue
    const block =
      el.querySelector('math')?.getAttribute('display') === 'block' ||
      !!el.querySelector('.mwe-math-fallback-image-display')
    const i = map.push(block ? `\n\n$$\n${tex}\n$$\n\n` : `$${tex.replace(/\s+/g, ' ')}$`) - 1
    el.replaceWith(el.ownerDocument.createTextNode(mathToken(i)))
  }
  return map
}

function restoreMath(markdown: string, map: string[]): string {
  return markdown.replace(/⟦MATH(\d+)⟧/g, (_, i) => map[+i] ?? '')
}

function htmlToMarkdown(html: string): string {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    hr: '---',
  })
  td.use(gfm) // tables, strikethrough, task lists
  td.remove(['script', 'style', 'noscript']) // no reading value if any survived
  // Drop images: the graph ingests text, so `![](src)` is pure noise, and a leading
  // hero image made the preview look like the clip had grabbed the wrong thing.
  // addRule (not .remove) because Turndown's built-in image rule otherwise wins.
  td.addRule('dropImage', { filter: 'img', replacement: () => '' })
  // Flatten links to their visible text. Full hrefs + title attrs roughly DOUBLE the
  // payload (every Wikipedia wiki-link carries a URL) while adding nothing the concept
  // extractor reads — and each ~512-token chunk is one LLM call downstream.
  td.addRule('plainLink', { filter: 'a', replacement: (content) => content })
  return td.turndown(html).trim()
}

// First non-empty <meta> content across name= and property= variants.
function metaContent(keys: string[]): string | undefined {
  for (const key of keys) {
    const el =
      document.querySelector(`meta[property="${key}"]`) ??
      document.querySelector(`meta[name="${key}"]`)
    const content = el?.getAttribute('content')?.trim()
    if (content) return content
  }
  return undefined
}

// The first Article-like JSON-LD node on the page (schema.org), if any.
function articleJsonLd(): Record<string, any> | undefined {
  const TYPES = [
    'Article', 'NewsArticle', 'BlogPosting', 'TechArticle', 'ScholarlyArticle', 'Report',
  ]
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const data = JSON.parse(script.textContent ?? '')
      const nodes = Array.isArray(data) ? data : [data, ...(data['@graph'] ?? [])]
      const hit = nodes.find((node: any) => {
        const t = node?.['@type']
        return Array.isArray(t) ? t.some((x: string) => TYPES.includes(x)) : TYPES.includes(t)
      })
      if (hit) return hit
    } catch {
      /* malformed JSON-LD — skip */
    }
  }
  return undefined
}

function scrapeMetadata(): ClipMetadata {
  const ld = articleJsonLd()
  const ldAuthor =
    typeof ld?.author === 'string' ? ld.author : ld?.author?.name ?? ld?.author?.[0]?.name
  const meta: ClipMetadata = {
    author:
      metaContent(['author', 'article:author']) ??
      (typeof ldAuthor === 'string' ? ldAuthor : undefined),
    publishedAt:
      metaContent(['article:published_time']) ??
      ld?.datePublished ??
      document.querySelector('time[datetime]')?.getAttribute('datetime') ??
      undefined,
    siteName: metaContent(['og:site_name']) ?? location.hostname,
    image: metaContent(['og:image', 'twitter:image']) ?? undefined,
    description: metaContent(['description', 'og:description']) ?? ld?.description ?? undefined,
  }
  // Omit empty keys so the stored JSON stays clean.
  return Object.fromEntries(Object.entries(meta).filter(([, v]) => v)) as ClipMetadata
}

// Clone the current selection (across ranges) into a detached container, so it runs
// through the same math-inlining + Markdown conversion as a whole page. Returns null
// when nothing is selected.
function selectionContainer(): HTMLElement | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null
  const container = document.createElement('div')
  for (let i = 0; i < sel.rangeCount; i++) {
    container.appendChild(sel.getRangeAt(i).cloneContents())
  }
  return container
}

function extract(scope: ExtractScope): ExtractResult {
  const sourceUrl = location.href
  const fallbackTitle = document.title || sourceUrl
  const metadata = scrapeMetadata()

  if (scope === 'selection') {
    const container = selectionContainer()
    const mathMap = container ? inlineMath(container) : []
    const text = container ? restoreMath(htmlToMarkdown(container.innerHTML), mathMap) : ''
    return {
      ok: text.length > 0,
      title: fallbackTitle,
      text,
      sourceUrl,
      metadata,
      reason: text ? undefined : 'No text is selected on the page.',
    }
  }

  // Readability mutates the document it parses, so hand it a clone. Inline the page's
  // math into placeholder tokens BEFORE Readability runs (it strips <math> nodes), then
  // restore them to LaTeX after Markdown conversion.
  try {
    const docClone = document.cloneNode(true) as Document
    const mathMap = inlineMath(docClone)
    const article = new Readability(docClone).parse()
    const text = restoreMath(htmlToMarkdown(article?.content ?? ''), mathMap)
    return {
      ok: text.length > 0,
      title: (article?.title || fallbackTitle).trim(),
      text,
      sourceUrl,
      metadata,
      reason: text ? undefined : "Couldn't extract readable text from this page.",
    }
  } catch {
    return {
      ok: false,
      title: fallbackTitle,
      text: '',
      sourceUrl,
      metadata,
      reason: "Couldn't extract readable text from this page.",
    }
  }
}

// Self-guard: the popup re-injects this file every time it opens, so register
// the listener at most once per page to avoid duplicate responders.
const w = window as unknown as { __graphClipperLoaded?: boolean }
if (!w.__graphClipperLoaded) {
  w.__graphClipperLoaded = true
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'EXTRACT') {
      sendResponse(extract(msg.scope as ExtractScope))
    }
    return true
  })
}
