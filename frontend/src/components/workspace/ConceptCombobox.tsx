'use client'

import { useMemo, useRef, useState } from 'react'
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
 * Searchable concept picker with an alphabetical (pinyin) index. Replaces a
 * plain <select> for choosing a relation target: type to filter, browse a list
 * sorted by pinyin and grouped by initial letter, and use the side A–Z rail to
 * jump to a letter. Reusable for any "pick a concept" spot.
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

  const jumpTo = (letter: string) =>
    bodyRef.current
      ?.querySelector(`[data-letter="${letter}"]`)
      ?.scrollIntoView({ block: 'start' })

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
        <Command>
          <CommandInput placeholder="Search concepts…" />
          <div ref={bodyRef} className="flex">
            <CommandList className="flex-1">
              <CommandEmpty>No concepts found.</CommandEmpty>
              {letters.map((letter) => (
                <CommandGroup key={letter} heading={letter} data-letter={letter}>
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
              ))}
            </CommandList>

            {letters.length > 1 && (
              <div className="flex shrink-0 flex-col items-center gap-0.5 border-l px-1 py-2 text-[10px] leading-none text-muted-foreground">
                {letters.map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => jumpTo(letter)}
                    className="rounded px-0.5 hover:text-foreground"
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
