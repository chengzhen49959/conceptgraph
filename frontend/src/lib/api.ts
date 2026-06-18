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
    throw new Error(`API ${res.status}: ${await res.text()}`)
  }
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
  | 'done'
  | 'failed'

export type DocumentOut = {
  id: string
  workspace_id: string
  title: string
  source_type: string
  status: DocumentStatus
  error: string | null
}

export type CreateDocumentResponse = {
  document_id: string
  upload_url: string
  job_id: string | null
}

/** A document is still being processed (worker hasn't reached a terminal state). */
export const isProcessing = (s: DocumentStatus) => s !== 'done' && s !== 'failed'

export function listDocuments(workspaceId?: string) {
  const q = workspaceId ? `?workspace_id=${workspaceId}` : ''
  return apiClient<DocumentOut[]>(`/api/documents${q}`)
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

// --- Concept graph ---------------------------------------------------------

export type GraphNode = {
  id: string
  name: string
  description: string | null
  cluster_id: string | null
  mentions: number
}

export type GraphLink = {
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
