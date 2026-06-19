'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { type DocumentOut, type GraphData, isProcessing } from '@/lib/api'

// Bottom status bar: graph counts on the left, ingest state + theme toggle on
// the right. Mirrors the Obsidian-style chrome.
export function StatusBar({
  graph,
  documents,
}: {
  graph: GraphData
  documents: DocumentOut[]
}) {
  const processing = documents.filter((d) => isProcessing(d.status)).length
  const failed = documents.filter((d) => d.status === 'failed').length

  const ingest =
    processing > 0
      ? `ingesting ${processing}…`
      : failed > 0
        ? `${failed} failed`
        : 'idle'

  return (
    <footer className="flex h-7 shrink-0 items-center justify-between border-t bg-background px-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5 tabular-nums">
        <span>{graph.nodes.length} concepts</span>
        <span aria-hidden>·</span>
        <span>{graph.links.length} edges</span>
        <span aria-hidden>·</span>
        <span>{graph.clusters.length} clusters</span>
      </div>
      <div className="flex items-center gap-2">
        <span>{ingest}</span>
        <ThemeToggle />
      </div>
    </footer>
  )
}
