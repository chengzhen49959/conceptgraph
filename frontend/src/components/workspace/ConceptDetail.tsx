'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  FileText,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import {
  type Annotation,
  type ConceptDetail as ConceptData,
  type ConceptPassage,
  type GraphData,
  type GraphNode,
  createEdge,
  deleteConcept,
  deleteEdge,
  getConcept,
  getConceptPassages,
  updateConcept,
} from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ConceptAnnotations } from './ConceptAnnotations'
import { ConceptCombobox } from './ConceptCombobox'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  )
}

const EMPTY_DOCS: ReadonlySet<string> = new Set()
const SNIPPET_BEFORE = 120 // chars kept before the matched term
const SNIPPET_AFTER = 160 // chars kept after it
const FALLBACK_LEN = 240 // head of the chunk shown when no term is found

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** A readable window of `content` around the first occurrence of any term,
 *  with the term itself preserved for highlighting. Chunks are ~512 tokens, so
 *  showing the whole thing would bury the mention; this trims to the sentence
 *  or two around it. Falls back to the head of the chunk when no term matches
 *  (alias morphology, stemming, casing the search missed). */
function snippetAround(content: string, terms: string[]): string {
  const lc = content.toLowerCase()
  let at = -1
  let hitLen = 0
  for (const t of terms) {
    const i = lc.indexOf(t.toLowerCase())
    if (i !== -1 && (at === -1 || i < at)) {
      at = i
      hitLen = t.length
    }
  }
  if (at === -1) {
    return content.length > FALLBACK_LEN ? content.slice(0, FALLBACK_LEN) + '…' : content
  }
  const start = Math.max(0, at - SNIPPET_BEFORE)
  const end = Math.min(content.length, at + hitLen + SNIPPET_AFTER)
  return (
    (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '')
  )
}

/** Renders `text` with every occurrence of any term wrapped in <mark>. Terms
 *  are matched case-insensitively and as plain substrings (no word boundary —
 *  Chinese has none). Longest-first so a term isn't pre-empted by a shorter one
 *  that is its prefix. */
