'use client'

import { useMemo, useRef, useState } from 'react'
import {
  ChevronRight,
  CircleAlert,
  CircleCheck,
  FileText,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { type DocumentOut, type GraphData, type GraphNode } from '@/lib/api'
import { clusterColorMap } from '@/lib/cluster-color'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const ACCEPT = '.pdf,.md,.markdown,.txt,application/pdf,text/markdown,text/plain'

// One row height/shape for every navigable line — keeps the tree dense and
// even the way Notion/Obsidian sidebars read.
const ROW =
  'flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm ' +
  'text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent ' +
  'hover:text-sidebar-accent-foreground'

/** Compact terminal-state glyph for a document — denser than a full badge. */
function DocStatusIcon({ status }: { status: DocumentOut['status'] }) {
  if (status === 'done')
    return <CircleCheck className="size-3.5 shrink-0 text-emerald-500" />
  if (status === 'failed')
    return <CircleAlert className="size-3.5 shrink-0 text-destructive" />
  return (
    <LoaderCircle className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
  )
}

/** Collapsible section header: chevron + label + count, with a hover-only action. */
function SectionHeader({
  label,
  count,
  open,
  onToggle,
  action,
}: {
  label: string
  count?: number
  open: boolean
  onToggle: () => void
  action?: React.ReactNode
}) {
  return (
    <div className="group/sec flex items-center px-1 pb-1 pt-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex flex-1 items-center gap-1 rounded px-1 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight
          className={cn('size-3 transition-transform', open && 'rotate-90')}
        />
        <span>{label}</span>
        {count != null && (
          <span className="ml-1 text-muted-foreground/60">{count}</span>
        )}
      </button>
      {action}
    </div>
  )
}

export function NavSidebar({
  documents,
  graph,
  onPickFile,
  busy,
  loading,
  workspaceName,
  onOpenSearch,
  focusedClusterId,
  onFocusCluster,
  onSelectConcept,
  onHoverTopic,
  onHoverConcept,
  onDeleteDocuments,
  onDeleteClusters,
}: {
  documents: DocumentOut[]
  graph: GraphData
  onPickFile: (file: File) => void
  busy: boolean
  loading: boolean
  workspaceName: string
  onOpenSearch: () => void
  focusedClusterId: string | null
  onFocusCluster: (id: string | null) => void
  onSelectConcept: (id: string) => void
  onHoverTopic: (id: string | null) => void
  onHoverConcept: (id: string | null) => void
  onDeleteDocuments: (ids: string[]) => Promise<void>
  onDeleteClusters: (ids: string[]) => Promise<void>
}) {
  const [docsOpen, setDocsOpen] = useState(true)
  const [clustersOpen, setClustersOpen] = useState(true)

  // Multi-select for batch delete — one mechanism for both sections: check rows,
  // then the section header's trash acts on the checked ids (a single checked row
  // is just a delete of one). `pending` opens the shared confirmation dialog.
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const [selectedClusters, setSelectedClusters] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState<'documents' | 'clusters' | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Which topics are expanded to show their concept list inline.
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggleIn = (set: Set<string>, id: string) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }

  const confirmDelete = async () => {
    if (!pending) return
    const ids = [...(pending === 'documents' ? selectedDocs : selectedClusters)]
    setDeleting(true)
    try {
      if (pending === 'documents') {
        await onDeleteDocuments(ids)
        setSelectedDocs(new Set())
      } else {
        await onDeleteClusters(ids)
        setSelectedClusters(new Set())
      }
      setPending(null)
    } finally {
      setDeleting(false)
    }
  }

  // Hidden input shared by the "New document" row and the section "+" action.
  const fileRef = useRef<HTMLInputElement>(null)
  const pickFile = () => fileRef.current?.click()

  // Same hue a cluster wears on the canvas (ordered by the graph's cluster list).
  const colorOf = useMemo(() => clusterColorMap(graph.clusters), [graph.clusters])

  // Concepts grouped under each topic, most-mentioned first — the expandable list.
  // Doubles as the per-topic count source (the API doesn't return counts).
  const conceptsByCluster = useMemo(() => {
    const m = new Map<string, GraphNode[]>()
    for (const n of graph.nodes) {
      if (!n.cluster_id) continue
      const arr = m.get(n.cluster_id)
      if (arr) arr.push(n)
      else m.set(n.cluster_id, [n])
    }
    for (const arr of m.values()) arr.sort((a, b) => b.mentions - a.mentions)
    return m
  }, [graph.nodes])

  // Topic rows with their concept counts, biggest first.
  const clusterRows = useMemo(() => {
    return graph.clusters
      .map((cl) => ({
        id: cl.id,
        label: cl.label,
        count: conceptsByCluster.get(cl.id)?.length ?? 0,
      }))
      .sort((a, b) => b.count - a.count)
  }, [graph.clusters, conceptsByCluster])

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Workspace header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex size-6 items-center justify-center rounded-md bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
          {workspaceName.charAt(0).toUpperCase()}
        </div>
        <span className="truncate text-sm font-medium">{workspaceName}</span>
      </div>

      {/* Quick actions */}
      <div className="space-y-0.5 px-2">
        <button type="button" onClick={onOpenSearch} className={ROW}>
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1">Search</span>
          <kbd className="rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </button>
        <button
          type="button"
          onClick={pickFile}
          disabled={busy}
          className={cn(ROW, busy && 'pointer-events-none opacity-60')}
        >
          {busy ? (
            <LoaderCircle className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Plus className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="flex-1">{busy ? 'Uploading…' : 'New document'}</span>
        </button>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-2 pb-3">
        {/* Documents */}
        <SectionHeader
          label="Documents"
          count={documents.length}
          open={docsOpen}
          onToggle={() => setDocsOpen((o) => !o)}
          action={
            selectedDocs.size > 0 ? (
              <button
                type="button"
                onClick={() => setPending('documents')}
                aria-label={`Delete ${selectedDocs.size} selected document(s)`}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5" />
                {selectedDocs.size}
              </button>
            ) : (
              <button
                type="button"
                onClick={pickFile}
                aria-label="Upload document"
                className="flex size-5 items-center justify-center rounded text-muted-foreground opacity-0 transition-colors hover:bg-sidebar-accent hover:text-foreground group-hover/sec:opacity-100"
              >
                <Plus className="size-3.5" />
              </button>
            )
          }
        />
        {docsOpen &&
          (loading ? (
            <div className="space-y-1 px-1 py-1">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-7 w-full" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">No documents yet.</p>
          ) : (
            <ul className="space-y-0.5">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className={cn(
                    ROW,
                    'group/row',
                    selectedDocs.has(doc.id) &&
                      'bg-sidebar-accent text-sidebar-accent-foreground',
                  )}
                  title={doc.status === 'failed' ? doc.error ?? 'failed' : doc.title}
                >
                  <input
                    type="checkbox"
                    checked={selectedDocs.has(doc.id)}
                    onChange={() => setSelectedDocs((s) => toggleIn(s, doc.id))}
                    aria-label={`Select ${doc.title}`}
                    className={cn(
                      'size-3.5 shrink-0 cursor-pointer accent-primary',
                      !selectedDocs.has(doc.id) &&
                        'opacity-0 group-hover/row:opacity-100',
                    )}
                  />
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{doc.title}</span>
                  <DocStatusIcon status={doc.status} />
                </li>
              ))}
            </ul>
          ))}

        {/* Topics — auto-generated concept groups; expand to list their concepts. */}
        <SectionHeader
          label="Topics"
          count={graph.clusters.length}
          open={clustersOpen}
          onToggle={() => setClustersOpen((o) => !o)}
          action={
            selectedClusters.size > 0 ? (
              <button
                type="button"
                onClick={() => setPending('clusters')}
                aria-label={`Delete ${selectedClusters.size} selected topic(s)`}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5" />
                {selectedClusters.size}
              </button>
            ) : undefined
          }
        />
        {clustersOpen &&
          (clusterRows.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">
              No topics yet — upload a document.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {clusterRows.map((cl) => {
                const isOpen = expanded.has(cl.id)
                const concepts = conceptsByCluster.get(cl.id) ?? []
                return (
                  <li key={cl.id}>
                    <div
                      className="group/row flex items-center gap-1"
                      onMouseEnter={() => onHoverTopic(cl.id)}
                      onMouseLeave={() => onHoverTopic(null)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedClusters.has(cl.id)}
                        onChange={() => setSelectedClusters((s) => toggleIn(s, cl.id))}
                        aria-label={`Select ${cl.label ?? 'topic'}`}
                        className={cn(
                          'ml-2 size-3.5 shrink-0 cursor-pointer accent-primary',
                          !selectedClusters.has(cl.id) &&
                            'opacity-0 group-hover/row:opacity-100',
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setExpanded((s) => toggleIn(s, cl.id))}
                        aria-label={isOpen ? 'Collapse topic' : 'Expand topic'}
                        className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                      >
                        <ChevronRight
                          className={cn(
                            'size-3 transition-transform',
                            isOpen && 'rotate-90',
                          )}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => onFocusCluster(cl.id)}
                        title="Click to focus this topic on the canvas"
                        className={cn(
                          ROW,
                          'flex-1',
                          focusedClusterId === cl.id &&
                            'bg-sidebar-accent text-sidebar-accent-foreground',
                        )}
                      >
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ background: colorOf(cl.id) }}
                        />
                        <span className="flex-1 truncate">{cl.label ?? 'Unlabeled'}</span>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {cl.count}
                        </span>
                      </button>
                    </div>
                    {isOpen && (
                      <ul className="my-0.5 ml-6 space-y-0.5 border-l border-border/60 pl-1">
                        {concepts.length === 0 ? (
                          <li className="px-2 py-1 text-xs text-muted-foreground">
                            No concepts.
                          </li>
                        ) : (
                          concepts.map((con) => (
                            <li key={con.id}>
                              <button
                                type="button"
                                onClick={() => onSelectConcept(con.id)}
                                onMouseEnter={() => onHoverConcept(con.id)}
                                onMouseLeave={() => onHoverConcept(null)}
                                title={con.name}
                                className={cn(ROW, 'h-7')}
                              >
                                <span className="flex-1 truncate">{con.name}</span>
                                <span className="text-xs tabular-nums text-muted-foreground">
                                  {con.mentions}
                                </span>
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          ))}
      </ScrollArea>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onPickFile(file)
          e.target.value = '' // allow re-selecting the same file
        }}
      />

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(o) => !o && setPending(null)}
        destructive
        loading={deleting}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        title={
          pending === 'clusters'
            ? `Delete ${selectedClusters.size} topic${selectedClusters.size > 1 ? 's' : ''}?`
            : `Delete ${selectedDocs.size} document${selectedDocs.size > 1 ? 's' : ''}?`
        }
        description={
          pending === 'clusters'
            ? 'Every concept in these topics and their relationships are removed from the graph. The source documents are kept. This cannot be undone.'
            : 'Their chunks, and any concepts only they mention, are removed from the graph. Concepts cited by other documents are kept. This cannot be undone.'
        }
        onConfirm={confirmDelete}
      />
    </aside>
  )
}
