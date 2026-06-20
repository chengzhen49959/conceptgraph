'use client'

import { useState } from 'react'
import { History, Network, Search, Users } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { MembersPanel } from './MembersPanel'
import { ActivityFeed } from './ActivityFeed'

export function AppTopbar({
  onOpenSearch,
  workspaceId,
  canManageMembers,
  onGraphChanged,
}: {
  onOpenSearch: () => void
  workspaceId: string | undefined
  canManageMembers: boolean
  // Re-fetch the graph after an undo from the activity feed.
  onGraphChanged: () => void
}) {
  const [membersOpen, setMembersOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2.5">
        <SidebarTrigger className="-ml-1" />
        <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
          <Network className="size-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Concept Graph</span>
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

        {workspaceId && (
          <Button variant="outline" size="sm" onClick={() => setActivityOpen(true)}>
            <History className="size-3.5" />
            Activity
          </Button>
        )}

        {canManageMembers && workspaceId && (
          <Button variant="outline" size="sm" onClick={() => setMembersOpen(true)}>
            <Users className="size-3.5" />
            Members
          </Button>
        )}
      </div>

      {workspaceId && (
        <>
          <MembersPanel
            workspaceId={workspaceId}
            open={membersOpen}
            onOpenChange={setMembersOpen}
          />
          <ActivityFeed
            workspaceId={workspaceId}
            open={activityOpen}
            onOpenChange={setActivityOpen}
            onUndone={onGraphChanged}
          />
        </>
      )}
    </header>
  )
}
