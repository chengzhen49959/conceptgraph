import { redirect } from 'next/navigation'
import { type Me } from '@/lib/api'
import { apiServer } from '@/lib/api-server'
import { getServerUser } from '@/lib/auth/session'
import { WorkspaceView } from '@/components/workspace/WorkspaceView'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  // Email label for the topbar; the client UI still works if the backend is down.
  let email: string | null = null
  try {
    email = (await apiServer<Me>('/api/me')).email
  } catch {
    // ignore — fall back to no email label
  }

  return <WorkspaceView email={email} />
}
