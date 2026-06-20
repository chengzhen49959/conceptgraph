import { redirect } from 'next/navigation'
import { type WorkspaceCard } from '@/lib/api'
import { apiServer } from '@/lib/api-server'
import { getServerUser } from '@/lib/auth/session'
import { ProjectDashboard } from '@/components/projects/ProjectDashboard'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  let workspaces: WorkspaceCard[] = []
  try {
    workspaces = await apiServer<WorkspaceCard[]>('/api/workspaces?with_stats=1')
  } catch {
    // ignore — render an empty dashboard if the backend is unreachable
  }

  return <ProjectDashboard initialWorkspaces={workspaces} />
}
