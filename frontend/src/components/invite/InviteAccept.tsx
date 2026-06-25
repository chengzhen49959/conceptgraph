'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LoaderCircle } from 'lucide-react'
import { type InvitePreview, acceptShareLink } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function InviteAccept({
  token,
  preview,
  signedIn,
}: {
  token: string
  preview: InvitePreview | null
  signedIn: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  // The link is joinable only while enabled.
  const joinable = preview?.status === 'enabled'

  const onAccept = async () => {
    if (!preview) return
    setBusy(true)
    try {
      const { workspace_id } = await acceptShareLink(token)
      toast.success('Joined the project')
      // Full navigation so the server gate sees the membership immediately.
      window.location.assign(`/dashboard?workspace=${workspace_id}`)
    } catch (e) {
      toast.error((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Project invitation</CardTitle>
          <CardDescription>
            {preview ? (
              <>
                You&apos;ve been invited to join{' '}
                <span className="font-medium text-foreground">
                  {preview.workspace_name}
                </span>{' '}
                as {preview.role}.
              </>
            ) : (
              'This invitation is invalid or has expired.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!preview ? null : !joinable ? (
            <p className="text-sm text-destructive">
              This link is no longer active.
            </p>
          ) : signedIn ? (
            <Button onClick={onAccept} disabled={busy} className="w-full">
              {busy && <LoaderCircle className="size-4 animate-spin" />}
              {busy ? 'Joining…' : 'Accept invitation'}
            </Button>
          ) : (
            <Button
              onClick={() => router.push(`/login?next=/invite/${token}`)}
              className="w-full"
            >
              Log in to accept
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
