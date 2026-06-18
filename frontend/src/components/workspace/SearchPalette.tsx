'use client'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import type { GraphNode } from '@/lib/api'

export function SearchPalette({
  open,
  onOpenChange,
  nodes,
  onPick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodes: GraphNode[]
  onPick: (id: string) => void
}) {
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search concepts"
      description="Find a concept and jump to it in the graph"
    >
      <CommandInput placeholder="Search concepts…" />
      <CommandList>
        <CommandEmpty>No concepts found.</CommandEmpty>
        <CommandGroup heading="Concepts">
          {nodes.map((n) => (
            <CommandItem
              key={n.id}
              value={n.name}
              onSelect={() => {
                onPick(n.id)
                onOpenChange(false)
              }}
            >
              <span className="truncate">{n.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {n.mentions} mention{n.mentions === 1 ? '' : 's'}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
