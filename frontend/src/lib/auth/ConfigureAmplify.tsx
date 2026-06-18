'use client'

import { Amplify } from 'aws-amplify'
import { authConfig } from './amplify-config'

// Configure Amplify on the client with cookie-backed storage (`ssr: true`) so
// the session is also readable by Server Components, Route Handlers, and the
// proxy. Runs once at module load; mounted from the root layout.
Amplify.configure(authConfig, { ssr: true })

export function ConfigureAmplify() {
  return null
}
