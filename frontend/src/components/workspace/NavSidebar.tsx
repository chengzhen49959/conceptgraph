'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  FileText,
  LoaderCircle,
  Plus,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react'
import {
  type DocumentOut,
  type GraphData,
  type GraphNode,
  type WorkspaceCard,
  isProcessing,
  DOC_STATUS_LABEL,
} from '@/lib/api'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
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
import { clusterColorMap } from '@/lib/cluster-color'
import {
  type GraphSettings,
  type GraphSettingsPatch,
  topicColorOf,
} from '@/lib/graph-settings'
import { ColorPicker } from './ColorSwatch'
import { GraphControls } from './GraphControls'
import { SectionLabel } from './SidebarSection'
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

// Per-concept select checkbox on an expanded topic's concept rows. A sibling of
// the row button (never nested — a checkbox inside a <button> is invalid), absolute
// in the left gutter the row reserves via `pl-7`, so it never covers the name.
// Hidden until the sub-row is hovered or the concept is already checked; the
// sub-item is `relative group/menu-sub-item` (see ui/sidebar), which anchors this.
const CONCEPT_CHECKBOX =
  'absolute left-2 top-1/2 z-10 size-3 -translate-y-1/2 cursor-pointer accent-primary ' +
  'opacity-0 transition-opacity group-hover/menu-sub-item:opacity-100'

/** Rough ETA for the merge phase, derived from how fast `current` is climbing.
 *
 * Anchors on the first sample seen for this run (resets if `current` drops — a new
 * document reusing the row), then extrapolates the remaining concepts at the average
 * rate since the anchor. Deliberately coarse (5s / 1m buckets): per-concept LLM
 * latency is too jittery for a precise countdown, and a wrong "~3s" that then stalls
 * reads worse than an honest "~30s". Returns null until there's enough signal. */
function useEta(
  current: number | null | undefined,
  total: number | null | undefined,
): string | null {
  const [eta, setEta] = useState<string | null>(null)
  const anchor = useRef<{ t0: number; c0: number } | null>(null)
  useEffect(() => {
    if (current == null || total == null || total === 0) {
      anchor.current = null
      setEta(null)
      return
    }
    const now = Date.now()
    if (!anchor.current || current < anchor.current.c0) {
      anchor.current = { t0: now, c0: current }
      setEta(null)
      return
    }
    const dc = current - anchor.current.c0
    const dt = (now - anchor.current.t0) / 1000
    if (dc <= 0 || dt < 1) return // not enough movement to estimate yet
    const remaining = (total - current) / (dc / dt) // seconds
    if (!isFinite(remaining) || remaining < 0) {
      setEta(null)
      return
    }
    setEta(
      remaining < 60
        ? `~${Math.ceil(remaining / 5) * 5}s`
        : `~${Math.ceil(remaining / 60)}m`,
    )
  }, [current, total])
  return eta
}

/** In-progress sub-line for a document: stage label, plus a live "30/62 · ~25s"
 * during the merge phase (the only stage that reports a count). */
