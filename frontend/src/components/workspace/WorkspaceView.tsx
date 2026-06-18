'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  type DocumentOut,
  type GraphData,
  contentTypeFor,
  createDocument,
  getGraph,
  isProcessing,
  listDocuments,
  uploadToS3,
} from '@/lib/api'
import { AppTopbar } from './AppTopbar'
import { Sidebar } from './Sidebar'
import { GraphCanvas } from './GraphCanvas'
import { ConceptPanel } from './ConceptDetail'
import { SearchPalette } from './SearchPalette'

const EMPTY: GraphData = { nodes: [], links: [], clusters: [] }

export function WorkspaceView({ email }: { email: string | null }) {
  const [docs, setDocs] = useState<DocumentOut[]>([])
  const [graph, setGraph] = useState<GraphData>(EMPTY)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)

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
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          documents={docs}
          onPickFile={handleFile}
          busy={busy}
          loading={loadingDocs}
        />

        <main className="min-w-0 flex-1 bg-muted/30 p-3">
          <div className="h-full w-full overflow-hidden rounded-lg border shadow-sm">
            <GraphCanvas
              data={graph}
              selectedId={selectedId}
              onSelectId={setSelectedId}
            />
          </div>
        </main>

        {selectedNode && (
          <ConceptPanel
            node={selectedNode}
            graph={graph}
            onClose={() => setSelectedId(null)}
            onNavigate={setSelectedId}
          />
        )}
      </div>

      <SearchPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        nodes={graph.nodes}
        onPick={setSelectedId}
      />
    </div>
  )
}
