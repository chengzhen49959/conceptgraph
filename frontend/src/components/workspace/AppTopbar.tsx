'use client'

import { useState } from 'react'
import { Bell, Search, Users } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { ProjectIcon } from '@/lib/projectIcons'
import { MembersPanel } from './MembersPanel'
import { ActivityFeed } from './ActivityFeed'
import { SignInButton } from '@/components/public/SignInButton'

export function AppTopbar({
  onOpenSearch,
  workspaceId,
  canManageMembers,
  onGraphChanged,
  activityUnread,
  onActivitySeen,
  onNavigateConcept,
  publicMode = false,
}: {
  onOpenSearch: () => void
  workspaceId: string | undefined
  canManageMembers: boolean
  // Re-fetch the graph after an undo from the activity feed.
  onGraphChanged: () => void
  // Unread activity count (events by others since last opened) → bell badge.
  activityUnread: number
  // Called when the feed is opened/marked read → clear the badge.
  onActivitySeen: () => void
  // Jump to a concept from an activity event.
  onNavigateConcept: (conceptId: string) => void
  // Public demo: show a Sign-in CTA (collab buttons are already hidden — they key
  // off workspaceId, which the demo leaves undefined).
  publicMode?: boolean
}) {
  const [membersOpen, setMembersOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2.5">
        <SidebarTrigger className="-ml-1" />
        <ProjectIcon personal size={28} />
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
          <Button
            variant="outline"
            size="sm"
            className="relative"
            onClick={() => setActivityOpen(true)}
          >
            <Bell className="size-3.5" />
            Activity
            {activityUnread > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium leading-none text-white">
                {activityUnread > 99 ? '99+' : activityUnread}
              </span>
            )}
          </Button>
        )}

        {canManageMembers && workspaceId && (
          <Button variant="outline" size="sm" onClick={() => setMembersOpen(true)}>
            <Users className="size-3.5" />
            Members
          </Button>
        )}

        {publicMode && <SignInButton className="ml-1" />}
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
            onNavigate={onNavigateConcept}
            onSeen={onActivitySeen}
          />
        </>
      )}
    </header>
  )
}
