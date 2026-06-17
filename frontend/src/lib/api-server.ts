import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { request } from '@/lib/api'

// Server-only: imports next/headers (via the server Supabase client). Never
// import this from a Client Component — use `apiClient` from `@/lib/api` there.

/** Call FastAPI from a Server Component / Route Handler (token from cookies). */
export async function apiServer<T>(path: string, init?: RequestInit): Promise<T> {
  const supabase = await createServerSupabase()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return request<T>(path, session?.access_token, init)
}
