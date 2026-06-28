import { fetchAuthSession } from 'aws-amplify/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000'

/** Shared fetch wrapper. Attaches the bearer token and parses JSON. */
export async function request<T>(
  path: string,
  accessToken: string | undefined,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    // Surface FastAPI's `{"detail": "..."}` message directly so toasts read
    // cleanly (e.g. the image-rejection 415); fall back to the raw body.
    const raw = await res.text()
    let message = raw
    try {
      const detail = JSON.parse(raw)?.detail
      if (typeof detail === 'string') message = detail
    } catch {
      // not JSON — keep the raw text
    }
    throw new Error(message || `API ${res.status}`)
  }
  // 204 No Content (e.g. DELETE) has no body — don't try to parse it.
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

/** Call FastAPI from a Client Component (id token from the browser session). */
export async function apiClient<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await fetchAuthSession()
  const token = session.tokens?.idToken?.toString()
  return request<T>(path, token, init)
}

export type Me = { id: string; email: string | null }
export type Health = { status: string }

// --- Documents -------------------------------------------------------------

export type DocumentStatus =
  | 'pending'
  | 'parsing'
  | 'chunking'
  | 'embedding'
  | 'extracting'
  | 'merging'
  | 'clustering'
  | 'done'
  | 'failed'
  // Skipped because the workspace already holds this paper (same bytes, or near-
  // identical text); see `duplicate_of`. Terminal — contributes nothing to the graph.
  | 'duplicate'

/** Human label for each ingest stage, shown in the documents list + status bar. */
export const DOC_STATUS_LABEL: Record<DocumentStatus, string> = {
  pending: 'Queued',
  parsing: 'Parsing',
  chunking: 'Chunking',
  embedding: 'Embedding',
  extracting: 'Extracting concepts',
  merging: 'Merging',
  clustering: 'Clustering',
  done: 'Ready',
  failed: 'Failed',
  duplicate: 'Duplicate',
}

export type DocumentOut = {
  id: string
  workspace_id: string
  title: string
  source_type: string
  status: DocumentStatus
  error: string | null
  // The original this document duplicates (set when status is 'duplicate'), else null.
  duplicate_of?: string | null
  // The web origin a clipped document came from; null for a file upload. The
  // source view branches on it: a clip links to this page, an upload to its file.
  source_url?: string | null
  // Merge-phase progress (concepts resolved / total). Both null/absent outside the
  // merging stage; the UI renders a live count + rough ETA while they're set.
  progress_current?: number | null
  progress_total?: number | null
}

export type CreateDocumentResponse = {
  document_id: string
  upload_url: string
}

/** A document is still being processed (worker hasn't reached a terminal state). */
export const isProcessing = (s: DocumentStatus) =>
  s !== 'done' && s !== 'failed' && s !== 'duplicate'

export function listDocuments(workspaceId?: string) {
  const q = workspaceId ? `?workspace_id=${workspaceId}` : ''
  return apiClient<DocumentOut[]>(`/api/documents${q}`)
}

export type WorkerHealth = { online: boolean }

/** Is the ingestion (arq) worker alive? Drives the "worker offline" warning so a
 *  clip stuck at "Queued" has a visible cause instead of an endless spinner. */
export function getWorkerHealth() {
  return apiClient<WorkerHealth>('/api/health/worker')
}

export function createDocument(body: {
  filename: string
  content_type: string
  title?: string
  workspace_id?: string
}) {
  return apiClient<CreateDocumentResponse>('/api/documents', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** Enqueue ingestion — call only AFTER `uploadToS3` resolves. Enqueue is split
 *  out of `createDocument` so the worker never reads the S3 object before the
 *  browser's PUT lands it (a `NoSuchKey` race). Idempotent server-side. */
export function startIngest(documentId: string) {
  return apiClient<{ job_id: string | null }>(
    `/api/documents/${documentId}/ingest`,
    { method: 'POST' },
  )
}

/** Content type derived from the filename — `File.type` is empty for `.md`, and
 *  it must match the value the backend signed the presigned PUT with. */
export function contentTypeFor(filename: string): string {
  const n = filename.toLowerCase()
  if (n.endsWith('.pdf')) return 'application/pdf'
  if (n.endsWith('.md') || n.endsWith('.markdown')) return 'text/markdown'
  return 'text/plain'
}

/** Upload raw bytes straight to S3 via the presigned URL — bypasses the JSON
 *  api client (no auth header, no JSON body). The URL is self-authorizing. */
export async function uploadToS3(url: string, file: File, contentType: string) {
  const res = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': contentType },
  })
  if (!res.ok) throw new Error(`S3 upload ${res.status}: ${await res.text()}`)
}

