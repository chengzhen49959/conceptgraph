'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { LoaderCircle, Trash2, UserPlus } from 'lucide-react'
import {
  type Members,
  createInvite,
  listMembers,
  revokeInvite,
} from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * Owner-only roster + invite form for a shared workspace. Invites are by email;
 * the created accept link is copied to the clipboard (no email delivery yet).
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
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'mentor' | 'member'>('mentor')
  const [inviting, setInviting] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setData(await listMembers(workspaceId))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    if (open) refresh()
  }, [open, refresh])

  const onInvite = async () => {
    const value = email.trim()
    if (!value) return
    setInviting(true)
    try {
      const invite = await createInvite(workspaceId, value, role)
      try {
        await navigator.clipboard?.writeText(invite.accept_url)
        toast.success(`Invited ${invite.email}. Invite link copied.`)
      } catch {
        toast.success(`Invited ${invite.email}.`)
      }
      setEmail('')
      await refresh()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setInviting(false)
    }
  }

  const onRevoke = async (id: string) => {
    try {
      await revokeInvite(workspaceId, id)
      await refresh()
      toast.success('Invite revoked')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Members</DialogTitle>
          <DialogDescription>
            Invite a mentor to review this project&apos;s research-direction graph.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            type="email"
            placeholder="mentor@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onInvite()
            }}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'mentor' | 'member')}
            className="h-9 shrink-0 rounded-md border bg-background px-2 text-sm"
            aria-label="Invite role"
          >
            <option value="mentor">Mentor</option>
            <option value="member">Member</option>
          </select>
          <Button onClick={onInvite} disabled={inviting || !email.trim()}>
            {inviting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            Invite
          </Button>
        </div>

        {loading && !data ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Members
              </p>
              <ul className="space-y-1">
                {data?.members.map((m) => (
                  <li
                    key={m.user_id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate">
                      {m.is_you ? 'You' : m.user_id}
                    </span>
                    <Badge variant="secondary">{m.role}</Badge>
                  </li>
                ))}
              </ul>
            </div>

            {data && data.pending_invites.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Pending invites
                </p>
                <ul className="space-y-1">
                  {data.pending_invites.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate">{p.email}</span>
                      <span className="flex items-center gap-2">
                        <Badge variant="outline">{p.role}</Badge>
                        <button
                          type="button"
                          onClick={() => onRevoke(p.id)}
                          aria-label="Revoke invite"
                          className="text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
