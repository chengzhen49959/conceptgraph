'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Link2 } from 'lucide-react'
import {
  type InviteRole,
  type Members,
  type ShareLink,
  getShareLink,
  listMembers,
  updateShareLink,
} from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Notion-style roles the share link can grant.
const ROLE_OPTIONS: { value: InviteRole; label: string }[] = [
  { value: 'editor', label: 'Can edit' },
  { value: 'commenter', label: 'Can comment' },
  { value: 'viewer', label: 'Can view' },
]

/**
 * Owner-only roster + sharing for a workspace. Sharing is a single reusable link
 * (Notion "Copy link"): toggle it on, pick the role it grants, copy, and anyone
 * with the link can join.
 */
export function MembersPanel({
  workspaceId,
  open,
  onOpenChange,
}: {
  workspaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [data, setData] = useState<Members | null>(null)
  const [shareLink, setShareLink] = useState<ShareLink | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [members, link] = await Promise.all([
        listMembers(workspaceId),
        getShareLink(workspaceId),
      ])
      setData(members)
      setShareLink(link)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    if (open) refresh()
  }, [open, refresh])

  const patchShareLink = async (patch: { enabled?: boolean; role?: InviteRole }) => {
    try {
      setShareLink(await updateShareLink(workspaceId, patch))
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const onCopyShareLink = async () => {
    if (!shareLink) return
    try {
      await navigator.clipboard?.writeText(shareLink.accept_url)
      toast.success('Share link copied')
    } catch {
      toast.error('Could not copy link')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Members</DialogTitle>
          <DialogDescription>
            Turn on the link and send it to invite collaborators to this
            project&apos;s research-direction graph.
          </DialogDescription>
        </DialogHeader>

        {loading && !data ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-4">
            {shareLink && (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Share link</p>
                    <p className="text-xs text-muted-foreground">
                      {shareLink.enabled
                        ? 'Anyone with the link can join.'
                        : 'Turn on to let anyone with the link join.'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={shareLink.enabled}
                    onChange={(e) => patchShareLink({ enabled: e.target.checked })}
                    aria-label="Enable share link"
                    className="size-4"
                  />
                </div>
                {shareLink.enabled && (
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      value={shareLink.role}
                      onChange={(e) =>
                        patchShareLink({ role: e.target.value as InviteRole })
                      }
                      className="h-9 shrink-0 rounded-md border bg-background px-2 text-sm"
                      aria-label="Share link role"
                    >
                      {ROLE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="secondary"
                      onClick={onCopyShareLink}
                      className="gap-1"
                    >
                      <Link2 className="size-4" />
                      Copy link
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="border-t pt-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Members
              </p>
              <ul className="space-y-1">
                {data?.members.map((m) => (
                  <li
                    key={m.user_id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate">{m.is_you ? 'You' : m.user_id}</span>
                    <Badge variant="secondary">{m.role}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
