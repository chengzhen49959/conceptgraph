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
  X,
} from 'lucide-react'
import {
  type DocumentOut,
  type GraphData,
  type GraphNode,
  type WorkspaceCard,
} from '@/lib/api'
import { clusterColorMap } from '@/lib/cluster-color'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { NavUser } from './NavUser'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'

const ACCEPT = '.pdf,.md,.markdown,.txt,application/pdf,text/markdown,text/plain'

// A multi-select checkbox overlaid on a row's leading icon: hidden until the row
// is hovered (or already selected), and gone entirely on the icon rail. Clicks
// stop here so a row's primary action (focus / select) doesn't also fire.
const ROW_CHECKBOX =
  'absolute left-2 top-1/2 z-10 size-3.5 -translate-y-1/2 cursor-pointer accent-primary ' +
  'opacity-0 transition-opacity group-hover/row:opacity-100 ' +
  'group-data-[collapsible=icon]:hidden'

// Right-aligned count inside a menu button; collapses away on the icon rail.
const ROW_COUNT =
  'shrink-0 text-xs tabular-nums text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden'

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

/**
 * Collapsible section label built on `SidebarGroupLabel` (which fades out on the
 * icon rail). The chevron rotates with `open`; `count` trails the title.
 */
function SectionLabel({
  label,
  count,
  open,
  onToggle,
}: {
  label: string
  count?: number
  open: boolean
  onToggle: () => void
}) {
  return (
    <SidebarGroupLabel asChild>
      <button
        type="button"
        onClick={onToggle}
        className="w-full cursor-pointer gap-1 hover:text-sidebar-foreground"
      >
        <ChevronRight
          className={cn('transition-transform', open && 'rotate-90')}
        />
        <span className="uppercase tracking-wide">{label}</span>
        {count != null && (
          <span className="ml-1 text-sidebar-foreground/40">{count}</span>
        )}
      </button>
    </SidebarGroupLabel>
  )
}

/** All-or-none select toggle: full selection → empty, otherwise → all. */
const selectAllOrNone = (cur: Set<string>, allIds: string[]) =>
  cur.size === allIds.length ? new Set<string>() : new Set(allIds)

/** Invert a selection against the full id list. */
const invertSelection = (cur: Set<string>, allIds: string[]) =>
  new Set(allIds.filter((id) => !cur.has(id)))

/**
 * Batch-action toolbar that takes over a section header once anything is checked
 * (and disappears when the selection clears). Two rows: clear · count · delete,
 * then select-all / invert. Hidden on the icon rail.
 */
