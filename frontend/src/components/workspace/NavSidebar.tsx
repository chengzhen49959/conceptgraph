'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronRight,
  Eye,
  EyeOff,
  ListChecks,
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
import { DocumentRow } from './DocumentRow'
import { GraphControls } from './GraphControls'
import { SectionLabel } from './SidebarSection'
import { NavUser } from './NavUser'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'

const ACCEPT = '.pdf,.md,.markdown,.txt,application/pdf,text/markdown,text/plain'

// Right-aligned count inside a menu button; collapses away on the icon rail.
const ROW_COUNT =
  'shrink-0 text-xs tabular-nums text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden'

/** All-or-none select toggle: full selection → empty, otherwise → all. */
const selectAllOrNone = (cur: Set<string>, allIds: string[]) =>
  cur.size === allIds.length ? new Set<string>() : new Set(allIds)

/** Invert a selection against the full id list. */
const invertSelection = (cur: Set<string>, allIds: string[]) =>
  new Set(allIds.filter((id) => !cur.has(id)))

/**
 * Batch-action toolbar that takes over a section header while that section is in
 * select mode. Two rows: clear · count · delete, then select-all / invert. Hidden
 * on the icon rail. Delete is disabled until at least one row is checked.
 */
function SelectionToolbar({
  count,
  allSelected,
  deleteDisabled,
  onSelectAll,
  onInvert,
  onClear,
  onDelete,
}: {
  count: number
  allSelected: boolean
  deleteDisabled: boolean
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
          aria-label="Done selecting"
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
          disabled={deleteDisabled}
          aria-label={`Delete ${count} selected`}
          className="flex size-5 shrink-0 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-30"
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

/** Small header action that enters a section's multi-select mode. */
function SelectToggle({
  onClick,
  label,
  className,
}: {
  onClick: () => void
  label: string
  className?: string
}) {
  return (
    <SidebarGroupAction
      onClick={onClick}
      aria-label={label}
      title={label}
      className={className}
    >
      <ListChecks />
    </SidebarGroupAction>
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
  /** Graph control-panel state — drives the Topics rows' colour/visibility and the
   *  Filters / Display / Forces / Local graph sections rendered beneath them. */
  settings: GraphSettings
  onChange: (patch: GraphSettingsPatch) => void
}) {
  const [docsOpen, setDocsOpen] = useState(true)
  const [clustersOpen, setClustersOpen] = useState(true)

  // Multi-select for batch delete — entered per section via a header toggle, then
  // every row in that section shows a checkbox (no hover-reveal). `pending` opens
  // the shared confirmation dialog.
  const [docsSelectMode, setDocsSelectMode] = useState(false)
  const [topicsSelectMode, setTopicsSelectMode] = useState(false)
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const [selectedClusters, setSelectedClusters] = useState<Set<string>>(new Set())
  // Individual concepts checked across expanded topics (cherry-pick a few to delete
  // instead of dropping a whole topic). Lives in the same Topics select mode.
  const [selectedConcepts, setSelectedConcepts] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState<'documents' | 'clusters' | 'concepts' | null>(
    null,
  )
  const [deleting, setDeleting] = useState(false)

  // Which topics are expanded to show their concept list inline.
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // The document row whose swipe actions are revealed (one at a time, WeChat-style).
  const [openDocId, setOpenDocId] = useState<string | null>(null)

  const toggleIn = (set: Set<string>, id: string) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }

  // Enter / leave the two select modes. Entering opens the section (so the rows
  // being selected are visible) and closes any open document swipe.
  const enterDocsSelect = () => {
    setOpenDocId(null)
    setDocsOpen(true)
    setDocsSelectMode(true)
  }
  const exitDocsSelect = () => {
    setSelectedDocs(new Set())
    setDocsSelectMode(false)
  }
  const enterTopicsSelect = () => {
    setClustersOpen(true)
    setTopicsSelectMode(true)
  }
  const exitTopicsSelect = () => {
    setSelectedClusters(new Set())
    setSelectedConcepts(new Set())
    setTopicsSelectMode(false)
  }

  // Close the open swipe on an outside click or Escape — feels like WeChat, where
  // tapping away dismisses the revealed actions.
  useEffect(() => {
    if (!openDocId) return
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null
      if (t && !t.closest(`[data-doc-row="${openDocId}"]`)) setOpenDocId(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDocId(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [openDocId])

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
        exitDocsSelect()
      } else if (pending === 'clusters') {
        await onDeleteClusters(ids)
        exitTopicsSelect()
      } else {
        await onDeleteConcepts(ids)
        exitTopicsSelect()
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
          {docsSelectMode ? (
            <SelectionToolbar
              count={selectedDocs.size}
              allSelected={
                documents.length > 0 && selectedDocs.size === documents.length
              }
              deleteDisabled={selectedDocs.size === 0}
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
              onClear={exitDocsSelect}
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
              {documents.length > 0 && (
                <SelectToggle
                  onClick={enterDocsSelect}
                  label="Select documents"
                  className="right-9"
                />
              )}
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
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    selectMode={docsSelectMode}
                    selected={selectedDocs.has(doc.id)}
                    onToggleSelect={() =>
                      setSelectedDocs((s) => toggleIn(s, doc.id))
                    }
                    swipeOpen={openDocId === doc.id}
                    onSwipeOpenChange={(open) =>
                      setOpenDocId(open ? doc.id : null)
                    }
                    onDeleteFailed={() => void onDeleteDocuments([doc.id])}
                  />
                ))}
              </SidebarMenu>
            ))}
        </SidebarGroup>

        {/* Topics — auto-generated concept groups; expand to list their concepts. */}
        <SidebarGroup className="group/section">
          {topicsSelectMode ? (
            selectedConcepts.size > 0 && selectedClusters.size === 0 ? (
              <SelectionToolbar
                count={selectedConcepts.size}
                allSelected={
                  allConceptIds.length > 0 &&
                  selectedConcepts.size === allConceptIds.length
                }
                deleteDisabled={selectedConcepts.size === 0}
                onSelectAll={() =>
                  setSelectedConcepts((s) => selectAllOrNone(s, allConceptIds))
                }
                onInvert={() =>
                  setSelectedConcepts((s) => invertSelection(s, allConceptIds))
                }
                onClear={exitTopicsSelect}
                onDelete={() => setPending('concepts')}
              />
            ) : (
              <SelectionToolbar
                count={selectedClusters.size}
                allSelected={
                  clusterRows.length > 0 &&
                  selectedClusters.size === clusterRows.length
                }
                deleteDisabled={selectedClusters.size === 0}
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
                onClear={exitTopicsSelect}
                onDelete={() => setPending('clusters')}
              />
            )
          ) : (
            <>
              <SectionLabel
                label="Topics"
                count={graph.clusters.length}
                open={clustersOpen}
                onToggle={() => setClustersOpen((o) => !o)}
              />
              {clusterRows.length > 0 && (
                <SelectToggle
                  onClick={enterTopicsSelect}
                  label="Select topics"
                />
              )}
            </>
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
                  const checked = selectedClusters.has(cl.id)
                  return (
                    <SidebarMenuItem key={cl.id} className="group/row">
                      <SidebarMenuButton
                        tooltip={cl.label ?? 'Unlabeled'}
                        isActive={topicsSelectMode && checked}
                        // Select mode: the row toggles its checkbox. Otherwise it
                        // expands the topic's concept list.
                        onClick={() =>
                          topicsSelectMode
                            ? setSelectedClusters((s) => toggleIn(s, cl.id))
                            : setExpanded((s) => toggleIn(s, cl.id))
                        }
                        onMouseEnter={() => {
                          if (!topicsSelectMode) onHoverTopic(cl.id)
                        }}
                        onMouseLeave={() => onHoverTopic(null)}
                        title={cl.label ?? 'Unlabeled'}
                        className={cn(hidden && !topicsSelectMode && 'opacity-50')}
                      >
                        {topicsSelectMode ? (
                          <span className="flex size-4 shrink-0 items-center justify-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              readOnly
                              aria-label={`Select ${cl.label ?? 'topic'}`}
                              className="pointer-events-none size-3.5 accent-primary"
                            />
                          </span>
                        ) : (
                          // Colour dot doubles as the topic's colour picker. It's a
                          // span (not a button) because the row is already a button;
                          // stopPropagation keeps a colour click from expanding it.
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
                        )}
                        <span className="flex-1 truncate">
                          {cl.label ?? 'Unlabeled'}
                        </span>
                        {/* Show/hide this topic on the canvas (syncs the Topics
                            filter). Hidden while selecting to keep the row calm. */}
                        {!topicsSelectMode && (
                          <span
                            role="button"
                            tabIndex={0}
                            aria-label={
                              hidden ? 'Show topic on canvas' : 'Hide topic on canvas'
                            }
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
                            {hidden ? (
                              <EyeOff className="size-3.5" />
                            ) : (
                              <Eye className="size-3.5" />
                            )}
                          </span>
                        )}
                        <span className={ROW_COUNT}>{cl.count}</span>
                      </SidebarMenuButton>

                      {/* Expand/collapse stays on the chevron so it works in both
                          normal and select mode (where row-click toggles selection). */}
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

                      {isOpen && (
                        <SidebarMenuSub>
                          {concepts.length === 0 ? (
                            <li className="px-2 py-1 text-xs text-muted-foreground">
                              No concepts.
                            </li>
                          ) : (
                            concepts.map((con) => {
                              const cchecked = selectedConcepts.has(con.id)
                              return (
                                <SidebarMenuSubItem key={con.id}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={topicsSelectMode && cchecked}
                                    className={cn(topicsSelectMode && 'pl-7')}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        topicsSelectMode
                                          ? setSelectedConcepts((s) =>
                                              toggleIn(s, con.id),
                                            )
                                          : onSelectConcept(con.id)
                                      }
                                      onMouseEnter={() => {
                                        if (!topicsSelectMode)
                                          onHoverConcept(con.id)
                                      }}
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
                                  {/* Per-concept checkbox, shown only in select mode.
                                      Pointer-events-none — the row button toggles it,
                                      so a click anywhere on the row selects. Absolute
                                      in the gutter the row reserves via `pl-7`. */}
                                  {topicsSelectMode && (
                                    <input
                                      type="checkbox"
                                      checked={cchecked}
                                      readOnly
                                      aria-label={`Select ${con.name}`}
                                      className="pointer-events-none absolute left-2 top-1/2 z-10 size-3 -translate-y-1/2 accent-primary"
                                    />
                                  )}
                                </SidebarMenuSubItem>
                              )
                            })
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