/** A short-lived presigned URL to a file upload's original source in S3. With
 *  `download`, the URL forces a local save (Content-Disposition: attachment);
 *  otherwise it opens inline (e.g. a PDF in the browser viewer). 409s for a web
 *  clip — it has no uploaded file, so open its `source_url` instead. */
export function getDocumentDownloadUrl(id: string, opts?: { download?: boolean }) {
  const q = opts?.download ? '?download=1' : ''
  return apiClient<{ url: string }>(`/api/documents/${id}/download${q}`).then(
    (r) => r.url,
  )
}

// --- Concept graph ---------------------------------------------------------

export type GraphNode = {
  id: string
  name: string
  description: string | null
  cluster_id: string | null
  mentions: number
}

export type GraphLink = {
  id: string // edge id — addressable for edit/delete
  source: string
  target: string
  relation: string
  weight: number
}

export type GraphCluster = { id: string; label: string | null }

export type GraphData = {
  nodes: GraphNode[]
  links: GraphLink[]
  clusters: GraphCluster[]
}

export function getGraph(workspaceId?: string) {
  const q = workspaceId ? `?workspace_id=${workspaceId}` : ''
  return apiClient<GraphData>(`/api/graph${q}`)
}

export type ConceptDocument = { document_id: string; title: string }

export type ConceptDetail = {
  id: string
  name: string
  description: string | null
  cluster_label: string | null
  aliases: string[]
  documents: ConceptDocument[]
  mentions: number
  degree: number
}

export function getConcept(id: string) {
  return apiClient<ConceptDetail>(`/api/concepts/${id}`)
}

/** One source passage: the chunk text a concept was mentioned in, plus its doc. */
export type ConceptPassage = {
  document_id: string
  document_title: string
  chunk_id: string
  content: string
}

export type ConceptPassages = { passages: ConceptPassage[] }

/** Source passages backing a concept — chunk text + document, for the evidence
 *  view. Flat list ordered by document; the client groups it. */
export function getConceptPassages(id: string) {
  return apiClient<ConceptPassages>(`/api/concepts/${id}/passages`)
}

// --- Semantic search (F7) --------------------------------------------------

/** A concept hit — same shape the graph nodes carry, plus a similarity score,
 *  so a result drops straight into the graph's select-node path. */
export type SearchConcept = {
  id: string
  name: string
  description: string | null
  cluster_id: string | null
  mentions: number
  score: number // cosine similarity 0..1
}

/** A source-passage hit. Not a graph node, so it carries the concept ids it
 *  mentions; the client routes a click to the most prominent of them. */
export type SearchPassage = {
  chunk_id: string
  document_id: string
  document_title: string
  snippet: string
  score: number
  concept_ids: string[]
}

export type SearchResults = {
  concepts: SearchConcept[]
  passages: SearchPassage[]
}

/** Embed `q` and return nearest concepts + passages in the workspace. The
 *  palette pairs this with its instant client-side substring match. */
export function search(q: string, workspaceId?: string, limit = 10) {
  const params = new URLSearchParams({ q, limit: String(limit) })
  if (workspaceId) params.set('workspace_id', workspaceId)
  return apiClient<SearchResults>(`/api/search?${params.toString()}`)
}

// --- RAG Q&A (F8) ----------------------------------------------------------

