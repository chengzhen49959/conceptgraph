import { cookies } from 'next/headers'
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth/server'
import { runWithAmplifyServerContext } from './server'

// Server-only helpers that read the Cognito session from the request cookies.
// Use these in Server Components and Route Handlers (NOT the proxy, which has a
// request/response context instead of cookies).

/** The signed-in user, or null when the request has no valid session. */
export async function getServerUser() {
  try {
    return await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => getCurrentUser(contextSpec),
    })
  } catch {
    return null
  }
}

/** The Cognito id token to forward to the backend, or undefined if signed out. */
export async function getServerIdToken(): Promise<string | undefined> {
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    })
    return session.tokens?.idToken?.toString()
  } catch {
    return undefined
  }
}
