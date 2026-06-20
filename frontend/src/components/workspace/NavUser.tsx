'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'aws-amplify/auth'
import { ChevronsUpDown, LogOut } from 'lucide-react'
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
 * Account block pinned to the sidebar footer — the avatar collapses to the icon
 * rail, and the dropdown carries the sign-out that used to live in the topbar.
 * No `tooltip` on the button: it doubles as the DropdownMenu trigger via
 * `asChild`, and stacking the sidebar's tooltip Slot under the menu's trigger
 * Slot would clobber the ref.
 */
export function NavUser({ email }: { email: string | null }) {
  const router = useRouter()
  const { isMobile } = useSidebar()
  const initial = (email?.[0] ?? '?').toUpperCase()

  async function onSignOut() {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-medium text-sidebar-primary-foreground">
                {initial}
              </span>
              <span className="flex-1 truncate text-left text-sm leading-tight">
                {email ?? 'Signed in'}
              </span>
              <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
              {email ?? 'Signed in'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut}>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
