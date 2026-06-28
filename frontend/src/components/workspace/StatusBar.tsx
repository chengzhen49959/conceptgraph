'use client'

import { AlertTriangle } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  type DocumentOut,
  type GraphData,
  isProcessing,
  DOC_STATUS_LABEL,
} from '@/lib/api'

// Bottom status bar: graph counts on the left, ingest state + theme toggle on
// the right. Mirrors the Obsidian-style chrome.
export function StatusBar({
  graph,
  documents,
  // True when docs are queued but the ingestion worker is down — the ingest label
  // would otherwise read a misleading "Queued…" for a queue nothing is draining.
  workerOffline = false,
}: {
  graph: GraphData
  documents: DocumentOut[]
  workerOffline?: boolean
}) {
  const proc = documents.filter((d) => isProcessing(d.status))
  const failed = documents.filter((d) => d.status === 'failed').length

  // One doc ingesting → show its exact stage (plus the merge count when present);
  // several → just the count.
  const one = proc.length === 1 ? proc[0] : null
  const oneLabel = one
    ? one.progress_total
      ? `${DOC_STATUS_LABEL[one.status]} ${one.progress_current ?? 0}/${one.progress_total}…`
      : `${DOC_STATUS_LABEL[one.status]}…`
    : null
  const ingest =
    oneLabel ??
    (proc.length > 1
      ? `ingesting ${proc.length}…`
      : failed > 0
        ? `${failed} failed`
        : 'idle')

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
        {workerOffline ? (
          <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-3" aria-hidden />
            worker offline
          </span>
        ) : (
          <span>{ingest}</span>
        )}
        <ThemeToggle />
      </div>
    </footer>
  )
}
