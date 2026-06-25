'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  type Annotation,
  type DocumentContent,
  type DocumentOut,
  type GraphData,
  type WorkspaceCard,
  contentTypeFor,
  createAnnotation,
  createDocument,
  deleteClusters,
  deleteConcept,
  deleteDocuments,
  getActivityUnread,
  getDocumentContent,
  getGraph,
  isProcessing,
  listAnnotations,
  listDocuments,
  resolveAnnotation,
  uploadToS3,
} from '@/lib/api'
import { useGraphSettings } from '@/lib/graph-settings'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppTopbar } from './AppTopbar'
import { NavSidebar } from './NavSidebar'
import { GraphCanvas } from './GraphCanvas'
import { GraphEditToolbar } from './GraphEditToolbar'
import { DocumentReader } from './DocumentReader'
import { LocalGraphMini } from './LocalGraphMini'
import { ConceptPanel } from './ConceptDetail'
import { TopicPanel } from './TopicDetail'
import { SearchPalette } from './SearchPalette'
import { StatusBar } from './StatusBar'

const EMPTY: GraphData = { nodes: [], links: [], clusters: [] }

export function WorkspaceView({
  email,
  workspaces,
  workspaceId,
  workspaceName,
}: {
  email: string | null
  workspaces: WorkspaceCard[]
  // The active workspace. undefined = the caller's personal workspace (the API
  // defaults to it), which is the fallback when the workspace list can't load.
  workspaceId: string | undefined
  workspaceName: string
}) {
  const [docs, setDocs] = useState<DocumentOut[]>([])
  const [graph, setGraph] = useState<GraphData>(EMPTY)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [activityUnread, setActivityUnread] = useState(0)

  // Sidebar→canvas highlight: hovering a topic row lights all its concepts,
  // hovering a concept row lights it + neighbours. At most one is set at a time.
  const [hoverTopicId, setHoverTopicId] = useState<string | null>(null)
  const [hoverConceptId, setHoverConceptId] = useState<string | null>(null)

  // A topic focused from search acts like a node selection: it persistently
  // lights its whole cluster and centres it in the canvas. Focus and concept
  // selection are mutually exclusive — picking either clears the other.
  const [focusedTopicId, setFocusedTopicId] = useState<string | null>(null)
  const selectConcept = useCallback((id: string | null) => {
    setFocusedTopicId(null)
    setSelectedId(id)
  }, [])
  const focusTopic = useCallback((id: string) => {
    setSelectedId(null)
    setFocusedTopicId(id)
  }, [])

  // Reading view: when a document is open, the main area shows its source text and
  // the full graph shrinks to a corner local graph. The payload (parsed Markdown +
  // the doc's concepts) is fetched on demand. Selecting a concept from either the
  // text or the mini graph restores the full graph with that concept selected.
  const [readingDocId, setReadingDocId] = useState<string | null>(null)
  const [readingContent, setReadingContent] = useState<DocumentContent | null>(null)
  const [readingLoading, setReadingLoading] = useState(false)
  const closeReader = useCallback(() => setReadingDocId(null), [])
  const openConceptFromReader = useCallback(
    (id: string) => {
      setReadingDocId(null)
      selectConcept(id)
    },
    [selectConcept],
  )

  // Graph control-panel state (filters / display / forces / local graph),
  // persisted to localStorage per workspace. NavSidebar owns the whole control
  // surface now (topic colour/visibility + the control sections), so it only needs
  // the state and its setter.
  const [settings, patchSettings] = useGraphSettings(workspaceId)

  const refreshDocs = useCallback(async () => {
    try {
      setDocs(await listDocuments(workspaceId))
    } catch (e) {
      toast.error((e as Error).message)
    }
  }, [workspaceId])

  const refreshGraph = useCallback(async () => {
    try {
      setGraph(await getGraph(workspaceId))
    } catch (e) {
      toast.error((e as Error).message)
    }
  }, [workspaceId])

  // Annotations are optional chrome — a fetch failure shouldn't toast over the
  // graph. Empty when there's no workspace id (backend unreachable).
  const refreshAnnotations = useCallback(async () => {
    if (!workspaceId) {
      setAnnotations([])
      return
    }
    try {
      setAnnotations(await listAnnotations(workspaceId))
    } catch {
      // ignore
    }
  }, [workspaceId])

  // Unread activity badge (events by others since this member last opened the
  // feed). Optional chrome — swallow errors. Reset to 0 when the feed is opened.
  const refreshActivityUnread = useCallback(async () => {
    if (!workspaceId) {
      setActivityUnread(0)
      return
    }
    try {
      setActivityUnread((await getActivityUnread(workspaceId)).count)
    } catch {
      // ignore
    }
  }, [workspaceId])
  const clearActivityUnread = useCallback(() => setActivityUnread(0), [])

  // Initial document load.
  useEffect(() => {
    refreshDocs().finally(() => setLoadingDocs(false))
  }, [refreshDocs])

  // Load annotations (and re-load when the workspace changes).
  useEffect(() => {
    refreshAnnotations()
  }, [refreshAnnotations])

  // Load the unread activity count on workspace change (the poll keeps it fresh).
  useEffect(() => {
    refreshActivityUnread()
  }, [refreshActivityUnread])

  // Poll while any document is still being ingested.
  const processing = docs.some((d) => isProcessing(d.status))
  useEffect(() => {
    if (!processing) return
    const t = setInterval(refreshDocs, 2500)
    return () => clearInterval(t)
  }, [processing, refreshDocs])

  // Re-fetch the graph whenever another document finishes (and once on mount).
  const doneCount = docs.filter((d) => d.status === 'done').length
  useEffect(() => {
    refreshGraph()
  }, [doneCount, refreshGraph])

  // Surface failures as they land.
  useEffect(() => {
    const failed = docs.find((d) => d.status === 'failed')
    if (failed) toast.error(`Failed to ingest "${failed.title}"`)
  }, [docs])

  // ⌘K / Ctrl-K opens search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Load the reading payload when a document is opened; clear it when closed. A
  // failed fetch leaves content null, so the reader shows its unavailable state.
  useEffect(() => {
    if (!readingDocId) {
      setReadingContent(null)
      return
    }
    let alive = true
    setReadingLoading(true)
    setReadingContent(null)
    getDocumentContent(readingDocId)
      .then((c) => alive && setReadingContent(c))
      .catch((e) => alive && toast.error((e as Error).message))
      .finally(() => alive && setReadingLoading(false))
    return () => {
      alive = false
    }
  }, [readingDocId])

  const handleFile = useCallback(
    async (file: File) => {
      setBusy(true)
      try {
        const contentType = contentTypeFor(file.name)
        const { upload_url } = await createDocument({
          filename: file.name,
          content_type: contentType,
          title: file.name,
          workspace_id: workspaceId,
        })
        await uploadToS3(upload_url, file, contentType)
        await refreshDocs() // the new pending doc starts the polling loop
        toast.success(`Uploading "${file.name}" — building the graph…`)
      } catch (e) {
        toast.error((e as Error).message)
      } finally {
        setBusy(false)
      }
    },
    [refreshDocs, workspaceId],
  )

  // Delete handlers live here because the domain state (docs, graph) and its
  // refetchers do. Children just hand back the ids to remove. A deleted concept
  // collapses the detail panel on its own (selectedNode resolves to null), and a
  // deleted focused cluster is reconciled by the effect above.
  const handleDeleteDocuments = useCallback(
    async (ids: string[]) => {
      try {
        const r = await deleteDocuments(ids, workspaceId)
        await Promise.all([refreshDocs(), refreshGraph()])
        const n = ids.length
        toast.success(
          `Deleted ${n} document${n > 1 ? 's' : ''}` +
            (r.deleted_concepts ? ` and ${r.deleted_concepts} orphaned concept(s)` : ''),
        )
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    [refreshDocs, refreshGraph, workspaceId],
  )

  const handleDeleteClusters = useCallback(
    async (ids: string[]) => {
      try {
        const r = await deleteClusters(ids, workspaceId)
        await refreshGraph() // clusters/concepts are graph-only; docs are untouched
        const n = ids.length
        toast.success(
          `Deleted ${n} topic${n > 1 ? 's' : ''}` +
            (r.deleted_concepts ? ` and ${r.deleted_concepts} concept(s)` : ''),
        )
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    [refreshGraph, workspaceId],
  )

  // Node right-click menu actions. Toggle resolves the open marker if present,
  // else creates one (mirrors ConceptAnnotations). Delete removes the concept and
  // closes its panel if it was open.
  const handleToggleAnnotation = useCallback(
    async (conceptId: string, kind: 'highlight' | 'flag') => {
      const existing = annotations.find(
        (a) =>
          !a.parent_id &&
          a.status === 'open' &&
          a.target_concept_id === conceptId &&
          a.kind === kind,
      )
      try {
        if (existing) await resolveAnnotation(existing.id)
        else
          await createAnnotation({
            workspace_id: workspaceId,
            target_type: 'concept',
            target_concept_id: conceptId,
            kind,
          })
        await refreshAnnotations()
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    [annotations, workspaceId, refreshAnnotations],
  )

  const handleDeleteConcept = useCallback(
    async (conceptId: string) => {
      try {
        await deleteConcept(conceptId)
        setSelectedId((cur) => (cur === conceptId ? null : cur))
        await refreshGraph()
        toast.success('Concept deleted')
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    [refreshGraph],
  )

  // Batch concept delete for the sidebar's per-concept multi-select. There's no
  // batch endpoint (concept delete is one id + optional cascade), so fan out the
  // single calls and tolerate partial failure — one rejected delete shouldn't sink
  // the rest. Refetch once at the end. Closes the open panel if its concept went.
  const handleDeleteConcepts = useCallback(
    async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => deleteConcept(id)))
      const ok = results.filter((r) => r.status === 'fulfilled').length
      const failed = ids.length - ok
      setSelectedId((cur) => (cur && ids.includes(cur) ? null : cur))
      await refreshGraph()
      if (ok)
        toast.success(
          `Deleted ${ok} concept${ok > 1 ? 's' : ''}` +
            (failed ? ` · ${failed} failed` : ''),
        )
      else if (failed) toast.error(`Failed to delete ${failed} concept${failed > 1 ? 's' : ''}`)
    },
    [refreshGraph],
  )

  const selectedNode = useMemo(
    () => graph.nodes.find((n) => n.id === selectedId) ?? null,
    [graph.nodes, selectedId],
  )
  const focusedCluster = useMemo(
    () => graph.clusters.find((c) => c.id === focusedTopicId) ?? null,
    [graph.clusters, focusedTopicId],
  )

  // The open document, derived — so deleting it out from under the reader closes
  // the view for free (same pattern as focusedCluster), no reconciliation effect.
  const readingDoc = useMemo(
    () => docs.find((d) => d.id === readingDocId) ?? null,
    [docs, readingDocId],
  )

  // The open document's concepts — the node set for the corner local graph.
  const readingConceptIds = useMemo(
    () => new Set(readingContent?.concepts.map((c) => c.id) ?? []),
    [readingContent],
  )

  // The active workspace's card (for role-gated chrome). Member management is
  // owner-only and only meaningful on a shared project, not the personal one.
  const current = useMemo(
    () => workspaces.find((w) => w.id === workspaceId),
    [workspaces, workspaceId],
  )
  const canManageMembers = current?.role === 'owner' && current?.type === 'shared'
  // Owner and editor may edit the graph; commenter/viewer cannot.
  const canEdit = current?.role === 'owner' || current?.role === 'editor'
  // Owner / editor / commenter may comment; a viewer is read-only.
  const canComment =
    current?.role === 'owner' ||
    current?.role === 'editor' ||
    current?.role === 'commenter'

  // Open highlight/flag markers per concept, for the canvas overlay.
  const annotationsByConceptId = useMemo(() => {
    const m = new Map<string, { highlight: boolean; flag: boolean }>()
    for (const a of annotations) {
      if (a.parent_id || a.status !== 'open' || !a.target_concept_id) continue
      if (a.kind !== 'highlight' && a.kind !== 'flag') continue
      const cur = m.get(a.target_concept_id) ?? { highlight: false, flag: false }
      if (a.kind === 'highlight') cur.highlight = true
      else cur.flag = true
      m.set(a.target_concept_id, cur)
    }
    return m
  }, [annotations])

  // Annotations targeting the open concept (roots + replies).
  const conceptAnnotations = useMemo(
    () =>
      selectedId
        ? annotations.filter((a) => a.target_concept_id === selectedId)
        : [],
    [annotations, selectedId],
  )

  // Async collaboration: on a shared workspace, periodically re-fetch the graph
  // and annotations so a student sees an editor's edits/flags (and vice versa)
  // without manual refresh. No WebSocket — reuses the polling pattern, slower.
  const isShared = current?.type === 'shared'
  useEffect(() => {
    if (!isShared) return
    const t = setInterval(() => {
      refreshGraph()
      refreshAnnotations()
      refreshActivityUnread()
    }, 6000)
    return () => clearInterval(t)
  }, [isShared, refreshGraph, refreshAnnotations, refreshActivityUnread])

  return (
    <SidebarProvider className="h-screen">
      <NavSidebar
        documents={docs}
        graph={graph}
        onPickFile={handleFile}
        busy={busy}
        loading={loadingDocs}
        workspaceName={workspaceName}
        workspaces={workspaces}
        currentId={workspaceId}
        email={email}
        onOpenSearch={() => setSearchOpen(true)}
        onSelectConcept={selectConcept}
        onHoverTopic={setHoverTopicId}
        onHoverConcept={setHoverConceptId}
        onDeleteDocuments={handleDeleteDocuments}
        onDeleteClusters={handleDeleteClusters}
        onDeleteConcepts={handleDeleteConcepts}
        onSelectDocument={setReadingDocId}
        activeDocId={readingDocId}
        settings={settings}
        onChange={patchSettings}
      />

      <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppTopbar
          onOpenSearch={() => setSearchOpen(true)}
          workspaceId={workspaceId}
          canManageMembers={!!canManageMembers}
          onGraphChanged={refreshGraph}
          activityUnread={activityUnread}
          onActivitySeen={clearActivityUnread}
          onNavigateConcept={selectConcept}
        />

        <div className="relative min-h-0 min-w-0 flex-1">
          {readingDoc ? (
            <>
              <DocumentReader
                content={readingContent}
                loading={readingLoading}
                onClose={closeReader}
                onSelectConcept={openConceptFromReader}
              />
              {/* The full graph, shrunk to a corner local graph of this document
                  (Obsidian's 关系图谱 pane). Shown only for an uploaded file with
                  concepts: a web clip renders as an embedded page (source_url set),
                  which can't carry inline concept links — so its corner graph would
                  dangle with nothing in the reader to jump from. */}
              {!readingContent?.source_url && readingConceptIds.size > 0 && (
                <div className="absolute right-3 top-3 z-20 h-44 w-72">
                  <LocalGraphMini
                    graph={graph}
                    conceptIds={readingConceptIds}
                    selectedId={selectedId}
                    topicColors={settings.topicColors}
                    onSelectConcept={openConceptFromReader}
                    onExpand={closeReader}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              {canEdit && (
                <GraphEditToolbar
                  workspaceId={workspaceId}
                  onCreated={(id) => {
                    refreshGraph()
                    selectConcept(id)
                  }}
                />
              )}
              <GraphCanvas
                data={graph}
                settings={settings}
                selectedId={selectedId}
                onSelectId={selectConcept}
                highlightClusterId={hoverTopicId}
                focusedClusterId={focusedTopicId}
                highlightConceptId={hoverConceptId}
                annotationsByConceptId={annotationsByConceptId}
                canEdit={canEdit}
                onToggleHighlight={(id) => handleToggleAnnotation(id, 'highlight')}
                onToggleFlag={(id) => handleToggleAnnotation(id, 'flag')}
                onDeleteConcept={handleDeleteConcept}
              />
            </>
          )}
        </div>

        <StatusBar graph={graph} documents={docs} />
      </SidebarInset>

      {/* Full-height detail panel: sibling of the inset so it spans the whole
          window height, symmetric with the left sidebar. The topbar and status
          bar live inside the inset and only span the canvas. */}
      {selectedNode && (
        <aside className="flex w-80 shrink-0 border-l bg-background">
          <ConceptPanel
            node={selectedNode}
            graph={graph}
            canEdit={canEdit}
            canComment={canComment}
            annotations={conceptAnnotations}
            workspaceId={workspaceId}
            onClose={() => setSelectedId(null)}
            onNavigate={selectConcept}
            onMutated={refreshGraph}
            onAnnotationsChanged={refreshAnnotations}
          />
        </aside>
      )}

      {focusedCluster && (
        <aside className="flex w-80 shrink-0 border-l bg-background">
          <TopicPanel
            cluster={focusedCluster}
            graph={graph}
            onClose={() => setFocusedTopicId(null)}
            onSelectConcept={selectConcept}
          />
        </aside>
      )}

      <SearchPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        nodes={graph.nodes}
        clusters={graph.clusters}
        workspaceId={workspaceId}
        onPick={selectConcept}
        onPickTopic={focusTopic}
      />
    </SidebarProvider>
  )
}