function SelectionToolbar({
  count,
  allSelected,
  onSelectAll,
  onInvert,
  onClear,
  onDelete,
}: {
  count: number
  allSelected: boolean
  onSelectAll: () => void
  onInvert: () => void
  onClear: () => void
  onDelete: () => void
}) {
  return (
    <div className="pb-1 pt-1 group-data-[collapsible=icon]:hidden">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="flex size-5 shrink-0 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <X className="size-4" />
        </button>
        <span className="flex-1 text-xs font-medium tabular-nums text-sidebar-foreground/70">
          {count} selected
        </span>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${count} selected`}
          className="flex size-5 shrink-0 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <div className="mt-1 flex items-center gap-1">
        <button
          type="button"
          onClick={onSelectAll}
          className="rounded px-2 py-0.5 text-xs text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {allSelected ? 'Clear all' : 'Select all'}
        </button>
        <button
          type="button"
          onClick={onInvert}
          className="rounded px-2 py-0.5 text-xs text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          Invert
        </button>
      </div>
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
  workspaces,
  currentId,
  email,
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
  workspaces: WorkspaceCard[]
  currentId: string | undefined
  email: string | null
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
  // then the section's trash action removes the checked ids (a single checked row
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
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <WorkspaceSwitcher
          workspaces={workspaces}
          currentId={currentId}
          currentName={workspaceName}
        />
      </SidebarHeader>

      <SidebarContent>
        {/* Quick actions */}
        <SidebarGroup className="py-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onOpenSearch} tooltip="Search">
                <Search className="text-muted-foreground" />
                <span className="flex-1">Search</span>
                <kbd className="ml-auto rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden">
                  ⌘K
                </kbd>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={pickFile}
                disabled={busy}
                tooltip="New document"
              >
                {busy ? (
                  <LoaderCircle className="animate-spin text-muted-foreground" />
                ) : (
                  <Plus className="text-muted-foreground" />
                )}
                <span className="flex-1">{busy ? 'Uploading…' : 'New document'}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Documents */}
        <SidebarGroup className="group/section">
          {selectedDocs.size > 0 ? (
            <SelectionToolbar
              count={selectedDocs.size}
              allSelected={selectedDocs.size === documents.length}
              onSelectAll={() =>
                setSelectedDocs((s) =>
                  selectAllOrNone(
                    s,
                    documents.map((d) => d.id),
                  ),
                )
              }
              onInvert={() =>
                setSelectedDocs((s) =>
                  invertSelection(
                    s,
                    documents.map((d) => d.id),
                  ),
                )
              }
              onClear={() => setSelectedDocs(new Set())}
              onDelete={() => setPending('documents')}
            />
          ) : (
            <>
              <SectionLabel
                label="Documents"
                count={documents.length}
                open={docsOpen}
                onToggle={() => setDocsOpen((o) => !o)}
              />
              <SidebarGroupAction onClick={pickFile} aria-label="Upload document">
                <Plus />
              </SidebarGroupAction>
            </>
          )}

          {docsOpen &&
            (loading ? (
              <div className="space-y-1 px-2 py-1">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <p className="px-2 py-2 text-xs text-muted-foreground">
                No documents yet.
              </p>
            ) : (
              <SidebarMenu>
                {documents.map((doc) => (
                  <SidebarMenuItem key={doc.id} className="group/row">
                    <SidebarMenuButton
                      tooltip={doc.title}
                      isActive={selectedDocs.has(doc.id)}
                      onClick={() => setSelectedDocs((s) => toggleIn(s, doc.id))}
                      title={
                        doc.status === 'failed'
                          ? doc.error ?? 'failed'
                          : doc.title
                      }
                    >
                      <FileText className="text-muted-foreground" />
                      <span className="flex-1 truncate">{doc.title}</span>
                      <DocStatusIcon status={doc.status} />
                    </SidebarMenuButton>
                    <input
                      type="checkbox"
                      checked={selectedDocs.has(doc.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => setSelectedDocs((s) => toggleIn(s, doc.id))}
                      aria-label={`Select ${doc.title}`}
                      className={cn(
                        ROW_CHECKBOX,
                        selectedDocs.has(doc.id) && 'opacity-100',
                      )}
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            ))}
        </SidebarGroup>

        {/* Topics — auto-generated concept groups; expand to list their concepts. */}
        <SidebarGroup className="group/section">
          {selectedClusters.size > 0 ? (
            <SelectionToolbar
              count={selectedClusters.size}
              allSelected={selectedClusters.size === clusterRows.length}
              onSelectAll={() =>
                setSelectedClusters((s) =>
                  selectAllOrNone(
                    s,
                    clusterRows.map((c) => c.id),
                  ),
                )
              }
              onInvert={() =>
                setSelectedClusters((s) =>
                  invertSelection(
                    s,
                    clusterRows.map((c) => c.id),
                  ),
                )
              }
              onClear={() => setSelectedClusters(new Set())}
              onDelete={() => setPending('clusters')}
            />
          ) : (
            <SectionLabel
              label="Topics"
              count={graph.clusters.length}
              open={clustersOpen}
              onToggle={() => setClustersOpen((o) => !o)}
            />
          )}

          {clustersOpen &&
            (clusterRows.length === 0 ? (
              <p className="px-2 py-2 text-xs text-muted-foreground">
                No topics yet — upload a document.
              </p>
            ) : (
              <SidebarMenu>
                {clusterRows.map((cl) => {
                  const isOpen = expanded.has(cl.id)
                  const concepts = conceptsByCluster.get(cl.id) ?? []
                  return (
                    <SidebarMenuItem key={cl.id} className="group/row">
                      <SidebarMenuButton
                        tooltip={cl.label ?? 'Unlabeled'}
                        isActive={
                          focusedClusterId === cl.id ||
                          selectedClusters.has(cl.id)
                        }
                        onClick={() => onFocusCluster(cl.id)}
                        onMouseEnter={() => onHoverTopic(cl.id)}
                        onMouseLeave={() => onHoverTopic(null)}
                        title="Click to focus this topic on the canvas"
                      >
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ background: colorOf(cl.id) }}
                        />
                        <span className="flex-1 truncate">
                          {cl.label ?? 'Unlabeled'}
                        </span>
                        <span className={ROW_COUNT}>{cl.count}</span>
                      </SidebarMenuButton>

                      <SidebarMenuAction
                        onClick={() => setExpanded((s) => toggleIn(s, cl.id))}
                        aria-label={isOpen ? 'Collapse topic' : 'Expand topic'}
                      >
                        <ChevronRight
                          className={cn(
                            'transition-transform',
                            isOpen && 'rotate-90',
                          )}
                        />
                      </SidebarMenuAction>

                      <input
                        type="checkbox"
                        checked={selectedClusters.has(cl.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() =>
                          setSelectedClusters((s) => toggleIn(s, cl.id))
                        }
                        aria-label={`Select ${cl.label ?? 'topic'}`}
                        className={cn(
                          ROW_CHECKBOX,
                          selectedClusters.has(cl.id) && 'opacity-100',
                        )}
                      />

                      {isOpen && (
                        <SidebarMenuSub>
                          {concepts.length === 0 ? (
                            <li className="px-2 py-1 text-xs text-muted-foreground">
                              No concepts.
                            </li>
                          ) : (
                            concepts.map((con) => (
                              <SidebarMenuSubItem key={con.id}>
                                <SidebarMenuSubButton asChild>
                                  <button
                                    type="button"
                                    onClick={() => onSelectConcept(con.id)}
                                    onMouseEnter={() => onHoverConcept(con.id)}
                                    onMouseLeave={() => onHoverConcept(null)}
                                    title={con.name}
                                    className="w-full cursor-pointer"
                                  >
                                    <span className="flex-1 truncate">
                                      {con.name}
                                    </span>
                                    <span className={ROW_COUNT}>
                                      {con.mentions}
                                    </span>
                                  </button>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))
                          )}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            ))}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser email={email} />
      </SidebarFooter>

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

      <SidebarRail />
    </Sidebar>
  )
}
