'use client'

import { useRouter } from 'next/navigation'
import { signOut } from 'aws-amplify/auth'
import { ChevronDown, LogOut, Network, PanelLeft, Search } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AppTopbar({
  email,
  workspaceName,
  onOpenSearch,
  onToggleSidebar,
}: {
  email: string | null
  workspaceName: string
  onOpenSearch: () => void
  onToggleSidebar?: () => void
}) {
  const router = useRouter()

  async function onSignOut() {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  const initial = (email?.[0] ?? '?').toUpperCase()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2.5">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            className="-ml-1 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <PanelLeft className="size-4" />
          </button>
        )}
        <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
          <Network className="size-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Concept Graph</span>
        <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
          {workspaceName}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSearch}
          className="hidden items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent sm:flex"
        >
          <Search className="size-3.5" />
          <span>Search concepts</span>
          <kbd className="ml-2 rounded border bg-muted px-1.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md p-1 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
            <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-medium text-background">
              {initial}
            </span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
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
      </div>
    </header>
  )
}