/** One retrieved passage backing an answer. `n` is its 1-based citation index —
 *  the answer cites it as `[n]`. `concept_ids` are the graph concepts it mentions,
 *  the ids that light up when this passage is cited. */
export type AskPassage = {
  n: number
  chunk_id: string
  document_id: string
  document_title: string
  snippet: string
  concept_ids: string[]
}

/** Evidence + an id→name map for the concepts the answer may cite, sent once
 *  before the answer streams. */
export type AskContext = {
  passages: AskPassage[]
  concepts: { id: string; name: string }[]
}

/** Streaming callbacks. `onDone` carries the authoritative highlight set — the
 *  union of concept ids from the passages the answer actually cited. */
export type AskHandlers = {
  onContext?: (ctx: AskContext) => void
  onDelta?: (text: string) => void
  onDone?: (citedConceptIds: string[]) => void
  onError?: (detail: string) => void
}

/** Ask the library a question and stream the cited answer. Posts to the same-origin
 *  `/api/ask` Route Handler (which attaches the Cognito bearer server-side and relays
 *  the backend SSE), then parses the event stream and fans each frame out to the
 *  handlers. Resolves when the stream ends; rejects on a pre-stream error (the route
 *  handler returns JSON `{detail}` for 401/403/422/503). Pass `signal` to abort an
 *  in-flight answer (e.g. the user asks again or closes the palette). */
