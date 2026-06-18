import { fetchAuthSession } from 'aws-amplify/auth/server'
import { NextResponse, type NextRequest } from 'next/server'
import { runWithAmplifyServerContext } from './server'

// Routes a logged-out visitor may see. Everything else redirects to /login.
const PUBLIC_PATHS = ['/', '/login', '/signup']

export async function updateSession(request: NextRequest) {
  // The adapter refreshes the Cognito token cookies onto this response.
  const response = NextResponse.next({ request })

  const signedIn = await runWithAmplifyServerContext({
    nextServerContext: { request, response },
    async operation(contextSpec) {
      try {
        const session = await fetchAuthSession(contextSpec)
        return Boolean(session.tokens)
      } catch {
        return false
      }
    },
  })

  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )

  if (!signedIn && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Return the response unchanged so refreshed cookies reach the browser.
  return response
}
