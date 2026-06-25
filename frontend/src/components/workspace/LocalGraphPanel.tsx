'use client'

import type { ReactNode } from 'react'
import { Globe, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The reading view's local-graph panel (Obsidian's 关系图谱). A small thumbnail of
 * the document's own concepts, with two header icons that **expand to fullscreen**:
 * the document's cluster (local) or the whole workspace graph (global). The graph is
 * injected via `renderGraph` so it keeps its full wiring; the parent owns the
 * fullscreen overlay that `onExpand` opens.
 */
export function LocalGraphPanel({
  conceptIds,
  renderGraph,
  onExpand,
}: {
  /** The open document's concepts — the thumbnail's (local) node set. */
  conceptIds: ReadonlySet<string>
  /** Renders the graph scoped to `restrict` (undefined = the whole workspace). */
  renderGraph: (restrict: ReadonlySet<string> | undefined) => ReactNode
  /** Open the fullscreen graph at the chosen scope. */
  onExpand: (scope: 'local' | 'global') => void
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">Local graph</span>
        <div className="flex items-center gap-0.5">
          <IconButton
            onClick={() => onExpand('local')}
            title="Expand this document's graph"
            icon={Share2}
          />
          <IconButton
            onClick={() => onExpand('global')}
            title="Open the full workspace graph"
            icon={Globe}
          />
        </div>
      </div>
      {/* Fixed-height thumbnail box; the canvas fits the doc's concepts to fill it. */}
      <div className="relative h-56 w-full">{renderGraph(conceptIds)}</div>
    </div>
  )
}

function IconButton({
  onClick,
  title,
  icon: Icon,
}: {
  onClick: () => void
  title: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        'rounded p-1 text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-foreground',
      )}
    >
      <Icon className="size-3.5" />
    </button>
  )
}
