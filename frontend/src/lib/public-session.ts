// Public demo session bootstrap. The demo at "/" has no login, so each visitor
// is identified by an opaque session token minted by the backend
// (`POST /api/public/session`, which also seeds their isolated graph). The token
// is persisted in localStorage and replayed as the `X-Public-Session` header by
// the api client (see lib/api.ts `setPublicSession`). A returning visitor keeps
// their graph until the session is swept server-side; a stale token self-heals on
// the next call (apiClient re-mints on a 401).

import { setPublicSession } from '@/lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000'
const STORAGE_KEY = 'cg_public_session'

/** Mint a fresh demo session (new seeded workspace) and persist its token. */
async function mint(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/public/session`, { method: 'POST' })
  if (!res.ok) throw new Error(`Could not start the demo (status ${res.status})`)
  const data = (await res.json()) as { token: string }
  localStorage.setItem(STORAGE_KEY, data.token)
  return data.token
}

// Re-mint on an expired/swept token: get a new session AND re-register it so the
// api client picks up the new token for subsequent calls. De-duped via a shared
// in-flight promise — a stale token makes the workspace view's parallel mount
// calls (graph + documents) 401 at once, and without this each would mint its own
// workspace, orphaning all but one.
let minting: Promise<string> | null = null
const reMint = (): Promise<string> => {
  if (!minting) {
    minting = mint()
      .then((token) => {
        setPublicSession(token, reMint)
        return token
      })
      .finally(() => {
        minting = null
      })
  }
  return minting
}

/** Ensure a demo session exists and the api client is switched to public mode.
 *  Call once before rendering the public app. A stored-but-stale token is kept
 *  (it self-heals via re-mint on the first failing call) to preserve the
 *  visitor's existing graph whenever possible. */
export async function ensurePublicSession(): Promise<void> {
  let token = localStorage.getItem(STORAGE_KEY)
  if (!token) token = await mint()
  setPublicSession(token, reMint)
}
