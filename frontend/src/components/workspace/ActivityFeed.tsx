'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Flag,
  Highlighter,
  LoaderCircle,
  MessageSquare,
  PenLine,
  Undo2,
} from 'lucide-react'
import {
  type ActivityEvent,
  type ActivityScope,
  type ActivityType,
  getActivity,
  markActivitySeen,
  undoAudit,
} from '@/lib/api'
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

// No users table to resolve a sub → name, so others show role or a short id.
const actorLabel = (e: ActivityEvent) =>
  e.actor_is_you ? 'You' : (e.actor_role ?? e.actor_id?.slice(0, 6) ?? '—')

function EventIcon({ action }: { action: string }) {
  const cls = 'mt-0.5 size-3.5 shrink-0 text-muted-foreground'
  if (action.startsWith('annotation.highlight')) return <Highlighter className={cls} />
  if (action.startsWith('annotation.flag')) return <Flag className={cls} />
  if (action.startsWith('annotation.comment') || action.startsWith('annotation.reply'))
    return <MessageSquare className={cls} />
  return <PenLine className={cls} /> // graph edit
}

const SCOPES: { value: ActivityScope; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mine', label: 'Mine' },
  { value: 'others', label: 'Others' },
]
const TYPES: { value: ActivityType; label: string }[] = [
  { value: 'edit', label: 'Edits' },
  { value: 'highlight', label: 'Highlights' },
  { value: 'flag', label: 'Flags' },
  { value: 'comment', label: 'Comments' },
]

/**
 * Unified change feed for a workspace: graph edits + annotations (highlights /
 * flags / comments) in one timeline, newest-first. Filter by who (all/mine/
 * others) and type; click an event to jump to its concept; undo graph edits.
 * Opening the panel marks the feed read (clears the unread badge).
 */
export function ActivityFeed({
  workspaceId,
  open,
  onOpenChange,
  onUndone,
  onNavigate,
  onSeen,
}: {
  workspaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  // Re-fetch the graph after an undo.
  onUndone: () => void
  // Jump to a concept when an event row is clicked.
  onNavigate: (conceptId: string) => void
  // Tell the parent the feed was read so it can clear the unread badge.
  onSeen: () => void
}) {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [undoing, setUndoing] = useState<string | null>(null)
  const [scope, setScope] = useState<ActivityScope>('all')
  const [types, setTypes] = useState<ActivityType[]>([]) // empty = all types

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setEvents(await getActivity(workspaceId, { scope, types }))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [workspaceId, scope, types])

  // Reload on open and whenever a filter changes.
  useEffect(() => {
    if (open) refresh()
  }, [open, refresh])

  // Mark read once per open (clears the bell badge).
  useEffect(() => {
    if (!open) return
    markActivitySeen(workspaceId)
      .then(onSeen)
      .catch(() => {})
  }, [open, workspaceId, onSeen])

  const onUndo = async (e: ActivityEvent) => {
    if (!e.audit_id) return
    setUndoing(e.id)
    try {
      await undoAudit(e.audit_id)
      toast.success('Change undone')
      onUndone()
      await refresh()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setUndoing(null)
    }
  }

  const toggleType = (t: ActivityType) =>
    setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))

  const jumpTo = (e: ActivityEvent) => {
    if (!e.target_concept_id) return
    onNavigate(e.target_concept_id)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Activity</SheetTitle>
          <SheetDescription>
            Edits, highlights, flags, and comments — yours and your collaborators&apos;.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-wrap items-center gap-1.5 px-4 pb-1">
          {SCOPES.map((s) => (
            <Button
              key={s.value}
              size="sm"
              variant={scope === s.value ? 'default' : 'outline'}
              className="h-7 px-2.5 text-xs"
              onClick={() => setScope(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 px-4 pb-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => toggleType(t.value)}
              className={`rounded-md border px-2 py-0.5 text-xs transition-colors ${
                types.includes(t.value)
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-1.5 px-4 pb-4">
            {loading && events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              events.map((e) => {
                const clickable = !!e.target_concept_id
                return (
                  <div
                    key={e.id}
                    onClick={() => jumpTo(e)}
                    className={`flex items-start gap-2 rounded-md border p-2 text-sm ${
                      clickable ? 'cursor-pointer hover:bg-accent' : ''
                    }`}
                  >
                    <EventIcon action={e.action} />
                    <div className="min-w-0 flex-1">
                      <p className={e.undone ? 'text-muted-foreground line-through' : ''}>
                        {e.summary}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{actorLabel(e)}</span>
                        {e.actor_role === 'editor' && (
                          <Badge
                            variant="secondary"
                            className="px-1 py-0 text-[10px] leading-tight"
                          >
                            editor
                          </Badge>
                        )}
                        <span>· {timeAgo(e.created_at)}</span>
                        {e.undone && <span>· undone</span>}
                      </p>
                    </div>
                    {e.can_undo && e.audit_id && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 shrink-0"
                        onClick={(ev) => {
                          ev.stopPropagation()
                          onUndo(e)
                        }}
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
                )
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
