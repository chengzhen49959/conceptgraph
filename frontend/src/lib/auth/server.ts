import { createServerRunner } from '@aws-amplify/adapter-nextjs'
import { authConfig } from './amplify-config'

// Build the per-request server-context runner ONCE (an Amplify requirement) and
// reuse it across Server Components, Route Handlers, and the proxy.
export const { runWithAmplifyServerContext } = createServerRunner({
  config: authConfig,
})
