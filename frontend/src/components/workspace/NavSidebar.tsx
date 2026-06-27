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
  SquareArrowOutUpRight,
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
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
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
import { type RowAction, RowContextMenu, RowOverflow } from './RowMenu'
import { GraphControls } from './GraphControls'
import { SectionLabel } from './SidebarSection'
import { NavUser } from './NavUser'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'

const ACCEPT = '.pdf,.md,.markdown,.txt,application/pdf,text/markdown,text/plain'

// Right-aligned count inside a menu button; collapses away on the icon rail.
const ROW_COUNT =
  'shrink-0 text-xs tabular-nums text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden'

/** The three things the sidebar can batch-select for deletion. Exactly one kind is
 *  ever active at a time, so a checked id can never be stranded between kinds. */
type SelectKind = 'documents' | 'clusters' | 'concepts'

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
 *
 * `modes` adds a segmented control between the two rows for a section that can
 * select more than one kind (Topics → whole topics vs individual concepts); each
 * segment switch clears the selection so the kinds never mix. Omit it for
 * single-kind sections (Documents).
 */
function SelectionToolbar({
  count,
  allSelected,
  deleteDisabled,
  onSelectAll,
  onInvert,
  onClear,
  onDelete,
  modes,
  activeMode,
  onModeChange,
}: {
  count: number
  allSelected: boolean
  deleteDisabled: boolean
  onSelectAll: () => void
  onInvert: () => void
  onClear: () => void
  onDelete: () => void
  modes?: { value: string; label: string }[]
  activeMode?: string
  onModeChange?: (value: string) => void
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
      {modes && (
        <div className="mt-1 flex items-center gap-0.5 rounded-md bg-sidebar-accent/40 p-0.5">
          {modes.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => onModeChange?.(m.value)}
              aria-pressed={activeMode === m.value}
              className={cn(
                'flex-1 rounded px-2 py-0.5 text-xs font-medium transition-colors',
                activeMode === m.value
                  ? 'bg-sidebar text-sidebar-foreground shadow-sm'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
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
  loadingDocs,
  loadingGraph,
  graphError,
  workspaceName,
  workspaces,
  currentId,
  email,
  onOpenSearch,
  onSelectConcept,
  selectedConceptId,
  onFocusTopic,
  focusedTopicId,
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
  /** First-fetch flags from the host: the documents list and the graph load on
   *  separate async paths, so each section gates its own skeleton/empty copy.
   *  `graphError` is a failed graph fetch — the Topics section must not fall back
   *  to the "upload a document" prompt, which would read as data loss. */
  loadingDocs: boolean
  loadingGraph: boolean
  graphError: boolean
  workspaceName: string
  workspaces: WorkspaceCard[]
  currentId: string | undefined
  email: string | null
  onOpenSearch: () => void
  onSelectConcept: (id: string) => void
  /** The concept selected on the canvas (or anywhere) — the sidebar reveals it:
   *  expands its topic, scrolls to its row, and highlights it (two-way sync). */
  selectedConceptId: string | null
  /** Click a topic row → focus that topic on the canvas (persistent highlight +
   *  zoom-to-fit), symmetric with clicking a concept. The chevron alone expands. */
  onFocusTopic: (id: string) => void
  /** Topic currently focused on the canvas — drives the topic row's active state. */
  focusedTopicId: string | null
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

  // One batch-select machine for all three kinds. `selecting` names the active kind
  // (null = not selecting); `selected` holds that kind's checked ids. Because a single
  // kind is ever active, a checked id can never be stranded between two sets — the
  // Topics section simply switches `selecting` between 'clusters' and 'concepts' via
  // its toolbar segmented control, clearing the selection on each switch.
  const [selecting, setSelecting] = useState<SelectKind | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const selectingDocs = selecting === 'documents'
  const selectingClusters = selecting === 'clusters'
  const selectingConcepts = selecting === 'concepts'
  // The Topics section is "in select mode" for either of its two kinds.
  const topicsSelect = selectingClusters || selectingConcepts

  // Which topics are expanded to show their concept list inline.
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Inline filter for the Topics list — type to narrow a long topic list by label.
  const [topicFilter, setTopicFilter] = useState('')

  const toggleIn = (set: Set<string>, id: string) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }

  // Enter a section's select mode (Topics defaults to whole-topic 'clusters'), open
  // that section so the rows being selected are visible, and close any open swipe.
  const enterSelect = (kind: SelectKind) => {
    setSelected(new Set())
    if (kind === 'documents') setDocsOpen(true)
    else setClustersOpen(true)
    setSelecting(kind)
  }
  const exitSelect = () => {
    setSelected(new Set())
    setSelecting(null)
  }
  // Topics toolbar segmented control: switch which kind the Topics section selects,
  // clearing the current selection so whole-topic and per-concept picks never mix.
  const switchTopicsKind = (kind: 'clusters' | 'concepts') => {
    setSelected(new Set())
    setSelecting(kind)
  }

  // Two-way sync: when a concept is selected anywhere (canvas, search, panel link),
  // reveal it in the sidebar — expand its topic, then scroll its row into view. The
  // state write + scroll run in a rAF (not the effect body) so this never fires a
  // synchronous render cascade, and the scroll waits a frame for the row to mount.
  useEffect(() => {
    if (!selectedConceptId) return
    const cid = graph.nodes.find((n) => n.id === selectedConceptId)?.cluster_id
    if (!cid) return
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      setExpanded((s) => (s.has(cid) ? s : new Set(s).add(cid)))
      raf2 = requestAnimationFrame(() => {
        document
          .querySelector(`[data-concept-row="${CSS.escape(selectedConceptId)}"]`)
          ?.scrollIntoView({ block: 'nearest' })
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [selectedConceptId, graph.nodes])

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

  // The Topics list narrowed by the inline filter (label substring, case-insensitive).
  // Select-all / invert still act over the full clusterRows, not this filtered view.
  const filteredClusterRows = useMemo(() => {
    const q = topicFilter.trim().toLowerCase()
    if (!q) return clusterRows
    return clusterRows.filter((c) => (c.label ?? '').toLowerCase().includes(q))
  }, [clusterRows, topicFilter])

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

  // One descriptor per selectable kind: the id universe its select-all / invert act
  // over, the delete call, and the confirm-dialog copy. The active kind drives the
  // single SelectionToolbar and single ConfirmDialog below, so adding/altering a kind
  // is one table entry rather than a change spread across modes, sets, and switches.
  const descriptors = useMemo(
    () => ({
      documents: {
        allIds: documents.map((d) => d.id),
        onDelete: onDeleteDocuments,
        dialogTitle: (n: number) => `Delete ${n} document${n > 1 ? 's' : ''}?`,
        dialogDescription:
          'Their chunks, and any concepts only they mention, are removed from the graph. Concepts cited by other documents are kept. This cannot be undone.',
      },
      clusters: {
        allIds: clusterRows.map((c) => c.id),
        onDelete: onDeleteClusters,
        dialogTitle: (n: number) => `Delete ${n} topic${n > 1 ? 's' : ''}?`,
        dialogDescription:
          'Every concept in these topics and their relationships are removed from the graph. The source documents are kept. This cannot be undone.',
      },
      concepts: {
        allIds: allConceptIds,
        onDelete: onDeleteConcepts,
        dialogTitle: (n: number) => `Delete ${n} concept${n > 1 ? 's' : ''}?`,
        dialogDescription:
          'These concepts and their relationships are removed from the graph. Their source documents are kept. This cannot be undone.',
      },
    }),
    [
      documents,
      clusterRows,
      allConceptIds,
      onDeleteDocuments,
      onDeleteClusters,
      onDeleteConcepts,
    ],
  )

  const active = selecting ? descriptors[selecting] : null
  const allIds = active?.allIds ?? []

  const confirmDelete = async () => {
    if (!active) return
    const ids = [...selected]
    setDeleting(true)
    try {
      await active.onDelete(ids)
      setConfirmOpen(false)
      exitSelect()
    } finally {
      setDeleting(false)
    }
  }

  // The single selection toolbar, parameterised by the active kind. `modeProps` adds
  // the Topics-only segmented control; omit it for Documents.
  const renderToolbar = (modeProps?: {
    modes: { value: string; label: string }[]
    activeMode: string
    onModeChange: (value: string) => void
  }) => (
    <SelectionToolbar
      count={selected.size}
      allSelected={allIds.length > 0 && selected.size === allIds.length}
      deleteDisabled={selected.size === 0}
      onSelectAll={() => setSelected((s) => selectAllOrNone(s, allIds))}
      onInvert={() => setSelected((s) => invertSelection(s, allIds))}
      onClear={exitSelect}
      onDelete={() => setConfirmOpen(true)}
      {...modeProps}
    />
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
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Documents */}
        <SidebarGroup className="group/section">
          {selectingDocs ? (
            renderToolbar()
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
                  onClick={() => enterSelect('documents')}
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
            (loadingDocs ? (
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
              <SidebarMenu className="max-h-[34vh] overflow-y-auto">
                {documents.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    selectMode={selectingDocs}
                    selected={selected.has(doc.id)}
                    onToggleSelect={() =>
                      setSelected((s) => toggleIn(s, doc.id))
                    }
                    onDelete={() => void onDeleteDocuments([doc.id])}
                  />
                ))}
              </SidebarMenu>
            ))}
        </SidebarGroup>

        {/* Topics — auto-generated concept groups; expand to list their concepts.
            Hidden on the icon rail — a column of bare colour dots is meaningless. */}
        <SidebarGroup className="group/section group-data-[collapsible=icon]:hidden">
          {topicsSelect ? (
            renderToolbar({
              modes: [
                { value: 'clusters', label: 'Topics' },
                { value: 'concepts', label: 'Concepts' },
              ],
              activeMode: selecting ?? 'clusters',
              onModeChange: (v) =>
                switchTopicsKind(v as 'clusters' | 'concepts'),
            })
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
                  onClick={() => enterSelect('clusters')}
                  label="Select topics"
                />
              )}
            </>
          )}

          {clustersOpen &&
            (loadingGraph ? (
              // Graph arrives async; show skeletons (not the empty prompt) so a
              // returning user's topics aren't briefly reported as gone.
              <div className="space-y-1 px-2 py-1">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : graphError ? (
              <p className="px-2 py-2 text-xs text-muted-foreground">
                Couldn’t load topics.
              </p>
            ) : clusterRows.length === 0 ? (
              <p className="px-2 py-2 text-xs text-muted-foreground">
                No topics yet — upload a document.
              </p>
            ) : (
              <>
                {/* Inline filter — shown once the list is long enough to matter. */}
                {!topicsSelect && clusterRows.length > 8 && (
                  <div className="px-1 pb-1">
                    <SidebarInput
                      value={topicFilter}
                      onChange={(e) => setTopicFilter(e.target.value)}
                      placeholder="Filter topics…"
                      aria-label="Filter topics"
                    />
                  </div>
                )}
                {filteredClusterRows.length === 0 ? (
                  <p className="px-2 py-2 text-xs text-muted-foreground">
                    No topics match “{topicFilter}”.
                  </p>
                ) : (
                  <SidebarMenu>
                    {filteredClusterRows.map((cl) => {
                      const isOpen = expanded.has(cl.id)
                      const concepts = conceptsByCluster.get(cl.id) ?? []
                      const hidden = hiddenTopics.includes(cl.id)
                      const checked = selected.has(cl.id)
                      // One action set for the topic's ⋯ menu and right-click menu.
                      const topicActions: RowAction[] = [
                        {
                          icon: hidden ? Eye : EyeOff,
                          label: hidden ? 'Show on canvas' : 'Hide on canvas',
                          onClick: () => onToggleTopicHidden(cl.id),
                        },
                        {
                          icon: Trash2,
                          label: 'Delete topic',
                          destructive: true,
                          separatorBefore: true,
                          onClick: () => void onDeleteClusters([cl.id]),
                        },
                      ]
                      return (
                        <SidebarMenuItem key={cl.id} className="group/row">
                          <RowContextMenu actions={topicsSelect ? [] : topicActions}>
                            <SidebarMenuButton
                              tooltip={cl.label ?? 'Unlabeled'}
                              isActive={
                                (selectingClusters && checked) ||
                                (!topicsSelect && focusedTopicId === cl.id)
                              }
                              // Row click: normal → focus this topic on the canvas
                              // (the chevron alone expands); selecting topics → toggle
                              // its checkbox; selecting concepts → expand to show them.
                              onClick={() => {
                                if (selectingClusters)
                                  setSelected((s) => toggleIn(s, cl.id))
                                else if (selectingConcepts)
                                  setExpanded((s) => toggleIn(s, cl.id))
                                else onFocusTopic(cl.id)
                              }}
                              onMouseEnter={() => {
                                if (!topicsSelect) onHoverTopic(cl.id)
                              }}
                              onMouseLeave={() => onHoverTopic(null)}
                              title={cl.label ?? 'Unlabeled'}
                              className={cn(hidden && !topicsSelect && 'opacity-50')}
                            >
                              {selectingClusters ? (
                                <span className="flex size-4 shrink-0 items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    readOnly
                                    aria-label={`Select ${cl.label ?? 'topic'}`}
                                    className="pointer-events-none size-3.5 accent-primary"
                                  />
                                </span>
                              ) : !topicsSelect ? (
                                // Colour dot doubles as the topic's colour picker. A
                                // span (the row is already a button); stopPropagation
                                // keeps a colour click from focusing the topic.
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
                                    className="size-3 shrink-0 cursor-pointer rounded-full ring-1 ring-inset ring-black/10 transition-transform hover:scale-125 dark:ring-white/20"
                                    style={{ background: topicColor(cl.id) }}
                                  />
                                </ColorPicker>
                              ) : null}
                              <span className="flex-1 truncate">
                                {cl.label ?? 'Unlabeled'}
                              </span>
                              {/* Count yields to the ⋯ on hover AND while its menu is
                                  open — else, with the cursor on the open menu (row no
                                  longer hovered), the count reappears and overlaps the
                                  still-shown ⋯ in the shared right slot. */}
                              <span
                                className={cn(
                                  ROW_COUNT,
                                  !topicsSelect &&
                                    'transition-opacity group-hover/row:opacity-0 group-has-data-[state=open]/row:opacity-0',
                                )}
                              >
                                {cl.count}
                              </span>
                            </SidebarMenuButton>
                          </RowContextMenu>

                          {/* Expand/collapse on the chevron (works in select mode too,
                              where the row click toggles selection). */}
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

                          {/* Hover ⋯ — hide/show + delete, mirroring the right-click
                              menu. Sits just left of the chevron. */}
                          {!topicsSelect && (
                            <RowOverflow
                              actions={topicActions}
                              label={`Actions for ${cl.label ?? 'topic'}`}
                              className="absolute top-1.5 right-7 opacity-0 transition-opacity group-hover/row:opacity-100 data-[state=open]:opacity-100"
                            />
                          )}

                          {isOpen && (
                            // Left rail tinted in the topic's colour so an expanded run
                            // of concepts reads as belonging to it (matches the canvas).
                            <SidebarMenuSub style={{ borderColor: topicColor(cl.id) }}>
                              {concepts.length === 0 ? (
                                <li className="px-2 py-1 text-xs text-muted-foreground">
                                  No concepts.
                                </li>
                              ) : (
                                concepts.map((con) => {
                                  const cchecked = selected.has(con.id)
                                  const conceptActions: RowAction[] = [
                                    {
                                      icon: SquareArrowOutUpRight,
                                      label: 'Open',
                                      onClick: () => onSelectConcept(con.id),
                                    },
                                    {
                                      icon: Trash2,
                                      label: 'Delete concept',
                                      destructive: true,
                                      separatorBefore: true,
                                      onClick: () =>
                                        void onDeleteConcepts([con.id]),
                                    },
                                  ]
                                  return (
                                    <SidebarMenuSubItem
                                      key={con.id}
                                      data-concept-row={con.id}
                                    >
                                      <RowContextMenu
                                        actions={
                                          selectingConcepts ? [] : conceptActions
                                        }
                                      >
                                        <SidebarMenuSubButton
                                          asChild
                                          isActive={
                                            (selectingConcepts && cchecked) ||
                                            (!topicsSelect &&
                                              selectedConceptId === con.id)
                                          }
                                          className={cn(selectingConcepts && 'pl-7')}
                                        >
                                          <button
                                            type="button"
                                            onClick={() =>
                                              selectingConcepts
                                                ? setSelected((s) =>
                                                    toggleIn(s, con.id),
                                                  )
                                                : onSelectConcept(con.id)
                                            }
                                            onMouseEnter={() => {
                                              if (!selectingConcepts)
                                                onHoverConcept(con.id)
                                            }}
                                            onMouseLeave={() => onHoverConcept(null)}
                                            title={con.name}
                                            className="w-full cursor-pointer"
                                          >
                                            {/* Dot in the topic's colour — the same
                                                colour this concept's canvas node wears. */}
                                            {!selectingConcepts && (
                                              <span
                                                aria-hidden
                                                className="size-1.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/20"
                                                style={{ background: topicColor(cl.id) }}
                                              />
                                            )}
                                            <span className="flex-1 truncate">
                                              {con.name}
                                            </span>
                                            <span
                                              className={cn(
                                                ROW_COUNT,
                                                !selectingConcepts &&
                                                  'transition-opacity group-hover/menu-sub-item:opacity-0 group-has-data-[state=open]/menu-sub-item:opacity-0',
                                              )}
                                            >
                                              {con.mentions}
                                            </span>
                                          </button>
                                        </SidebarMenuSubButton>
                                      </RowContextMenu>
                                      {/* Per-concept checkbox while selecting concepts;
                                          pointer-events-none — the row toggles it. */}
                                      {selectingConcepts && (
                                        <input
                                          type="checkbox"
                                          checked={cchecked}
                                          readOnly
                                          aria-label={`Select ${con.name}`}
                                          className="pointer-events-none absolute left-2 top-1/2 z-10 size-3 -translate-y-1/2 accent-primary"
                                        />
                                      )}
                                      {/* Hover ⋯ — open / delete this concept. */}
                                      {!selectingConcepts && (
                                        <RowOverflow
                                          actions={conceptActions}
                                          label={`Actions for ${con.name}`}
                                          className="absolute top-1/2 right-1 -translate-y-1/2 opacity-0 transition-opacity group-hover/menu-sub-item:opacity-100 data-[state=open]:opacity-100"
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
                )}
              </>
            ))}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* Graph settings (Filters / Display / Forces / Local graph) — secondary
            chrome, tucked by the user menu instead of competing with Search / New. */}
        <SidebarMenu>
          <SidebarMenuItem>
            <Popover>
              <PopoverTrigger asChild>
                <SidebarMenuButton title="Graph settings" tooltip="Graph settings">
                  <Settings className="text-muted-foreground" />
                  <span className="flex-1">Graph settings</span>
                </SidebarMenuButton>
              </PopoverTrigger>
              <PopoverContent
                side="right"
                align="end"
                className="max-h-[70vh] w-64 overflow-y-auto"
              >
                <GraphControls settings={settings} onChange={onChange} />
              </PopoverContent>
            </Popover>
          </SidebarMenuItem>
        </SidebarMenu>
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
        open={confirmOpen}
        onOpenChange={(o) => !o && setConfirmOpen(false)}
        destructive
        loading={deleting}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        title={active ? active.dialogTitle(selected.size) : ''}
        description={active ? active.dialogDescription : ''}
        onConfirm={confirmDelete}
      />

      <SidebarRail />
    </Sidebar>
  )
}
