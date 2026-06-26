import { getServerIdToken } from '@/lib/auth/session'

// RAG Q&A streaming proxy (F8). The browser can't open an authenticated stream to
// the FastAPI backend directly — EventSource can't carry the bearer, and a raw
// cross-origin fetch would re-expose the Cognito token to client JS. So this Route
// Handler reads the id token from the request cookies server-side, forwards the
// question to the backend's `POST /api/ask`, and relays the backend's Server-Sent
// Events body straight back to the client untouched. Pure pass-through: no buffering,
// no re-parsing — the SSE frames the backend emits are the frames the client reads.

// Node runtime + always-dynamic: it reads cookies and streams a per-request answer,
// so there is nothing to cache or prerender.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// The whole answer streams through this handler, so its execution time is the
// answer's wall-clock. Raise the function ceiling so a longer answer isn't cut off
// mid-stream (the platform clamps this to the plan's max).
export const maxDuration = 60

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000'

export async function POST(request: Request) {
  const token = await getServerIdToken()
  if (!token) {
    return new Response(JSON.stringify({ detail: 'not signed in' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Forward the JSON body verbatim ({ q, workspace_id? }); the backend validates it.
  const body = await request.text()

  const upstream = await fetch(`${API_BASE}/api/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body,
    // Stream the response instead of buffering it.
    cache: 'no-store',
    // Propagate a client abort (user asks again / closes the palette) to the
    // backend so it stops generating — and stops burning OpenAI tokens — promptly.
    signal: request.signal,
  })

  // A pre-stream error (503 embedding down, 403 wrong workspace, 422 bad body) comes
  // back as JSON, not SSE — relay it with its status so the client can surface the
  // `detail`. Only a 200 carries the event stream.
  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text()
    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      // Mirror the backend hint so any intermediary leaves the stream unbuffered.
      'X-Accel-Buffering': 'no',
    },
  })
}
