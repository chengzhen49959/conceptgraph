'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import type { GraphNode } from '@/lib/api'
import { pinyinInitial, pinyinSortKey } from '@/lib/pinyin'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

/**
 * Searchable concept picker with an iOS-Contacts-style pinyin index. Replaces a
 * plain <select> for choosing a relation target: type to filter, browse a list
 * sorted by pinyin with sticky section headers, and use the floating A–Z rail to
 * jump to a letter. The rail tracks the section currently at the top and hides
 * while searching, mirroring the address-book pattern. Reusable for any
 * "pick a concept" spot.
 */
export function ConceptCombobox({
  concepts,
  value,
  onChange,
  placeholder = 'Select…',
}: {
  concepts: GraphNode[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState('')
  const [moving, setMoving] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  // Sort by pinyin and bucket by initial letter once per concept set.
  const { groups, letters } = useMemo(() => {
    const withMeta = concepts.map((c) => ({
      id: c.id,
      name: c.name,
      initial: pinyinInitial(c.name),
      key: pinyinSortKey(c.name),
    }))
    withMeta.sort((a, b) => a.key.localeCompare(b.key))
    const byLetter = new Map<string, typeof withMeta>()
    for (const c of withMeta) {
      const arr = byLetter.get(c.initial) ?? []
      arr.push(c)
      byLetter.set(c.initial, arr)
    }
    // Letters A–Z first, '#' (non-letter) last.
    const letters = [...byLetter.keys()].sort((a, b) =>
      a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b),
    )
    return { groups: byLetter, letters }
  }, [concepts])

  const selected = concepts.find((c) => c.id === value)

  // Smooth-scroll to the section; scroll-spy then glides the rail indicator
  // along, so a click reads as a continuous slide rather than a jump.
  const jumpTo = (letter: string) =>
    bodyRef.current
      ?.querySelector(`[data-letter="${letter}"]`)
      ?.scrollIntoView({ block: 'start', behavior: 'smooth' })

  const activeIndex = letters.indexOf(active)

  // Stretch the rail dot while the active letter is changing, snap it round
  // when motion settles — the water-droplet squash-and-stretch. Continuous
  // scrolling keeps resetting the timer, so it stays elongated end to end.
  useEffect(() => {
    setMoving(true)
    const t = setTimeout(() => setMoving(false), 140)
    return () => clearTimeout(t)
  }, [active])

  // Scroll-spy: highlight the rail letter whose section sits at the list top.
  // CommandList isn't ref-forwarded, so reach it through the positioning wrapper.
  useEffect(() => {
    if (!open) return
    const list = bodyRef.current?.querySelector<HTMLElement>(
      '[data-slot=command-list]',
    )
    if (!list) return
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const listTop = list.getBoundingClientRect().top
        let cur = ''
        for (const g of list.querySelectorAll<HTMLElement>('[data-letter]')) {
          if (g.getBoundingClientRect().top - listTop <= 8) cur = g.dataset.letter ?? cur
          else break
        }
        if (cur) setActive(cur)
      })
    }
    onScroll()
    list.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      list.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [open, letters])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className="flex h-8 min-w-0 flex-1 items-center justify-between gap-1 rounded-md border bg-background px-2 text-xs"
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? selected.name : placeholder}
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command className="[&_[cmdk-group]]:overflow-visible [&_[cmdk-group-heading]]:sticky [&_[cmdk-group-heading]]:top-0 [&_[cmdk-group-heading]]:z-10 [&_[cmdk-group-heading]]:bg-popover">
          <CommandInput
            placeholder="Search concepts…"
            value={query}
            onValueChange={setQuery}
          />
          <div ref={bodyRef} className="relative">
            <CommandList className="pr-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <CommandEmpty>No concepts found.</CommandEmpty>
              {letters.map((letter) => (
                // Own wrapper carries data-letter so scroll-spy/jump read a DOM
                // node we control, not a cmdk-forwarded attr that may be dropped.
                <div key={letter} data-letter={letter}>
                  <CommandGroup heading={letter}>
                    {groups.get(letter)!.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={c.name}
                        onSelect={() => {
                          onChange(c.id)
                          setOpen(false)
                        }}
                      >
                        <span className="truncate">{c.name}</span>
                        {c.id === value && (
                          <Check className="ml-auto size-3.5 shrink-0" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </div>
              ))}
            </CommandList>

            {!query && letters.length > 1 && (
              <div className="absolute top-1/2 right-0.5 z-20 flex -translate-y-1/2 flex-col items-center gap-0.5 py-1">
                {/* Single dot that glides between letters (size-4 + gap-0.5 =
                    18px pitch, py-1 = 4px offset) for a silky active handoff. */}
                {activeIndex >= 0 && (
                  <span
                    aria-hidden
                    className="absolute top-0 left-1/2 size-4 rounded-full bg-foreground"
                    style={{
                      // Separate translate/scale props so position eases smoothly
                      // while scale springs (back-out overshoot = squash on land).
                      translate: `-50% ${4 + activeIndex * 18}px`,
                      scale: moving ? '0.72 1.6' : '1 1',
                      transition:
                        'translate 200ms ease-out, scale 260ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  />
                )}
                {letters.map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => jumpTo(letter)}
                    className={cn(
                      'relative z-10 grid size-4 place-items-center rounded-full text-[10px] leading-none transition-colors duration-200',
                      active === letter
                        ? 'font-semibold text-background'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
