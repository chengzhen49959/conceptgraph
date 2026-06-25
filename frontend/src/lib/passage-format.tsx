'use client'

import { useMemo } from 'react'

// Shared passage rendering for the concept panel's Sources and the chip/node hover
// preview: trim a chunk to a readable window around a term, then highlight the term.

const SNIPPET_BEFORE = 120 // chars kept before the matched term
const SNIPPET_AFTER = 160 // chars kept after it
const FALLBACK_LEN = 240 // head of the chunk shown when no term is found

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** A readable window of `content` around the first occurrence of any term, with
 *  the term preserved for highlighting. Chunks are ~512 tokens, so showing the
 *  whole thing would bury the mention; this trims to the sentence or two around
 *  it. Falls back to the head of the chunk when no term matches (alias morphology,
 *  stemming, casing the search missed). */
export function snippetAround(content: string, terms: string[]): string {
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

/** Renders `text` with every occurrence of any term wrapped in <mark>. Terms are
 *  matched case-insensitively and as plain substrings (no word boundary — Chinese
 *  has none). Longest-first so a term isn't pre-empted by a shorter prefix. */
export function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  const re = useMemo(() => {
    const valid = terms
      .filter(Boolean)
      .map(escapeRegExp)
      .sort((a, b) => b.length - a.length)
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
