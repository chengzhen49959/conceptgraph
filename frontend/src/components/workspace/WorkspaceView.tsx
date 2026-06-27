'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  type Annotation,
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
  getGraph,
  isProcessing,
  listAnnotations,
  listDocuments,
  resolveAnnotation,
  startIngest,
  uploadToS3,
} from '@/lib/api'
import { useGraphSettings } from '@/lib/graph-settings'
import { openDocumentSource } from '@/lib/document-source'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppTopbar } from './AppTopbar'
import { NavSidebar } from './NavSidebar'
import { GraphCanvas } from './GraphCanvas'
import { GraphEditToolbar } from './GraphEditToolbar'
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
  // First-fetch state for the canvas: a returning user's graph arrives async, so
  // gate the "empty / upload a document" copy on these — otherwise it flashes as if
  // their work were gone (and a failed fetch would leave it permanently). `graph`
  // starts EMPTY, so loadingGraph starts true and clears once the first fetch settles.
  const [loadingGraph, setLoadingGraph] = useState(true)
  const [graphError, setGraphError] = useState(false)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [activityUnread, setActivityUnread] = useState(0)

  // Concepts a RAG answer relies on (F8). Set live as an answer streams in the
  // search palette's Ask mode; lights these on the canvas and dims the rest, and
  // persists after the palette closes so the lit graph is the reveal. Cleared when
  // the user selects a concept or focuses a topic (normal interaction resumes).
  const [askConceptIds, setAskConceptIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )

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
    setAskConceptIds(new Set()) // a manual pick supersedes the RAG highlight
    setSelectedId(id)
  }, [])
  const focusTopic = useCallback((id: string) => {
    setSelectedId(null)
    setAskConceptIds(new Set())
    setFocusedTopicId(id)
  }, [])

  // Source view: opening a document from the sidebar swaps the canvas for the
  // user's original source — a file upload links to its file (open / download), a
  // web clip to its origin page — opened directly, no in-app view.
  // Open a document's source from the concept panel's Sources list (looks the doc
  // up so the panel only needs to pass an id).
  const openSource = useCallback(
    (documentId: string) => {
      const doc = docs.find((d) => d.id === documentId)
      if (doc) void openDocumentSource(doc)
    },
    [docs],
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
      setGraphError(false)
    } catch (e) {
      setGraphError(true)
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
    // Clear the first-load flag once the fetch settles. Done here (not inside
    // refreshGraph) so the 6s shared-workspace poll never re-triggers a loading state.
    refreshGraph().finally(() => setLoadingGraph(false))
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

  // Upload one or many files. Each file is its own independent ingest: presign
  // (createDocument) → PUT to S3 → enqueue (startIngest). Enqueue comes AFTER the
  // PUT so the worker never reads the object before it exists (a NoSuchKey race).
  // A few run at a time — the slow part is the S3 PUT, and the worker's per-workspace
  // merge lock serialises the heavy graph-merge phase no matter how fast we enqueue,
  // so a bad file only fails itself and never sinks the rest of the batch.
  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return
      setBusy(true)
      let ok = 0
      const failures: string[] = []
      const uploadOne = async (file: File) => {
        try {
          const contentType = contentTypeFor(file.name)
          const { document_id, upload_url } = await createDocument({
            filename: file.name,
            content_type: contentType,
            title: file.name,
            workspace_id: workspaceId,
          })
          await uploadToS3(upload_url, file, contentType)
          await startIngest(document_id) // enqueue only now the bytes are in S3
          ok += 1
        } catch (e) {
          failures.push(`${file.name}: ${(e as Error).message}`)
        }
      }
      try {
        // Bounded-concurrency worker pool: POOL tasks each drain a shared queue.
        const queue = [...files]
        const POOL = 3
        await Promise.all(
          Array.from({ length: Math.min(POOL, queue.length) }, async () => {
            for (let file = queue.shift(); file; file = queue.shift()) {
              await uploadOne(file)
            }
          }),
        )
        await refreshDocs() // the new pending docs start the polling loop
        if (ok > 0) {
          toast.success(
            files.length === 1
              ? `Uploading "${files[0].name}" — building the graph…`
              : `Queued ${ok} document${ok > 1 ? 's' : ''} — building the graph…`,
          )
        }
        for (const msg of failures) toast.error(msg)
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
      const n = ids.length
      // Show a live "Deleting…" toast immediately — the delete + full graph refetch
      // take a beat, and the row doesn't vanish until the refetch lands, so without
      // this the UI looks frozen. Resolve the SAME toast id to success/error.
      const tid = toast.loading(`Deleting ${n} document${n > 1 ? 's' : ''}…`)
      try {
        const r = await deleteDocuments(ids, workspaceId)
        await Promise.all([refreshDocs(), refreshGraph()])
        toast.success(
          `Deleted ${n} document${n > 1 ? 's' : ''}` +
            (r.deleted_concepts ? ` and ${r.deleted_concepts} orphaned concept(s)` : ''),
          { id: tid },
        )
      } catch (e) {
        toast.error((e as Error).message, { id: tid })
      }
    },
    [refreshDocs, refreshGraph, workspaceId],
  )

  const handleDeleteClusters = useCallback(
    async (ids: string[]) => {
      const n = ids.length
      const tid = toast.loading(`Deleting ${n} topic${n > 1 ? 's' : ''} & their concepts…`)
      try {
        const r = await deleteClusters(ids, workspaceId)
        await refreshGraph() // clusters/concepts are graph-only; docs are untouched
        toast.success(
          `Deleted ${n} topic${n > 1 ? 's' : ''}` +
            (r.deleted_concepts ? ` and ${r.deleted_concepts} concept(s)` : ''),
          { id: tid },
        )
      } catch (e) {
        toast.error((e as Error).message, { id: tid })
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
      const tid = toast.loading('Deleting concept…')
      try {
        await deleteConcept(conceptId)
        setSelectedId((cur) => (cur === conceptId ? null : cur))
        await refreshGraph()
        toast.success('Concept deleted', { id: tid })
      } catch (e) {
        toast.error((e as Error).message, { id: tid })
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
      const n = ids.length
      const tid = toast.loading(`Deleting ${n} concept${n > 1 ? 's' : ''}…`)
      const results = await Promise.allSettled(ids.map((id) => deleteConcept(id)))
      const ok = results.filter((r) => r.status === 'fulfilled').length
      const failed = ids.length - ok
      setSelectedId((cur) => (cur && ids.includes(cur) ? null : cur))
      await refreshGraph()
      // Always resolve the loading toast (success if any deleted, else error) so it
      // never hangs spinning.
      if (ok)
        toast.success(
          `Deleted ${ok} concept${ok > 1 ? 's' : ''}` +
            (failed ? ` · ${failed} failed` : ''),
          { id: tid },
        )
      else
        toast.error(`Failed to delete ${failed} concept${failed > 1 ? 's' : ''}`, {
          id: tid,
        })
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

  // The workspace graph canvas. Kept as one factory so its wiring lives in one place.
  const graphView = () => (
    <GraphCanvas
      data={graph}
      settings={settings}
      loading={loadingGraph}
      error={graphError}
      onRetry={refreshGraph}
      selectedId={selectedId}
      onSelectId={selectConcept}
      highlightClusterId={hoverTopicId}
      focusedClusterId={focusedTopicId}
      highlightConceptId={hoverConceptId}
      highlightConceptIds={askConceptIds.size ? askConceptIds : undefined}
      annotationsByConceptId={annotationsByConceptId}
      canEdit={canEdit}
      onToggleHighlight={(id) => handleToggleAnnotation(id, 'highlight')}
      onToggleFlag={(id) => handleToggleAnnotation(id, 'flag')}
      onDeleteConcept={handleDeleteConcept}
    />
  )

  return (
    <SidebarProvider className="h-screen">
      <NavSidebar
        documents={docs}
        graph={graph}
        onPickFiles={handleFiles}
        busy={busy}
        loadingDocs={loadingDocs}
        loadingGraph={loadingGraph}
        graphError={graphError}
        workspaceName={workspaceName}
        workspaces={workspaces}
        currentId={workspaceId}
        email={email}
        onOpenSearch={() => setSearchOpen(true)}
        onSelectConcept={selectConcept}
        selectedConceptId={selectedId}
        onFocusTopic={focusTopic}
        focusedTopicId={focusedTopicId}
        onHoverTopic={setHoverTopicId}
        onHoverConcept={setHoverConceptId}
        onDeleteDocuments={handleDeleteDocuments}
        onDeleteClusters={handleDeleteClusters}
        onDeleteConcepts={handleDeleteConcepts}
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
          {canEdit && (
            <GraphEditToolbar
              workspaceId={workspaceId}
              onCreated={(id) => {
                refreshGraph()
                selectConcept(id)
              }}
            />
          )}
          {graphView()}
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
            onOpenSource={openSource}
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
        onCited={setAskConceptIds}
      />
    </SidebarProvider>
  )
}
