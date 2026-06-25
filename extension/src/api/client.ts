// Thin client for the three backend calls the panel needs. Mirrors the web
// app's contract: bearer id token, JSON, FastAPI's {"detail": "..."} surfaced.
import { API_BASE } from '../config'
import { getIdToken } from '../auth/cognito'
import type { ClipMetadata } from '../content/extract'

export interface Workspace {
  id: string
  name: string
  type: 'private' | 'shared'
  icon: string | null
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getIdToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const detail = (await res.json())?.detail
      if (typeof detail === 'string') message = detail
    } catch {
      /* non-JSON body — keep the generic message */
    }
    throw new Error(message)
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

export function listWorkspaces(): Promise<Workspace[]> {
  return api<Workspace[]>('/api/workspaces')
}

export function createWorkspace(name: string): Promise<Workspace> {
  return api<Workspace>('/api/workspaces', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export interface ClipResult {
  document_id: string
  job_id: string | null
  duplicate: boolean // true when the page was already clipped into this workspace
}

/** Send the extracted text into the ingest pipeline. Omit workspace_id to target
 *  the caller's personal workspace (the backend default). */
export function clip(body: {
  title: string
  content: string
  source_url: string
  workspace_id?: string
  metadata?: ClipMetadata
}): Promise<ClipResult> {
  return api<ClipResult>('/api/imports/clip', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
