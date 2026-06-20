import { type InvitePreview } from '@/lib/api'
import { apiServer } from '@/lib/api-server'
import { getServerUser } from '@/lib/auth/session'
import { InviteAccept } from '@/components/invite/InviteAccept'

export const dynamic = 'force-dynamic'

export default async function InvitePage({
  params,
}: {
  // Next 16: params is async — must be awaited.
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const user = await getServerUser()

  // Preview is unauthenticated; apiServer forwards a token only if present, which
  // the backend ignores for this route — so it works whether or not signed in.
  let preview: InvitePreview | null = null
  try {
    preview = await apiServer<InvitePreview>(`/api/invites/${token}`)
  } catch {
    // ignore — null preview renders the "invalid invite" state
  }

  return <InviteAccept token={token} preview={preview} signedIn={!!user} />
}
