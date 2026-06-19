'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePanelRef } from 'react-resizable-panels'
import { toast } from 'sonner'
import {
  type DocumentOut,
  type GraphData,
  contentTypeFor,
  createDocument,
  deleteClusters,
  deleteDocuments,
  getGraph,
  isProcessing,
  listDocuments,
  uploadToS3,
} from '@/lib/api'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { AppTopbar } from './AppTopbar'
import { NavSidebar } from './NavSidebar'
import { GraphCanvas } from './GraphCanvas'
import { ConceptPanel } from './ConceptDetail'
import { SearchPalette } from './SearchPalette'
import { StatusBar } from './StatusBar'

const EMPTY: GraphData = { nodes: [], links: [], clusters: [] }

export function WorkspaceView({ email }: { email: string | null }) {
  const [docs, setDocs] = useState<DocumentOut[]>([])
  const [graph, setGraph] = useState<GraphData>(EMPTY)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)

  // Imperative handle on the left panel so the topbar button can collapse it.
  const leftRef = usePanelRef()
  const toggleLeft = useCallback(() => {
    const p = leftRef.current
    if (!p) return
    if (p.isCollapsed()) p.expand()
    else p.collapse()
  }, [leftRef])

  // Cluster drill-in: null = overview (every cluster collapses to one super-node);
  // an id = focus that cluster, showing only its concepts and the edges between
  // them. Clicking the focused cluster again — or the canvas background / back
  // chip — returns to the overview.
  const [focusedClusterId, setFocusedClusterId] = useState<string | null>(null)
  const onFocusCluster = useCallback(
    (id: string | null) => setFocusedClusterId((prev) => (prev === id ? null : id)),
    [],
  )

  // Sidebar→canvas highlight: hovering a topic row lights all its concepts,
  // hovering a concept row lights it + neighbours. At most one is set at a time.
  const [hoverTopicId, setHoverTopicId] = useState<string | null>(null)
  const [hoverConceptId, setHoverConceptId] = useState<string | null>(null)

  // A deleted cluster can leave focusedClusterId dangling. Rather than write state
  // from an effect, derive the effective focus: a focus on a cluster no longer in
  // the graph reads as "no focus" (back to the overview). Same self-healing shape
  // as selectedNode below.
  const effectiveFocusedClusterId = useMemo(
    () =>
      focusedClusterId && graph.clusters.some((c) => c.id === focusedClusterId)
        ? focusedClusterId
        : null,
    [focusedClusterId, graph.clusters],
  )

  const refreshDocs = useCallback(async () => {
    try {
      setDocs(await listDocuments())
    } catch (e) {
      toast.error((e as Error).message)
    }
  }, [])

  const refreshGraph = useCallback(async () => {
    try {
      setGraph(await getGraph())
    } catch (e) {
      toast.error((e as Error).message)
    }
  }, [])

  // Initial document load.
  useEffect(() => {
    refreshDocs().finally(() => setLoadingDocs(false))
  }, [refreshDocs])

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
    [refreshDocs],
  )

  // Delete handlers live here because the domain state (docs, graph) and its
  // refetchers do. Children just hand back the ids to remove. A deleted concept
  // collapses the detail panel on its own (selectedNode resolves to null), and a
  // deleted focused cluster is reconciled by the effect above.
  const handleDeleteDocuments = useCallback(
    async (ids: string[]) => {
      try {
        const r = await deleteDocuments(ids)
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
    [refreshDocs, refreshGraph],
  )

  const handleDeleteClusters = useCallback(
    async (ids: string[]) => {
      try {
        const r = await deleteClusters(ids)
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
    [refreshGraph],
  )

  const selectedNode = useMemo(
    () => graph.nodes.find((n) => n.id === selectedId) ?? null,
    [graph.nodes, selectedId],
  )

  return (
    <div className="flex h-screen flex-col">
      <AppTopbar
        email={email}
        workspaceName="Personal"
        onOpenSearch={() => setSearchOpen(true)}
        onToggleSidebar={toggleLeft}
      />

      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel
          id="left"
          panelRef={leftRef}
          defaultSize="260px"
          minSize="200px"
          maxSize="420px"
          collapsible
          collapsedSize="0px"
          groupResizeBehavior="preserve-pixel-size"
          className="min-w-0"
        >
          <NavSidebar
            documents={docs}
            graph={graph}
            onPickFile={handleFile}
            busy={busy}
            loading={loadingDocs}
            workspaceName="Personal"
            onOpenSearch={() => setSearchOpen(true)}
            focusedClusterId={effectiveFocusedClusterId}
            onFocusCluster={onFocusCluster}
            onSelectConcept={setSelectedId}
            onHoverTopic={setHoverTopicId}
            onHoverConcept={setHoverConceptId}
            onDeleteDocuments={handleDeleteDocuments}
            onDeleteClusters={handleDeleteClusters}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel id="center" className="min-w-0">
          <main className="h-full min-w-0">
            <GraphCanvas
              data={graph}
              selectedId={selectedId}
              onSelectId={setSelectedId}
              focusedClusterId={effectiveFocusedClusterId}
              onFocusCluster={onFocusCluster}
              highlightClusterId={hoverTopicId}
              highlightConceptId={hoverConceptId}
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
                onClose={() => setSelectedId(null)}
                onNavigate={setSelectedId}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      <StatusBar graph={graph} documents={docs} />

      <SearchPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        nodes={graph.nodes}
        onPick={setSelectedId}
      />
    </div>
  )
}
