import { redirect } from 'next/navigation'
import { type Me, type WorkspaceCard } from '@/lib/api'
import { apiServer } from '@/lib/api-server'
import { getServerUser } from '@/lib/auth/session'
import { WorkspaceView } from '@/components/workspace/WorkspaceView'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  // Next 16: searchParams is async — must be awaited.
  searchParams: Promise<{ workspace?: string }>
}) {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const { workspace: requested } = await searchParams

  // Email label for the topbar; the client UI still works if the backend is down.
  let email: string | null = null
  try {
    email = (await apiServer<Me>('/api/me')).email
  } catch {
    // ignore — fall back to no email label
  }

  // The switcher needs the full list; resolve the active workspace from the
  // ?workspace= param, else the personal one, else the first available.
  let workspaces: WorkspaceCard[] = []
  try {
    workspaces = await apiServer<WorkspaceCard[]>('/api/workspaces')
  } catch {
    // ignore — empty list; WorkspaceView falls back to the personal workspace
  }
  const current =
    workspaces.find((w) => w.id === requested) ??
    workspaces.find((w) => w.type === 'private') ??
    workspaces[0]

  return (
    <WorkspaceView
      email={email}
      workspaces={workspaces}
      workspaceId={current?.id}
      workspaceName={current?.name ?? 'Personal'}
    />
  )
}
