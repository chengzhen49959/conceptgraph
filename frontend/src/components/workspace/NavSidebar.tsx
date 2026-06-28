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

/** What the sidebar can batch-select for deletion. Documents select on their own; the
 *  graph section selects topics and concepts together in one mixed set — a topic delete
 *  cascades to its concepts, so the two belong in one interface, not a kind switch. */
type SelectKind = 'documents' | 'graph'

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

  // One batch-select machine. `selecting` names the active section ('documents' or
  // 'graph'); `selected` holds its checked ids. The graph section mixes topic and
  // concept ids in that one set — checking a topic marks its whole group (delete
  // cascades to its concepts), checking a concept marks just that node — so topics and
  // concepts are picked together in one list instead of a Topics-or-Concepts switch.
  const [selecting, setSelecting] = useState<SelectKind | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const selectingDocs = selecting === 'documents'
  const selectingGraph = selecting === 'graph'
  // The Topics section is "in select mode" while the graph section is selecting.
  const topicsSelect = selectingGraph

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

  // Enter a section's select mode, opening that section so the rows being selected are
  // visible. The graph section opens the Topics list (topics + their concepts).
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

  // id → its cluster_id, and the set of topic ids — used to split a mixed
  // (topic + concept) graph selection back into a topics delete and a concepts delete.
  const conceptClusterOf = useMemo(() => {
    const m = new Map<string, string | null>()
    for (const n of graph.nodes) m.set(n.id, n.cluster_id ?? null)
    return m
  }, [graph.nodes])
  const clusterIdSet = useMemo(
    () => new Set(clusterRows.map((c) => c.id)),
    [clusterRows],
  )

  // One descriptor per selectable section: the id universe its select-all / invert act
  // over, and the delete call. The graph section's delete splits the mixed set — topic
  // ids go through the cascading cluster delete (which also removes their concepts),
  // the rest through the concept delete, dropping any concept already covered by a
  // selected topic so nothing is deleted twice. (Confirm copy is computed below from
  // the topic/concept breakdown.)
  const descriptors = useMemo(
    () => ({
      documents: {
        allIds: documents.map((d) => d.id),
        onDelete: onDeleteDocuments,
        dialogTitle: (n: number) => `Delete ${n} document${n > 1 ? 's' : ''}?`,
        dialogDescription:
          'Their chunks, and any concepts only they mention, are removed from the graph. Concepts cited by other documents are kept. This cannot be undone.',
      },
      graph: {
        allIds: [...clusterRows.map((c) => c.id), ...allConceptIds],
        onDelete: async (ids: string[]) => {
          const topicIds = ids.filter((id) => clusterIdSet.has(id))
          const topicSet = new Set(topicIds)
          const conceptIds = ids.filter(
            (id) =>
              !clusterIdSet.has(id) &&
              !topicSet.has(conceptClusterOf.get(id) ?? ''),
          )
          if (topicIds.length) await onDeleteClusters(topicIds)
          if (conceptIds.length) await onDeleteConcepts(conceptIds)
        },
        dialogTitle: (n: number) => `Delete ${n} item${n > 1 ? 's' : ''}?`,
        dialogDescription:
          'The selected topics (with their concepts) and concepts, and their relationships, are removed from the graph. Documents are kept. This cannot be undone.',
      },
    }),
    [
      documents,
      clusterRows,
      allConceptIds,
      clusterIdSet,
      conceptClusterOf,
      onDeleteDocuments,
      onDeleteClusters,
      onDeleteConcepts,
    ],
  )

  const active = selecting ? descriptors[selecting] : null
  const allIds = active?.allIds ?? []

  // Graph selection mixes topics + concepts; break it down so the confirm dialog names
  // both (and spells out that deleting a topic also removes the concepts inside it).
  const selTopicCount = useMemo(
    () => [...selected].filter((id) => clusterIdSet.has(id)).length,
    [selected, clusterIdSet],
  )
  const selConceptCount = selected.size - selTopicCount
  // Concepts that ride along with the selected topics (removed by the cascade) — so the
  // confirm can state how many concepts a topic delete actually takes with it.
  const selTopicConceptCount = useMemo(
    () =>
      [...selected]
        .filter((id) => clusterIdSet.has(id))
        .reduce((sum, id) => sum + (conceptsByCluster.get(id)?.length ?? 0), 0),
    [selected, clusterIdSet, conceptsByCluster],
  )
  const confirmTitle = selectingGraph
    ? `Delete ${[
        selTopicCount && `${selTopicCount} topic${selTopicCount > 1 ? 's' : ''}`,
        selConceptCount &&
          `${selConceptCount} concept${selConceptCount > 1 ? 's' : ''}`,
      ]
        .filter(Boolean)
        .join(' and ')}?`
    : active
      ? active.dialogTitle(selected.size)
      : ''
  const confirmDescription = selectingGraph
    ? selTopicCount > 0
      ? `Deleting ${selTopicCount === 1 ? 'this topic' : 'these topics'} also removes the ${selTopicConceptCount} concept${selTopicConceptCount === 1 ? '' : 's'} inside ${selTopicCount === 1 ? 'it' : 'them'}${selConceptCount > 0 ? `, plus the ${selConceptCount} concept${selConceptCount === 1 ? '' : 's'} you picked separately` : ''} — with all their relationships. Source documents are kept. This cannot be undone.`
      : 'The selected concepts and their relationships are removed from the graph. Source documents are kept. This cannot be undone.'
    : active?.dialogDescription ?? ''

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

  // The single selection toolbar, parameterised by the active section.
  const renderToolbar = () => (
    <SelectionToolbar
      count={selected.size}
      allSelected={allIds.length > 0 && selected.size === allIds.length}
      deleteDisabled={selected.size === 0}
      onSelectAll={() => setSelected((s) => selectAllOrNone(s, allIds))}
      onInvert={() => setSelected((s) => invertSelection(s, allIds))}
      onClear={exitSelect}
      onDelete={() => setConfirmOpen(true)}
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
              <SidebarMenu>
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
          {/* The whole sidebar scrolls as one, but this header bar stays pinned to
              the top of the scroll area (`sticky top-0`) so the Topics Select entry
              — then the batch toolbar that replaces it — is always reachable in a
              long topic list. z-20 covers the rows' z-10 checkboxes; bg-sidebar
              keeps it opaque as rows scroll under it. The Select toggle is absolute,
              so it now anchors to this wrapper — re-centred with `top-1/2`. */}
          <div className="sticky top-0 z-20 bg-sidebar">
            {topicsSelect ? (
              renderToolbar()
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
                    onClick={() => enterSelect('graph')}
                    label="Select topics & concepts"
                    className="top-1/2 -translate-y-1/2"
                  />
                )}
              </>
            )}
          </div>

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
                          label: `Delete topic & ${cl.count} concept${cl.count === 1 ? '' : 's'}`,
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
                                (selectingGraph && checked) ||
                                (!topicsSelect && focusedTopicId === cl.id)
                              }
                              // Row click: normal → focus this topic on the canvas;
                              // selecting → toggle its checkbox (marks the whole group
                              // for delete). The chevron alone expands to its concepts.
                              onClick={() => {
                                if (selectingGraph)
                                  setSelected((s) => toggleIn(s, cl.id))
                                else onFocusTopic(cl.id)
                              }}
                              onMouseEnter={() => {
                                if (!topicsSelect) onHoverTopic(cl.id)
                              }}
                              onMouseLeave={() => onHoverTopic(null)}
                              title={cl.label ?? 'Unlabeled'}
                              className={cn(hidden && !topicsSelect && 'opacity-50')}
                            >
                              {selectingGraph ? (
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
                                  // A checked topic implies all its concepts (delete
                                  // cascades to them), so show them checked too — the
                                  // user sees exactly what goes with the topic. While the
                                  // topic owns them they can't be individually unchecked.
                                  const cImplied = checked // parent topic is selected
                                  const cchecked = cImplied || selected.has(con.id)
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
                                          selectingGraph ? [] : conceptActions
                                        }
                                      >
                                        <SidebarMenuSubButton
                                          asChild
                                          isActive={
                                            (selectingGraph && cchecked) ||
                                            (!topicsSelect &&
                                              selectedConceptId === con.id)
                                          }
                                          className={cn(selectingGraph && 'pl-7')}
                                        >
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (selectingGraph) {
                                                // Implied-by-topic concepts can't be
                                                // toggled off on their own.
                                                if (!cImplied)
                                                  setSelected((s) =>
                                                    toggleIn(s, con.id),
                                                  )
                                              } else onSelectConcept(con.id)
                                            }}
                                            onMouseEnter={() => {
                                              if (!selectingGraph)
                                                onHoverConcept(con.id)
                                            }}
                                            onMouseLeave={() => onHoverConcept(null)}
                                            title={con.name}
                                            className={cn(
                                              'w-full',
                                              selectingGraph && cImplied
                                                ? 'cursor-default'
                                                : 'cursor-pointer',
                                            )}
                                          >
                                            {/* Dot in the topic's colour — the same
                                                colour this concept's canvas node wears. */}
                                            {!selectingGraph && (
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
                                                !selectingGraph &&
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
                                      {selectingGraph && (
                                        <input
                                          type="checkbox"
                                          checked={cchecked}
                                          readOnly
                                          aria-label={
                                            cImplied
                                              ? `${con.name} — included via its topic`
                                              : `Select ${con.name}`
                                          }
                                          className={cn(
                                            'pointer-events-none absolute left-2 top-1/2 z-10 size-3 -translate-y-1/2 accent-primary',
                                            cImplied && 'opacity-50',
                                          )}
                                        />
                                      )}
                                      {/* Hover ⋯ — open / delete this concept. */}
                                      {!selectingGraph && (
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
        title={confirmTitle}
        description={confirmDescription}
        onConfirm={confirmDelete}
      />

      <SidebarRail />
    </Sidebar>
  )
}