export async function askStream(
  q: string,
  workspaceId: string | undefined,
  handlers: AskHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, workspace_id: workspaceId }),
    signal,
  })
  if (!res.ok || !res.body) {
    const raw = await res.text()
    let message = raw
    try {
      const detail = JSON.parse(raw)?.detail
      if (typeof detail === 'string') message = detail
    } catch {
      // not JSON — keep the raw text
    }
    throw new Error(message || `ask ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  // SSE frames are separated by a blank line; each frame has an `event:` line and
  // one or more `data:` lines. Our payloads are single-line JSON, but join multi-
  // line data defensively.
  const dispatch = (frame: string) => {
    let event = 'message'
    const data: string[] = []
    for (const line of frame.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim()
      else if (line.startsWith('data:')) data.push(line.slice(5).trimStart())
    }
    if (!data.length) return
    let payload: unknown
    try {
      payload = JSON.parse(data.join('\n'))
    } catch {
      return // a malformed frame is dropped, not fatal
    }
    const p = payload as Record<string, unknown>
    if (event === 'context') handlers.onContext?.(payload as AskContext)
    else if (event === 'delta') handlers.onDelta?.(String(p.text ?? ''))
    else if (event === 'done')
      handlers.onDone?.((p.cited_concept_ids as string[]) ?? [])
    else if (event === 'error') handlers.onError?.(String(p.detail ?? 'error'))
  }

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let sep: number
    while ((sep = buf.indexOf('\n\n')) !== -1) {
      const frame = buf.slice(0, sep)
      buf = buf.slice(sep + 2)
      if (frame.trim()) dispatch(frame)
    }
  }
  // Flush a trailing frame with no terminating blank line (stream closed cleanly).
  if (buf.trim()) dispatch(buf)
}

// --- Conversational agent (in-product chat) --------------------------------

/** A saved conversation between the user and the research agent. */
export type ChatConversation = {
  id: string
  workspace_id: string
  title: string | null
  created_at: string
  updated_at: string
}

/** One step in the agent's tool trace, shown as an activity line. */
export type ChatToolEvent = { name: string; status: 'started' | 'finished' }

/** A persisted message. The assistant turn carries its tool trace + the concept
 *  ids it cited (for re-highlighting the graph when the conversation is reopened). */
export type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls: ChatToolEvent[] | null
  cited_concept_ids: string[] | null
  created_at: string
}

export type ConversationDetail = {
  conversation: ChatConversation
  messages: ChatMessage[]
}

export function createConversation(workspaceId?: string) {
  return apiClient<ChatConversation>('/api/chat/conversations', {
    method: 'POST',
    body: JSON.stringify({ workspace_id: workspaceId }),
  })
}

export function listConversations(workspaceId?: string) {
  const q = workspaceId ? `?workspace_id=${workspaceId}` : ''
  return apiClient<ChatConversation[]>(`/api/chat/conversations${q}`)
}

export function getConversation(id: string) {
  return apiClient<ConversationDetail>(`/api/chat/conversations/${id}`)
}

/** Streaming callbacks for one agent turn. `onSources` repeats as the agent gathers
 *  evidence; `onDone` carries the authoritative cited-concept highlight set. */
export type ChatHandlers = {
  onTool?: (ev: ChatToolEvent) => void
  onSources?: (passages: AskPassage[]) => void
  onDelta?: (text: string) => void
  onDone?: (citedConceptIds: string[], messageId: string | null) => void
  onError?: (detail: string) => void
}

/** Send a message and stream the agent's multi-step answer. Posts to the same-origin
 *  `/api/chat` Route Handler (attaches the bearer server-side and relays the backend
 *  SSE), then fans each frame out to the handlers. Mirrors {@link askStream}; the
 *  conversation must already exist (see {@link createConversation}). */
export async function chatStream(
  conversationId: string,
  content: string,
  handlers: ChatHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id: conversationId, content }),
    signal,
  })
  if (!res.ok || !res.body) {
    const raw = await res.text()
    let message = raw
    try {
      const detail = JSON.parse(raw)?.detail
      if (typeof detail === 'string') message = detail
    } catch {
      // not JSON — keep the raw text
    }
    throw new Error(message || `chat ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  const dispatch = (frame: string) => {
    let event = 'message'
    const data: string[] = []
    for (const line of frame.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim()
      else if (line.startsWith('data:')) data.push(line.slice(5).trimStart())
    }
    if (!data.length) return
    let payload: unknown
    try {
      payload = JSON.parse(data.join('\n'))
    } catch {
      return
    }
    const p = payload as Record<string, unknown>
    if (event === 'tool') handlers.onTool?.(payload as ChatToolEvent)
    else if (event === 'sources')
      handlers.onSources?.((p.passages as AskPassage[]) ?? [])
    else if (event === 'delta') handlers.onDelta?.(String(p.text ?? ''))
    else if (event === 'done')
      handlers.onDone?.(
        (p.cited_concept_ids as string[]) ?? [],
        (p.message_id as string | null) ?? null,
      )
    else if (event === 'error') handlers.onError?.(String(p.detail ?? 'error'))
  }

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let sep: number
    while ((sep = buf.indexOf('\n\n')) !== -1) {
      const frame = buf.slice(0, sep)
      buf = buf.slice(sep + 2)
      if (frame.trim()) dispatch(frame)
    }
  }
  if (buf.trim()) dispatch(buf)
}

// --- Deletes ---------------------------------------------------------------

/** Counts returned by a batch delete (fields present depend on the endpoint). */
export type DeleteSummary = {
  deleted_documents?: number
  deleted_clusters?: number
  deleted_concepts: number
}

/** Delete documents and GC concepts only they supported. `ids` may be a single id. */
export function deleteDocuments(ids: string[], workspaceId?: string) {
  return apiClient<DeleteSummary>('/api/documents/delete', {
    method: 'POST',
    body: JSON.stringify({ ids, workspace_id: workspaceId }),
  })
}

/** Delete clusters and every concept they contained. `ids` may be a single id. */
export function deleteClusters(ids: string[], workspaceId?: string) {
  return apiClient<DeleteSummary>('/api/clusters/delete', {
    method: 'POST',
    body: JSON.stringify({ ids, workspace_id: workspaceId }),
  })
}

// --- Workspaces ------------------------------------------------------------

export type WorkspaceRole = 'owner' | 'editor' | 'commenter' | 'viewer'

/** A workspace as the dashboard / switcher sees it. Stats are null unless the
 *  list was requested with `withStats`. */
