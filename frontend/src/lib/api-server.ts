import { getServerIdToken } from '@/lib/auth/session'
import { request } from '@/lib/api'

// Server-only: reads the session from cookies (via next/headers). Never import
// this from a Client Component — use `apiClient` from `@/lib/api` there.

/** Call FastAPI from a Server Component / Route Handler (token from cookies). */
export async function apiServer<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getServerIdToken()
  return request<T>(path, token, init)
}
