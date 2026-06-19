'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { FileText, X } from 'lucide-react'
import {
  type ConceptDetail as ConceptData,
  type GraphData,
  type GraphNode,
  getConcept,
} from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  )
}

export function ConceptPanel({
  node,
  graph,
  onClose,
  onNavigate,
}: {
  node: GraphNode
  graph: GraphData
  onClose: () => void
  onNavigate: (id: string) => void
}) {
  const [detail, setDetail] = useState<ConceptData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setDetail(null)
    getConcept(node.id)
      .then((d) => {
        if (alive) setDetail(d)
      })
      .catch((e) => toast.error((e as Error).message))
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [node.id])

  // Neighbours come from the already-loaded graph, not the API.
  const neighbors = useMemo(() => {
    const byId = new Map(graph.nodes.map((n) => [n.id, n.name]))
    const seen = new Set<string>()
    const out: { id: string; name: string }[] = []
    for (const l of graph.links) {
      const other =
        l.source === node.id ? l.target : l.target === node.id ? l.source : null
      if (other && !seen.has(other)) {
        seen.add(other)
        out.push({ id: other, name: byId.get(other) ?? other })
      }
    }
    return out
  }, [graph, node.id])

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex items-start justify-between gap-2 border-b p-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{node.name}</h2>
          {detail?.cluster_label && (
            <Badge variant="secondary" className="mt-1 font-normal">
              {detail.cluster_label}
            </Badge>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 p-4">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="mentions" value={detail?.mentions ?? node.mentions} />
            <Stat label="connections" value={detail?.degree ?? neighbors.length} />
            <Stat label="documents" value={detail?.documents.length ?? 0} />
          </div>

          <Separator />

          {node.description && (
            <Section title="Description">
              <p className="text-sm leading-relaxed text-foreground/90">
                {node.description}
              </p>
            </Section>
          )}

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <>
              {detail && detail.aliases.length > 0 && (
                <Section title={`Aliases (${detail.aliases.length})`}>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.aliases.map((a) => (
                      <Badge key={a} variant="outline" className="font-normal">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </Section>
              )}

              {detail && detail.documents.length > 0 && (
                <Section title="Mentioned in">
                  <ul className="space-y-1">
                    {detail.documents.map((d) => (
                      <li
                        key={d.document_id}
                        className="flex items-center gap-2 text-sm text-foreground/90"
                      >
                        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate" title={d.title}>
                          {d.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </>
          )}

          {neighbors.length > 0 && (
            <Section title={`Connected concepts (${neighbors.length})`}>
              <div className="flex flex-wrap gap-1.5">
                {neighbors.map((nb) => (
                  <button
                    key={nb.id}
                    onClick={() => onNavigate(nb.id)}
                    className="rounded-md border px-2 py-1 text-xs transition-colors hover:bg-accent"
                  >
                    {nb.name}
                  </button>
                ))}
              </div>
            </Section>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
