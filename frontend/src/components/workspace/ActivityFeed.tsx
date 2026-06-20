'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { LoaderCircle, Undo2 } from 'lucide-react'
import { type AuditEntry, getAudit, undoAudit } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return new Date(iso).toLocaleDateString()
}

/**
 * Change history for a workspace's graph — the student's async-review surface.
 * Lists human edits (mentor's flagged distinctly) newest-first; each undoable
 * entry restores the node/edge from its captured snapshot.
 */
export function ActivityFeed({
  workspaceId,
  open,
  onOpenChange,
  onUndone,
}: {
  workspaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onUndone: () => void
}) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [undoing, setUndoing] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setEntries(await getAudit(workspaceId))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    if (open) refresh()
  }, [open, refresh])

  const onUndo = async (id: string) => {
    setUndoing(id)
    try {
      await undoAudit(id)
      toast.success('Change undone')
      onUndone()
      await refresh()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setUndoing(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Activity</SheetTitle>
          <SheetDescription>
            Recent changes to this graph. Undo restores the node and its links.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-1.5 px-4 pb-4">
            {loading && entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No changes yet.</p>
            ) : (
              entries.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start gap-2 rounded-md border p-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className={e.undone ? 'text-muted-foreground line-through' : ''}>
                      {e.summary}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{e.actor_is_you ? 'You' : e.actor_role}</span>
                      {e.source === 'mentor' && (
                        <Badge
                          variant="secondary"
                          className="px-1 py-0 text-[10px] leading-tight"
                        >
                          mentor
                        </Badge>
                      )}
                      <span>· {timeAgo(e.created_at)}</span>
                      {e.undone && <span>· undone</span>}
                    </p>
                  </div>
                  {e.can_undo && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 shrink-0"
                      onClick={() => onUndo(e.id)}
                      disabled={undoing === e.id}
                      aria-label="Undo this change"
                    >
                      {undoing === e.id ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Undo2 className="size-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
