'use client'

import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, LayoutGrid } from 'lucide-react'
import { type WorkspaceCard } from '@/lib/api'
import { ProjectIcon } from '@/lib/projectIcons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

/**
 * Project switcher in the sidebar header. Lists the caller's workspaces and
 * navigates to `/dashboard?workspace=<id>` (the page re-resolves the active
 * workspace from that param). "All projects" opens the dashboard grid.
 */
export function WorkspaceSwitcher({
  workspaces,
  currentId,
  currentName,
}: {
  workspaces: WorkspaceCard[]
  currentId: string | undefined
  currentName: string
}) {
  const router = useRouter()
  const { isMobile } = useSidebar()

  const current = workspaces.find((w) => w.id === currentId)
  const currentIsPersonal = !current || current.type === 'private'

  const switchTo = (id: string) => {
    router.push(`/dashboard?workspace=${id}`)
    router.refresh()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={currentName}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <span className="flex aspect-square size-6 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <ProjectIcon
                  name={current?.icon}
                  personal={currentIsPersonal}
                  size={14}
                />
              </span>
              <span className="flex-1 truncate text-left text-sm font-medium">
                {currentName}
              </span>
              <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Projects
            </DropdownMenuLabel>
            {workspaces.map((w) => (
              <DropdownMenuItem
                key={w.id}
                onClick={() => switchTo(w.id)}
                className="gap-2"
              >
                <ProjectIcon
                  name={w.icon}
                  personal={w.type === 'private'}
                  size={16}
                  className="text-muted-foreground"
                />
                <span className="flex-1 truncate">{w.name}</span>
                {w.id === currentId && <Check className="size-4 shrink-0" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push('/projects')}
              className="gap-2"
            >
              <LayoutGrid className="size-4 shrink-0 text-muted-foreground" />
              All projects
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
