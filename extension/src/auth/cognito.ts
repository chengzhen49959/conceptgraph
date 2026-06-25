// Reuse the web app's Cognito session instead of a second login. Amplify writes
// the tokens as cookies on the app origin; we read the id token there and, when
// it's near expiry, mint a fresh one with the refresh token (Cognito's public
// InitiateAuth REFRESH_TOKEN_AUTH — no client secret). The backend verifies the
// id token's signature/issuer/audience/expiry on every call, so the cookie is a
// convenience, not the trust boundary.
import {
  APP_ORIGIN,
  COGNITO_CLIENT_ID,
  COGNITO_REGION,
} from '../config'

export class NotLoggedInError extends Error {
  constructor() {
    super('Not signed in to the web app')
    this.name = 'NotLoggedInError'
  }
}

// Amplify keys: CognitoIdentityServiceProvider.<clientId>.<sub>.<idToken|refreshToken>
const ID_TOKEN = /^CognitoIdentityServiceProvider\..+\.idToken$/
const REFRESH_TOKEN = /^CognitoIdentityServiceProvider\..+\.refreshToken$/

// Match cookies by DOMAIN, not by url. Amplify marks its session cookies
// `Secure` (even on localhost), and a `getAll({url: "http://…"})` filter hides
// Secure cookies on an http origin — which is exactly the localhost dev case.
// Domain matching returns them regardless of scheme/Secure.
const APP_HOST = (() => {
  try {
    return new URL(APP_ORIGIN).hostname
  } catch {
    return 'localhost'
  }
})()

async function cookieMatching(re: RegExp): Promise<string | undefined> {
  const cookies = await chrome.cookies.getAll({ domain: APP_HOST })
  return cookies.find((c) => re.test(c.name))?.value
}

function expiry(token: string): number | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const exp = JSON.parse(atob(payload))?.exp
    return typeof exp === 'number' ? exp : null
  } catch {
    return null
  }
}

async function refresh(): Promise<string> {
  const refreshToken = await cookieMatching(REFRESH_TOKEN)
  if (!refreshToken) throw new NotLoggedInError()
  const res = await fetch(`https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
    },
    body: JSON.stringify({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    }),
  })
  const idToken = res.ok ? (await res.json())?.AuthenticationResult?.IdToken : undefined
  if (!idToken) throw new NotLoggedInError() // refresh token also expired / revoked
  return idToken
}

/** A valid Cognito id token from the web app's session, refreshed when within
 *  60s of expiry. Throws {@link NotLoggedInError} when there's no usable session. */
export async function getIdToken(): Promise<string> {
  const token = await cookieMatching(ID_TOKEN)
  const exp = token ? expiry(token) : null
  if (token && exp && exp * 1000 - Date.now() > 60_000) return token
  return refresh()
}

export function openAppLogin(): void {
  void chrome.tabs.create({ url: `${APP_ORIGIN}/login` })
}