function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  const re = useMemo(() => {
    const valid = terms.filter(Boolean).map(escapeRegExp).sort((a, b) => b.length - a.length)
    return valid.length ? new RegExp(`(${valid.join('|')})`, 'gi') : null
  }, [terms])
  if (!re) return <>{text}</>
  // split on a single capturing group → odd indices are the matched terms.
  return (
    <>
      {text.split(re).map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-sm bg-primary/20 px-0.5 text-foreground">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  )
}

export function ConceptPanel({
  node,
  graph,
  canEdit,
  annotations,
  workspaceId,
  onClose,
  onNavigate,
  onMutated,
  onAnnotationsChanged,
}: {
  node: GraphNode
  graph: GraphData
  canEdit: boolean
  // Annotations targeting this concept (roots + replies).
  annotations: Annotation[]
  workspaceId: string | undefined
  onClose: () => void
  onNavigate: (id: string) => void
  // Refresh the graph after a structural edit (rename / delete / connect).
  onMutated: () => void
  // Refetch the workspace annotation list after a note / highlight / flag change.
  onAnnotationsChanged: () => void
}) {
  // Fetched data is tagged with the concept id it belongs to. The view derives
  // both the current-concept data and its loading flag from that tag, so a
  // concept switch resets to "loading" by comparison alone — no synchronous
  // setState in the effect body (which would cascade renders). setState happens
  // only in the async settle callbacks; `alive` drops a response that lost its
  // race to a newer selection.
  const [detailState, setDetailState] = useState<{
    key: string
    data: ConceptData | null
  } | null>(null)
  useEffect(() => {
    let alive = true
    getConcept(node.id)
      .then((d) => {
        if (alive) setDetailState({ key: node.id, data: d })
      })
      .catch((e) => {
        toast.error((e as Error).message)
        if (alive) setDetailState({ key: node.id, data: null })
      })
    return () => {
      alive = false
    }
  }, [node.id])
  const detail = detailState?.key === node.id ? detailState.data : null
  const loading = detailState?.key !== node.id

  // Source passages load on their own track: the chunk text is large and not
  // always read, so it must not gate the header/stats above. Same keyed shape.
  const [passagesState, setPassagesState] = useState<{
    key: string
    data: ConceptPassage[]
  } | null>(null)
  useEffect(() => {
    let alive = true
    getConceptPassages(node.id)
      .then((d) => {
        if (alive) setPassagesState({ key: node.id, data: d.passages })
      })
      .catch((e) => {
        toast.error((e as Error).message)
        if (alive) setPassagesState({ key: node.id, data: [] })
      })
    return () => {
      alive = false
    }
  }, [node.id])
  const passages = passagesState?.key === node.id ? passagesState.data : null
  const passagesLoading = passagesState?.key !== node.id

  const byDoc = useMemo(() => {
    const groups = new Map<
      string,
      { document_id: string; title: string; items: ConceptPassage[] }
    >()
    for (const p of passages ?? []) {
      let g = groups.get(p.document_id)
      if (!g) {
        g = { document_id: p.document_id, title: p.document_title, items: [] }
        groups.set(p.document_id, g)
      }
      g.items.push(p)
    }
    return [...groups.values()]
  }, [passages])

  // Highlight the concept's own name and every merged alias inside each passage.
  const terms = useMemo(
    () => [node.name, ...(detail?.aliases ?? [])].filter(Boolean),
    [node.name, detail?.aliases],
  )

  // Per-document expand state. Stored keyed on the concept so switching concepts
  // resets to the default without a state-resetting effect: a stale key reads as
  // "no overrides". Default open when the whole list is small; collapsed when a
  // wall of passages would otherwise dominate the panel. Each toggle flips a doc
  // away from that default.
  const [opened, setOpened] = useState<{ key: string; docs: Set<string> }>({
    key: node.id,
    docs: new Set(),
  })
  const overrides = opened.key === node.id ? opened.docs : EMPTY_DOCS
  const defaultOpen = (passages?.length ?? 0) > 0 && passages!.length <= 6
  const isOpen = (docId: string) =>
    overrides.has(docId) ? !defaultOpen : defaultOpen
  const toggleDoc = (docId: string) => {
    setOpened((prev) => {
      const docs = new Set(prev.key === node.id ? prev.docs : [])
      if (docs.has(docId)) docs.delete(docId)
      else docs.add(docId)
      return { key: node.id, docs }
    })
  }

  // Neighbours come from the already-loaded graph, not the API.
  const neighbors = useMemo(() => {
    const byId = new Map(graph.nodes.map((n) => [n.id, n.name]))
    const seen = new Set<string>()
    const out: { id: string; name: string }[] = []
    for (const l of graph.links) {
      const other =
        l.source === node.id ? l.target : l.target === node.id ? l.source : null
      if (other && !seen.has(other)) {
        seen.add(other)
        out.push({ id: other, name: byId.get(other) ?? other })
      }
    }
    return out
  }, [graph, node.id])

  // Each incident edge (with its id), for inline relation editing.
  const incidentEdges = useMemo(() => {
    const byId = new Map(graph.nodes.map((n) => [n.id, n.name]))
    return graph.links
      .filter((l) => l.source === node.id || l.target === node.id)
      .map((l) => {
        const outgoing = l.source === node.id
        const otherId = (outgoing ? l.target : l.source) as string
        return {
          id: l.id,
          otherId,
          otherName: byId.get(otherId) ?? otherId,
          relation: l.relation,
          outgoing,
        }
      })
  }, [graph, node.id])

  // Distinct directly-connected concepts — the count offered by the cascade
  // delete option ("delete this + N connected").
  const neighborCount = useMemo(
    () => new Set(incidentEdges.map((e) => e.otherId)).size,
    [incidentEdges],
  )

  // --- editing state ---------------------------------------------------------
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [newTargetId, setNewTargetId] = useState('')
  const [newRelation, setNewRelation] = useState('')
  const [addingRel, setAddingRel] = useState(false)

  const startEdit = () => {
    setEditName(node.name)
    setEditDesc(node.description ?? '')
    setEditing(true)
  }
  const saveEdit = async () => {
    const n = editName.trim()
    if (!n) return
    setSavingEdit(true)
    try {
      await updateConcept(node.id, { name: n, description: editDesc.trim() || null })
      setEditing(false)
      toast.success('Saved')
      onMutated()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSavingEdit(false)
    }
  }
  const doDelete = async (cascade: boolean) => {
    setDeleting(true)
    try {
      const r = await deleteConcept(node.id, { cascade })
      toast.success(
        r.deleted_concepts > 1
          ? `Deleted ${r.deleted_concepts} concepts`
          : 'Concept deleted',
      )
      onMutated()
      onClose()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setDeleting(false)
      setConfirmDeleteOpen(false)
    }
  }
  const addConnection = async () => {
    if (!newTargetId || !newRelation.trim()) return
    setAddingRel(true)
    try {
      await createEdge({
        source_concept_id: node.id,
        target_concept_id: newTargetId,
        relation: newRelation.trim(),
      })
      setNewRelation('')
      setNewTargetId('')
      toast.success('Connected')
      onMutated()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setAddingRel(false)
    }
  }
  const removeEdge = async (edgeId: string) => {
    try {
      await deleteEdge(edgeId)
      toast.success('Relation removed')
      onMutated()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className="flex items-start justify-between gap-2 border-b p-4">
        {editing ? (
          <div className="flex-1 space-y-2">
            <Input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Name"
            />
            <Input
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Description (optional)"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={saveEdit}
                disabled={savingEdit || !editName.trim()}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
                disabled={savingEdit}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold">{node.name}</h2>
              {detail?.cluster_label && (
                <Badge variant="secondary" className="mt-1 font-normal">
                  {detail.cluster_label}
                </Badge>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {canEdit && (
                <button
                  onClick={startEdit}
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Edit concept"
                >
                  <Pencil className="size-4" />
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Delete concept"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
          </>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 p-4">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="mentions" value={detail?.mentions ?? node.mentions} />
            <Stat label="connections" value={detail?.degree ?? neighbors.length} />
            <Stat label="documents" value={detail?.documents.length ?? 0} />
          </div>

          <Separator />

          {node.description && (
            <Section title="Description">
              <p className="text-sm leading-relaxed text-foreground/90">
                {node.description}
              </p>
            </Section>
          )}

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <>
              {detail && detail.aliases.length > 0 && (
                <Section title={`Aliases (${detail.aliases.length})`}>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.aliases.map((a) => (
                      <Badge key={a} variant="outline" className="font-normal">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}

          {passagesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            byDoc.length > 0 && (
              <Section title="Sources">
                <ul className="space-y-1.5">
                  {byDoc.map((g) => {
                    const open = isOpen(g.document_id)
                    return (
                      <li
                        key={g.document_id}
                        className="overflow-hidden rounded-md border"
                      >
                        <button
                          onClick={() => toggleDoc(g.document_id)}
                          aria-expanded={open}
                          className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm hover:bg-accent"
                        >
                          <ChevronRight
                            className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${
                              open ? 'rotate-90' : ''
                            }`}
                          />
                          <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate" title={g.title}>
                            {g.title}
                          </span>
                          <Badge
                            variant="secondary"
                            className="shrink-0 font-normal tabular-nums"
                          >
                            {g.items.length}
                          </Badge>
                        </button>
                        {open && (
                          <div className="space-y-2 border-t bg-muted/30 px-2.5 py-2">
                            {g.items.map((p) => (
                              <p
                                key={p.chunk_id}
                                className="text-xs leading-relaxed text-foreground/80"
                              >
                                <Highlighted
                                  text={snippetAround(p.content, terms)}
                                  terms={terms}
                                />
                              </p>
                            ))}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </Section>
            )
          )}

          {canEdit ? (
            <Section title={`Relations (${incidentEdges.length})`}>
              <ul className="space-y-1">
                {incidentEdges.map((e) => (
                  <li
                    key={e.id}
                    className="group/edge flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs"
                  >
                    {e.outgoing ? (
                      <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                    ) : (
                      <ArrowLeft className="size-3 shrink-0 text-muted-foreground" />
                    )}
                    <span className="shrink-0 text-muted-foreground">
                      {e.relation}
                    </span>
                    <button
                      onClick={() => onNavigate(e.otherId)}
                      className="min-w-0 flex-1 truncate text-left hover:underline"
                      title={e.otherName}
                    >
                      {e.otherName}
                    </button>
                    <button
                      onClick={() => removeEdge(e.id)}
                      aria-label="Remove relation"
                      className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/edge:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-2 flex items-center gap-1.5">
                <ConceptCombobox
                  concepts={graph.nodes.filter((n) => n.id !== node.id)}
                  value={newTargetId}
                  onChange={setNewTargetId}
                  placeholder="Connect to…"
                />
                <Input
                  value={newRelation}
                  onChange={(e) => setNewRelation(e.target.value)}
                  placeholder="relation"
                  className="h-8 w-28 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addConnection()
                  }}
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="size-8 shrink-0"
                  onClick={addConnection}
                  disabled={addingRel || !newTargetId || !newRelation.trim()}
                  aria-label="Add connection"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </Section>
          ) : (
            neighbors.length > 0 && (
              <Section title={`Connected concepts (${neighbors.length})`}>
                <div className="flex flex-wrap gap-1.5">
                  {neighbors.map((nb) => (
                    <button
                      key={nb.id}
                      onClick={() => onNavigate(nb.id)}
                      className="rounded-md border px-2 py-1 text-xs transition-colors hover:bg-accent"
                    >
                      {nb.name}
                    </button>
                  ))}
                </div>
              </Section>
            )
          )}

          <Separator />

          <ConceptAnnotations
            conceptId={node.id}
            workspaceId={workspaceId}
            canFlag={canEdit}
            annotations={annotations}
            onChanged={onAnnotationsChanged}
          />
        </div>
      </ScrollArea>

      <Dialog
        open={confirmDeleteOpen}
        onOpenChange={(o) => !deleting && setConfirmDeleteOpen(o)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete &quot;{node.name}&quot;?</DialogTitle>
            <DialogDescription>
              Choose what to remove. Source citations stay with their documents,
              and you can undo this from the activity feed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <button
              disabled={deleting}
              onClick={() => doDelete(false)}
              className="w-full rounded-md border p-3 text-left transition-colors hover:bg-accent disabled:opacity-50"
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <Trash2 className="size-4" /> Delete this node only
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Removes this concept and its connections. Connected concepts stay.
              </p>
            </button>

            {neighborCount > 0 && (
              <button
                disabled={deleting}
                onClick={() => doDelete(true)}
                className="w-full rounded-md border border-destructive/40 p-3 text-left text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Trash2 className="size-4" /> Delete this + {neighborCount}{' '}
                  connected
                </div>
                <p className="mt-0.5 text-xs text-destructive/80">
                  Also removes the {neighborCount} directly-connected concept
                  {neighborCount > 1 ? 's' : ''}.
                </p>
              </button>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
