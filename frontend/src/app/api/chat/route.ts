import { getServerIdToken } from '@/lib/auth/session'

// Conversational-agent streaming proxy. Like the /api/ask proxy: the browser can't
// open an authenticated stream to FastAPI directly (EventSource can't carry the
// bearer), so this Route Handler reads the id token from cookies server-side,
// forwards the turn to the backend's per-conversation message endpoint, and relays
// the Server-Sent Events body back untouched. Pure pass-through, no buffering.
//
// The conversation id travels in the JSON body (not the path) so this stays a single
// fixed route, mirroring /api/ask. The backend path is built from it server-side.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// A multi-step agent turn (several tool calls, then the streamed answer) is longer
// than a one-shot ask, so raise the ceiling well past /api/ask's 60s. The platform
// clamps this to the plan's max.
export const maxDuration = 300

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000'

export async function POST(request: Request) {
  const token = await getServerIdToken()
  if (!token) {
    return new Response(JSON.stringify({ detail: 'not signed in' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let conversationId: string
  let content: string
  try {
    const body = (await request.json()) as { conversation_id?: string; content?: string }
    if (!body.conversation_id || typeof body.content !== 'string') {
      throw new Error('missing conversation_id or content')
    }
    conversationId = body.conversation_id
    content = body.content
  } catch {
    return new Response(JSON.stringify({ detail: 'bad request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const upstream = await fetch(
    `${API_BASE}/api/chat/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
      cache: 'no-store',
      // Propagate a client abort (closed panel / new message) to the backend so it
      // stops the agent and stops burning tokens promptly.
      signal: request.signal,
    },
  )

  // A pre-stream error (404 conversation, 403 workspace, 400 empty) comes back as
  // JSON, not SSE — relay it with its status so the client can surface `detail`.
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
      'X-Accel-Buffering': 'no',
    },
  })
}
