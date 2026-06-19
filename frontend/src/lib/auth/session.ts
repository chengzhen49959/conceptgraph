import { cookies } from 'next/headers'
import { decodeIdToken, pickIdToken } from './cookie-session'

// Server-only helpers that read the Cognito session from the request cookies.
// Use these in Server Components and Route Handlers. The backend verifies the
// token on every API call, so these decide what to render, not what to trust
// (see `./cookie-session`).

/** The signed-in user, or null when the request has no live session. */
export async function getServerUser() {
  const token = await getServerIdToken()
  if (!token) return null

  const claims = decodeIdToken(token)
  // Expired or unparseable token: treat as signed out so the page redirects.
  if (!claims || claims.exp * 1000 <= Date.now()) return null

  return { userId: claims.sub, email: claims.email ?? null }
}

/** The Cognito id token to forward to the backend, or undefined if signed out. */
export async function getServerIdToken(): Promise<string | undefined> {
  const store = await cookies()
  return pickIdToken(store.getAll())
}