export type WorkspaceCard = {
  id: string
  name: string // display name (never null — defaulted server-side)
  type: 'private' | 'shared'
  role: WorkspaceRole
  icon: string | null // IconPark icon name, e.g. "Microscope"
  icon_color: string | null // accent hex, e.g. "#2F88FF"
  concept_count: number | null
  document_count: number | null
  last_activity: string | null
}

export function listWorkspaces(withStats = false) {
  return apiClient<WorkspaceCard[]>(
    `/api/workspaces${withStats ? '?with_stats=1' : ''}`,
  )
}

export function createWorkspace(name: string, icon?: string | null) {
  return apiClient<WorkspaceCard>('/api/workspaces', {
    method: 'POST',
    body: JSON.stringify({ name, icon }),
  })
}

/** Partial update — only the keys present are changed (rename and/or re-icon). */
export function updateWorkspace(
  id: string,
  patch: { name?: string; icon?: string },
) {
  return apiClient<WorkspaceCard>(`/api/workspaces/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export function deleteWorkspace(id: string) {
  return apiClient<void>(`/api/workspaces/${id}`, { method: 'DELETE' })
}

// --- Sharing & members -----------------------------------------------------

export type InviteRole = 'editor' | 'commenter' | 'viewer'

/** Preview shown on the accept page for a share-link token. */
export type InvitePreview = {
  workspace_name: string
  role: string
  status: string // enabled | disabled
}

/** The workspace's reusable share link (Notion "Copy link"). */
export type ShareLink = {
  enabled: boolean
  role: InviteRole
  token: string
  accept_url: string
}

export type WorkspaceMemberRow = { user_id: string; role: string; is_you: boolean }
export type Members = {
  members: WorkspaceMemberRow[]
}

export function listMembers(workspaceId: string) {
  return apiClient<Members>(`/api/workspaces/${workspaceId}/members`)
}

/** Join a workspace via its reusable share link (no email match). */
export function acceptShareLink(token: string) {
  return apiClient<{ workspace_id: string }>(`/api/share/${token}/accept`, {
    method: 'POST',
  })
}

/** The workspace's reusable share link (owner only); lazily created server-side. */
export function getShareLink(workspaceId: string) {
  return apiClient<ShareLink>(`/api/workspaces/${workspaceId}/share-link`)
}

/** Enable/disable the share link or change the role it grants (owner only). */
export function updateShareLink(
  workspaceId: string,
  patch: { enabled?: boolean; role?: InviteRole },
) {
  return apiClient<ShareLink>(`/api/workspaces/${workspaceId}/share-link`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

// --- Graph editing (M2) ----------------------------------------------------

export type ManualConcept = {
  id: string
  name: string
  description: string | null
  cluster_id: string | null
  origin: string
}

export type ManualEdge = {
  id: string
  source_concept_id: string
  target_concept_id: string
  relation: string
  weight: number
}

export function createConcept(body: {
  workspace_id?: string
  name: string
  description?: string | null
}) {
  return apiClient<ManualConcept>('/api/graph/concepts', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateConcept(
  id: string,
  body: { name?: string; description?: string | null },
) {
  return apiClient<ManualConcept>(`/api/graph/concepts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deleteConcept(id: string, opts?: { cascade?: boolean }) {
  const qs = opts?.cascade ? '?cascade=true' : ''
  return apiClient<{ ok: boolean; deleted_concepts: number }>(
    `/api/graph/concepts/${id}${qs}`,
    { method: 'DELETE' },
  )
}

export function createEdge(body: {
  source_concept_id: string
  target_concept_id: string
  relation: string
}) {
  return apiClient<ManualEdge>('/api/graph/edges', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateEdge(id: string, body: { relation?: string; weight?: number }) {
  return apiClient<ManualEdge>(`/api/graph/edges/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deleteEdge(id: string) {
  return apiClient<{ ok: boolean }>(`/api/graph/edges/${id}`, { method: 'DELETE' })
}

// --- Change history / audit (M2) -------------------------------------------

export type AuditEntry = {
  id: string
  actor_id: string
  actor_role: string
  actor_is_you: boolean
  action: string
  entity_type: 'concept' | 'edge'
  entity_id: string
  summary: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  source: string
  undone: boolean
  can_undo: boolean
  created_at: string
}

export function getAudit(workspaceId: string, limit = 50) {
  return apiClient<AuditEntry[]>(
    `/api/graph/audit?workspace_id=${workspaceId}&limit=${limit}`,
  )
}

export function undoAudit(id: string) {
  return apiClient<AuditEntry>(`/api/graph/audit/${id}/undo`, { method: 'POST' })
}

// --- Unified activity feed: graph edits + annotations in one timeline ------

/** One row in the Activity panel. Graph edits carry `audit_id` (→ undo); both
 *  graph-concept and annotation events carry `target_concept_id` (→ jump to it). */
export type ActivityEvent = {
  id: string
  source_type: 'graph' | 'annotation'
  action: string
  summary: string
  actor_id: string | null
  actor_role: string | null
  actor_is_you: boolean
  target_concept_id: string | null
  audit_id: string | null
  can_undo: boolean
  undone: boolean
  created_at: string
}

export type ActivityScope = 'all' | 'mine' | 'others'
/** Coarse type filter; matches the backend's `_event_type`. */
export type ActivityType = 'edit' | 'highlight' | 'flag' | 'comment'

export function getActivity(
  workspaceId: string,
  opts: {
    scope?: ActivityScope
    types?: ActivityType[]
    before?: string
    limit?: number
  } = {},
) {
  const q = new URLSearchParams({ workspace_id: workspaceId })
  if (opts.scope && opts.scope !== 'all') q.set('scope', opts.scope)
  if (opts.types?.length) q.set('types', opts.types.join(','))
  if (opts.before) q.set('before', opts.before)
  q.set('limit', String(opts.limit ?? 50))
  return apiClient<ActivityEvent[]>(`/api/activity?${q.toString()}`)
}

export function getActivityUnread(workspaceId: string) {
  return apiClient<{ count: number }>(
    `/api/activity/unread_count?workspace_id=${workspaceId}`,
  )
}

export function markActivitySeen(workspaceId: string) {
  return apiClient<{ ok: boolean }>(
    `/api/activity/seen?workspace_id=${workspaceId}`,
    { method: 'POST' },
  )
}

// --- Annotations (M3) ------------------------------------------------------

export type AnnotationKind = 'highlight' | 'flag' | 'comment'

export type Annotation = {
  id: string
  workspace_id: string
  author_id: string
  author_is_you: boolean
  target_type: 'concept' | 'edge' | 'cluster'
  target_concept_id: string | null
  target_edge_id: string | null
  target_cluster_label: string | null
  kind: AnnotationKind
  body: string | null
  status: 'open' | 'resolved'
  parent_id: string | null
  created_at: string
  updated_at: string
}

export function listAnnotations(workspaceId: string, status?: 'open' | 'resolved') {
  const q = new URLSearchParams({ workspace_id: workspaceId })
  if (status) q.set('status', status)
  return apiClient<Annotation[]>(`/api/annotations?${q.toString()}`)
}

export function getConceptAnnotations(conceptId: string) {
  return apiClient<Annotation[]>(`/api/annotations/concept/${conceptId}`)
}

export function createAnnotation(body: {
  workspace_id?: string
  target_type?: 'concept' | 'edge' | 'cluster'
  target_concept_id?: string
  target_edge_id?: string
  target_cluster_label?: string
  kind?: AnnotationKind
  body?: string | null
  parent_id?: string
}) {
  return apiClient<Annotation>('/api/annotations', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function resolveAnnotation(id: string) {
  return apiClient<Annotation>(`/api/annotations/${id}/resolve`, { method: 'POST' })
}

export function reopenAnnotation(id: string) {
  return apiClient<Annotation>(`/api/annotations/${id}/reopen`, { method: 'POST' })
}

export function deleteAnnotation(id: string) {
  return apiClient<void>(`/api/annotations/${id}`, { method: 'DELETE' })
}
