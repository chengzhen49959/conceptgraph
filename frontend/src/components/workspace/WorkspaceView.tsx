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
  getGraph,
  isProcessing,
  listAnnotations,
  listDocuments,
  resolveAnnotation,
  uploadToS3,
} from '@/lib/api'
import { useGraphSettings } from '@/lib/graph-settings'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppTopbar } from './AppTopbar'
import { NavSidebar } from './NavSidebar'
import { GraphCanvas } from './GraphCanvas'
import { GraphEditToolbar } from './GraphEditToolbar'
import { ConceptPanel } from './ConceptDetail'
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

  // Sidebar→canvas highlight: hovering a topic row lights all its concepts,
  // hovering a concept row lights it + neighbours. At most one is set at a time.
  const [hoverTopicId, setHoverTopicId] = useState<string | null>(null)
  const [hoverConceptId, setHoverConceptId] = useState<string | null>(null)

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

  // Initial document load.
  useEffect(() => {
    refreshDocs().finally(() => setLoadingDocs(false))
  }, [refreshDocs])

  // Load annotations (and re-load when the workspace changes).
  useEffect(() => {
    refreshAnnotations()
  }, [refreshAnnotations])

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

  const selectedNode = useMemo(
    () => graph.nodes.find((n) => n.id === selectedId) ?? null,
    [graph.nodes, selectedId],
  )

  // The active workspace's card (for role-gated chrome). Member management is
  // owner-only and only meaningful on a shared project, not the personal one.
  const current = useMemo(
    () => workspaces.find((w) => w.id === workspaceId),
    [workspaces, workspaceId],
  )
  const canManageMembers = current?.role === 'owner' && current?.type === 'shared'
  // Owner (student) and mentor may edit the graph; plain members are read-only.
  const canEdit = current?.role === 'owner' || current?.role === 'mentor'

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
  // and annotations so a student sees a mentor's edits/flags (and vice versa)
  // without manual refresh. No WebSocket — reuses the polling pattern, slower.
  const isShared = current?.type === 'shared'
  useEffect(() => {
    if (!isShared) return
    const t = setInterval(() => {
      refreshGraph()
      refreshAnnotations()
    }, 6000)
    return () => clearInterval(t)
  }, [isShared, refreshGraph, refreshAnnotations])

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
        onSelectConcept={setSelectedId}
        onHoverTopic={setHoverTopicId}
        onHoverConcept={setHoverConceptId}
        onDeleteDocuments={handleDeleteDocuments}
        onDeleteClusters={handleDeleteClusters}
        settings={settings}
        onChange={patchSettings}
      />

      <SidebarInset className="flex min-h-0 flex-1 flex-col">
        <AppTopbar
          onOpenSearch={() => setSearchOpen(true)}
          workspaceId={workspaceId}
          canManageMembers={!!canManageMembers}
          onGraphChanged={refreshGraph}
        />

        <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
          <ResizablePanel id="center" className="min-w-0">
            <main className="relative h-full min-w-0">
              {canEdit && (
                <GraphEditToolbar
                  workspaceId={workspaceId}
                  onCreated={(id) => {
                    refreshGraph()
                    setSelectedId(id)
                  }}
                />
              )}
              <GraphCanvas
                data={graph}
                settings={settings}
                selectedId={selectedId}
                onSelectId={setSelectedId}
                highlightClusterId={hoverTopicId}
                highlightConceptId={hoverConceptId}
                annotationsByConceptId={annotationsByConceptId}
                canEdit={canEdit}
                onToggleHighlight={(id) => handleToggleAnnotation(id, 'highlight')}
                onToggleFlag={(id) => handleToggleAnnotation(id, 'flag')}
                onDeleteConcept={handleDeleteConcept}
              />
            </main>
          </ResizablePanel>

          {selectedNode && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel
                id="right"
                defaultSize="320px"
                minSize="260px"
                maxSize="480px"
                groupResizeBehavior="preserve-pixel-size"
                className="min-w-0"
              >
                <ConceptPanel
                  node={selectedNode}
                  graph={graph}
                  canEdit={canEdit}
                  annotations={conceptAnnotations}
                  workspaceId={workspaceId}
                  onClose={() => setSelectedId(null)}
                  onNavigate={setSelectedId}
                  onMutated={refreshGraph}
                  onAnnotationsChanged={refreshAnnotations}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>

        <StatusBar graph={graph} documents={docs} />
      </SidebarInset>

      <SearchPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        nodes={graph.nodes}
        onPick={setSelectedId}
      />
    </SidebarProvider>
  )
}
