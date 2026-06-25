'use client'

import { useMemo } from 'react'
import { X } from 'lucide-react'
import type { GraphCluster, GraphData } from '@/lib/api'
import { Separator } from '@/components/ui/separator'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

/**
 * Topic detail panel — the topic analogue of ConceptPanel. A topic carries no
 * server-side detail of its own, so everything here is derived from the loaded
 * graph: its member concepts and their mention totals. Clicking a member hands
 * off to the concept selection flow (which closes this panel).
 */
export function TopicPanel({
  cluster,
  graph,
  onClose,
  onSelectConcept,
}: {
  cluster: GraphCluster
  graph: GraphData
  onClose: () => void
  onSelectConcept: (id: string) => void
}) {
  const members = useMemo(
    () =>
      graph.nodes
        .filter((n) => n.cluster_id === cluster.id)
        .sort((a, b) => b.mentions - a.mentions),
    [graph.nodes, cluster.id],
  )
  const mentions = useMemo(
    () => members.reduce((s, n) => s + n.mentions, 0),
    [members],
  )

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex items-start justify-between gap-2 border-b p-4">
        <div className="min-w-0">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Topic
          </span>
          <h2
            className="truncate text-base font-semibold"
            title={cluster.label ?? 'Untitled topic'}
          >
            {cluster.label ?? 'Untitled topic'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-5 p-4">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="concepts" value={members.length} />
            <Stat label="mentions" value={mentions} />
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Concepts ({members.length})
            </h3>
            <ul className="space-y-1">
              {members.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => onSelectConcept(m.id)}
                    className="flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <span className="min-w-0 flex-1 truncate">{m.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {m.mentions} mention{m.mentions === 1 ? '' : 's'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
