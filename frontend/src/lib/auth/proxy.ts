import { NextResponse, type NextRequest } from 'next/server'
import { pickIdToken } from './cookie-session'

// Routes a logged-out visitor may see. Everything else redirects to /login.
// `/invite/<token>` is public so an invitee can preview the invitation before
// logging in; accepting it still requires auth (enforced by the backend).
const PUBLIC_PATHS = ['/', '/login', '/signup', '/invite']

// Cheap routing gate: is an id-token cookie present? Token validity (signature,
// expiry) is enforced by the backend on every API call and re-checked by
// `getServerUser` before a protected page renders — see `./cookie-session`.
export function updateSession(request: NextRequest) {
  const signedIn = pickIdToken(request.cookies.getAll()) !== undefined

  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )

  if (!signedIn && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next({ request })
}
