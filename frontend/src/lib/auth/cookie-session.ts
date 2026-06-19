// Reads the Cognito session straight from the auth cookies.
//
// Why not the Amplify SSR adapter (`fetchAuthSession`/`getCurrentUser` from
// `aws-amplify/auth/server`)? In this Next build it cannot reconstruct the
// session from the cookies the browser client writes on sign-in — it returns
// empty tokens even when every Cognito cookie is present on the request, which
// silently bounced every signed-in user back to /login.
//
// This is safe because the cookie is NOT the security boundary: the FastAPI
// backend verifies the id token's signature, issuer, audience, and expiry on
// every API call (backend/app/cognito.py `verify_token`). These helpers are a
// routing/identity convenience that decides what to render, not what to trust.

// Amplify stores the id token under
// `CognitoIdentityServiceProvider.<clientId>.<sub>.idToken`.
const ID_TOKEN_COOKIE = /^CognitoIdentityServiceProvider\..+\.idToken$/

export interface IdClaims {
  /** Cognito user id (subject). */
  sub: string
  email?: string
  /** Expiry, seconds since the epoch. */
  exp: number
}

/** The id-token JWT from a cookie list, or undefined when signed out. */
export function pickIdToken(
  cookies: ReadonlyArray<{ name: string; value: string }>,
): string | undefined {
  return cookies.find((c) => ID_TOKEN_COOKIE.test(c.name))?.value
}

/**
 * Decode — NOT verify — a JWT payload. Returns null on malformed input. The
 * backend is responsible for verification; this only reads display/routing
 * claims. Node runtime only (uses Buffer); do not call from the Edge proxy.
 */
export function decodeIdToken(token: string): IdClaims | null {
  try {
    const json = Buffer.from(token.split('.')[1], 'base64url').toString('utf8')
    const claims = JSON.parse(json)
    if (typeof claims.sub !== 'string' || typeof claims.exp !== 'number') {
      return null
    }
    return claims
  } catch {
    return null
  }
}
