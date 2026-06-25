'use client'

import { type RefObject, useEffect, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

/** A rendered heading: its stamped id, level (1–6), and visible text. */
export type Heading = { id: string; depth: number; text: string }

/**
 * The reading view's "On this page" outline (Obsidian's 本页面目录). Mirrors the
 * document's headings; clicking one scrolls the prose, and an IntersectionObserver
 * scoped to the scroll container keeps the current section highlighted as you read.
 * Headings are passed in already read from the DOM, so anchors always resolve.
 */
export function DocumentOutline({
  headings,
  containerRef,
  className,
}: {
  headings: Heading[]
  containerRef: RefObject<HTMLElement | null>
  // The parent rail owns width/borders now (graph thumbnail above, outline below),
  // so the outline just fills the space it's given.
  className?: string
}) {
  const [activeId, setActiveId] = useState<string | null>(null)

  // Highlight the topmost heading currently within the upper third of the
  // viewport. One observer over all headings; `-70%` bottom margin means a heading
  // counts as "active" only until the next one reaches the top band.
  useEffect(() => {
    const root = containerRef.current
    if (!root || headings.length === 0) return
    const els = headings
      .map((h) => root.querySelector<HTMLElement>(`#${CSS.escape(h.id)}`))
      .filter((e): e is HTMLElement => e != null)
    if (els.length === 0) return

    const visible = new Set<string>()
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).id
          if (e.isIntersecting) visible.add(id)
          else visible.delete(id)
        }
        const top = headings.find((h) => visible.has(h.id))
        if (top) setActiveId(top.id)
      },
      { root, rootMargin: '0px 0px -70% 0px', threshold: 0 },
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [headings, containerRef])

  const jump = (h: Heading) => {
    const el = containerRef.current?.querySelector<HTMLElement>(`#${CSS.escape(h.id)}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveId(h.id)
  }

  return (
    <nav className={cn('flex min-h-0 flex-col', className)}>
      <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
        On this page
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <ul className="px-2 pb-4">
          {headings.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => jump(h)}
                title={h.text}
                style={{ paddingLeft: `${(h.depth - 1) * 10 + 8}px` }}
                className={cn(
                  'block w-full truncate rounded px-2 py-1 text-left text-xs hover:bg-accent',
                  activeId === h.id
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {h.text}
              </button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </nav>
  )
}