function DocProgress({ doc }: { doc: DocumentOut }) {
  const eta = useEta(doc.progress_current, doc.progress_total)
  const label = DOC_STATUS_LABEL[doc.status]
  const { progress_current: cur, progress_total: tot } = doc
  if (cur == null || tot == null || tot === 0) return <>{label}…</>
  return (
    <>
      {label} {cur}/{tot}
      {eta ? ` · ${eta}` : ''}
    </>
  )
}

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
  onPickFiles,
  busy,
  loading,
  workspaceName,
  workspaces,
  currentId,
  email,
  onOpenSearch,
  onSelectConcept,
  onHoverTopic,
  onHoverConcept,
  onDeleteDocuments,
  onDeleteClusters,
  onDeleteConcepts,
  onSelectDocument,
  activeDocId,
  settings,
  onChange,
}: {
  documents: DocumentOut[]
  graph: GraphData
  onPickFiles: (files: File[]) => void
  busy: boolean
  loading: boolean
  workspaceName: string
  workspaces: WorkspaceCard[]
  currentId: string | undefined
  email: string | null
  onOpenSearch: () => void
  onSelectConcept: (id: string) => void
  onHoverTopic: (id: string | null) => void
  onHoverConcept: (id: string | null) => void
  onDeleteDocuments: (ids: string[]) => Promise<void>
  onDeleteClusters: (ids: string[]) => Promise<void>
  onDeleteConcepts: (ids: string[]) => Promise<void>
  /** Open a document in the reader view (a row's click). `activeDocId` marks the
   *  one currently open; selection-for-delete stays on the per-row checkbox. */
  onSelectDocument: (id: string) => void
  activeDocId: string | null
  /** Graph control-panel state — drives the Topics rows' colour/visibility and the
   *  Filters / Display / Forces / Local graph sections rendered beneath them. */
  settings: GraphSettings
  onChange: (patch: GraphSettingsPatch) => void
}) {
  const [docsOpen, setDocsOpen] = useState(true)
  const [clustersOpen, setClustersOpen] = useState(true)

  // Multi-select for batch delete — one mechanism for both sections: check rows,
  // then the section's trash action removes the checked ids (a single checked row
  // is just a delete of one). `pending` opens the shared confirmation dialog.
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const [selectedClusters, setSelectedClusters] = useState<Set<string>>(new Set())
  // Individual concepts checked across expanded topics (cherry-pick a few to delete
  // instead of dropping a whole topic). Independent of the cluster selection above.
  const [selectedConcepts, setSelectedConcepts] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState<'documents' | 'clusters' | 'concepts' | null>(
    null,
  )
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
    const source =
      pending === 'documents'
        ? selectedDocs
        : pending === 'clusters'
          ? selectedClusters
          : selectedConcepts
    const ids = [...source]
    setDeleting(true)
    try {
      if (pending === 'documents') {
        await onDeleteDocuments(ids)
        setSelectedDocs(new Set())
      } else if (pending === 'clusters') {
        await onDeleteClusters(ids)
        setSelectedClusters(new Set())
      } else {
        await onDeleteConcepts(ids)
        setSelectedConcepts(new Set())
      }
      setPending(null)
    } finally {
      setDeleting(false)
    }
  }

  // Hidden input shared by the "New document" row and the section "+" action.
  const fileRef = useRef<HTMLInputElement>(null)
  const pickFile = () => fileRef.current?.click()

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

  // Every concept that appears under a topic — the universe the concept multi-select
  // toolbar's select-all / invert act over.
  const allConceptIds = useMemo(
    () => graph.nodes.filter((n) => n.cluster_id).map((n) => n.id),
    [graph.nodes],
  )

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

  // A topic's colour (palette default + per-topic override) and its hidden state,
  // both derived from settings — the sidebar Topics rows are the single home for
  // colour and visibility. The canvas derives the same colour from the same inputs,
  // so the two stay in sync without sharing a function.
  const topicFallback = useMemo(() => clusterColorMap(graph.clusters), [graph.clusters])
  const topicColor = useCallback(
    (id: string) => topicColorOf(id, settings.topicColors, topicFallback),
    [settings.topicColors, topicFallback],
  )
  const hiddenTopics = settings.filters.hiddenTopics
  const onToggleTopicHidden = useCallback(
    (id: string) =>
      onChange({
        filters: {
          hiddenTopics: hiddenTopics.includes(id)
            ? hiddenTopics.filter((x) => x !== id)
            : [...hiddenTopics, id],
        },
      }),
    [hiddenTopics, onChange],
  )
  const onPickTopicColor = useCallback(
    (id: string, color: string) => onChange({ topicColors: { [id]: color } }),
    [onChange],
  )

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
            <SidebarMenuItem>
              {/* Graph settings (Display / Forces / Local graph) behind a gear —
                  opened on demand so the sidebar stays short. */}
              <Popover>
                <PopoverTrigger asChild>
                  <SidebarMenuButton title="Graph settings">
                    <Settings className="text-muted-foreground" />
                    <span className="flex-1">Graph settings</span>
                  </SidebarMenuButton>
                </PopoverTrigger>
                <PopoverContent
                  side="right"
                  align="start"
                  className="max-h-[70vh] w-64 overflow-y-auto"
                >
                  <GraphControls settings={settings} onChange={onChange} />
                </PopoverContent>
              </Popover>
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
                      className="h-auto min-h-8 items-center"
                      tooltip={doc.title}
                      isActive={activeDocId === doc.id}
                      onClick={() => onSelectDocument(doc.id)}
                      title={
                        doc.status === 'failed'
                          ? doc.error ?? 'failed'
                          : doc.title
                      }
                    >
                      <FileText className="text-muted-foreground" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate">{doc.title}</span>
                        {isProcessing(doc.status) && (
                          <span className="truncate text-[10px] leading-tight text-muted-foreground tabular-nums">
                            <DocProgress doc={doc} />
                          </span>
                        )}
                        {doc.status === 'failed' && (
                          <span className="flex min-w-0 flex-col text-[10px] leading-tight text-destructive">
                            <span
                              className="truncate"
                              title={doc.error ?? 'Import failed'}
                            >
                              {doc.error ?? 'Import failed'}
                            </span>
                            {/* Ingest can't be resumed in place (the original file
                                isn't kept), so the only recovery is delete + re-upload —
                                spell it out and offer the one-click delete on the right. */}
                            <span className="font-medium">
                              Delete &amp; re-upload to retry
                            </span>
                          </span>
                        )}
                      </span>
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
                    {/* One-click delete for a failed import — a sibling button (a
                        <button> can't nest inside SidebarMenuButton's button). Reveals
                        on row hover; clears the dead row so the user can re-upload. */}
                    {doc.status === 'failed' && (
                      <button
                        type="button"
                        title="Delete this document — then re-upload to try again"
                        aria-label={`Delete ${doc.title} and re-upload`}
                        onClick={(e) => {
                          e.stopPropagation()
                          void onDeleteDocuments([doc.id])
                        }}
                        className="absolute top-1.5 right-1 z-10 flex aspect-square w-5 items-center justify-center rounded-md text-destructive opacity-0 transition-opacity hover:bg-destructive/10 group-hover/row:opacity-100 group-data-[collapsible=icon]:hidden"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
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
          ) : selectedConcepts.size > 0 ? (
            <SelectionToolbar
              count={selectedConcepts.size}
              allSelected={selectedConcepts.size === allConceptIds.length}
              onSelectAll={() =>
                setSelectedConcepts((s) => selectAllOrNone(s, allConceptIds))
              }
              onInvert={() =>
                setSelectedConcepts((s) => invertSelection(s, allConceptIds))
              }
              onClear={() => setSelectedConcepts(new Set())}
              onDelete={() => setPending('concepts')}
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
                  const hidden = hiddenTopics.includes(cl.id)
                  return (
                    <SidebarMenuItem key={cl.id} className="group/row">
                      <SidebarMenuButton
                        tooltip={cl.label ?? 'Unlabeled'}
                        isActive={selectedClusters.has(cl.id)}
                        onClick={() => setExpanded((s) => toggleIn(s, cl.id))}
                        onMouseEnter={() => onHoverTopic(cl.id)}
                        onMouseLeave={() => onHoverTopic(null)}
                        // Full topic name on hover — the row truncates it, and this is
                        // the only place the whole label is recoverable.
                        title={cl.label ?? 'Unlabeled'}
                        className={cn(hidden && 'opacity-50')}
                      >
                        {/* Colour dot doubles as the topic's colour picker. It's a
                            span (not a button) because the row is already a button;
                            stopPropagation keeps a colour click from expanding it. */}
                        <ColorPicker
                          color={topicColor(cl.id)}
                          onPick={(color) => onPickTopicColor(cl.id, color)}
                        >
                          <span
                            role="button"
                            tabIndex={0}
                            aria-label="Change topic colour"
                            title="Change topic colour"
                            onClick={(e) => e.stopPropagation()}
                            className="size-2.5 shrink-0 cursor-pointer rounded-full transition-transform hover:scale-125"
                            style={{ background: topicColor(cl.id) }}
                          />
                        </ColorPicker>
                        <span className="flex-1 truncate">
                          {cl.label ?? 'Unlabeled'}
                        </span>
                        {/* Show/hide this topic on the canvas (syncs the Topics filter). */}
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={hidden ? 'Show topic on canvas' : 'Hide topic on canvas'}
                          title={hidden ? 'Show on canvas' : 'Hide on canvas'}
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleTopicHidden(cl.id)
                          }}
                          className={cn(
                            'flex size-4 shrink-0 items-center justify-center rounded text-sidebar-foreground/60 transition-opacity hover:text-sidebar-foreground',
                            'opacity-0 group-hover/row:opacity-100 group-data-[collapsible=icon]:hidden',
                            hidden && 'opacity-100',
                          )}
                        >
                          {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
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
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={selectedConcepts.has(con.id)}
                                  className="pl-7"
                                >
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
                                {/* Check to cherry-pick this concept for deletion (vs.
                                    dropping the whole topic). A sibling of the button,
                                    not nested; click stops here so it doesn't focus. */}
                                <input
                                  type="checkbox"
                                  checked={selectedConcepts.has(con.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={() =>
                                    setSelectedConcepts((s) => toggleIn(s, con.id))
                                  }
                                  aria-label={`Select ${con.name}`}
                                  className={cn(
                                    CONCEPT_CHECKBOX,
                                    selectedConcepts.has(con.id) && 'opacity-100',
                                  )}
                                />
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
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) onPickFiles(files)
          e.target.value = '' // allow re-selecting the same file(s)
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
            : pending === 'concepts'
              ? `Delete ${selectedConcepts.size} concept${selectedConcepts.size > 1 ? 's' : ''}?`
              : `Delete ${selectedDocs.size} document${selectedDocs.size > 1 ? 's' : ''}?`
        }
        description={
          pending === 'clusters'
            ? 'Every concept in these topics and their relationships are removed from the graph. The source documents are kept. This cannot be undone.'
            : pending === 'concepts'
              ? 'These concepts and their relationships are removed from the graph. Their source documents are kept. This cannot be undone.'
              : 'Their chunks, and any concepts only they mention, are removed from the graph. Concepts cited by other documents are kept. This cannot be undone.'
        }
        onConfirm={confirmDelete}
      />

      <SidebarRail />
    </Sidebar>
  )
}
