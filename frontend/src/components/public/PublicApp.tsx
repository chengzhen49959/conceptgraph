'use client'

import { useEffect, useRef, useState } from 'react'
import { LoaderCircle, Network } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { WorkspaceView } from '@/components/workspace/WorkspaceView'
import { ensurePublicSession } from '@/lib/public-session'

// The login-free demo at "/". Bootstraps an anonymous, seeded demo session
// (lib/public-session) BEFORE rendering the workspace, so the very first graph
// fetch already carries the session header and lands the prefilled graph. Then it
// reuses the full WorkspaceView in `public` mode — same graph, upload, search,
// ask, and edit, minus the account-scoped chrome (members, activity, chat,
// annotations, workspace switching).
export function PublicApp() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Effects run twice in dev StrictMode; this guards against a double session mint.
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    ensurePublicSession()
      .then(() => {
        setReady(true)
        toast('Welcome to the live demo — a public sandbox.', {
          description: 'Upload a paper, explore the graph, ask questions. Sign in to keep your work.',
          duration: 8000,
        })
      })
      .catch((e) => setError((e as Error).message))
  }, [])

  if (error) {
    return (
      <Centered>
        <Network className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Couldn’t start the demo.</p>
        <p className="max-w-sm text-center text-xs text-muted-foreground/80">{error}</p>
        <Button size="sm" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </Centered>
    )
  }

  if (!ready) {
    return (
      <Centered>
        <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Preparing your demo graph…</p>
      </Centered>
    )
  }

  return (
    <WorkspaceView
      public
      email={null}
      workspaces={[]}
      workspaceId={undefined}
      workspaceName="Demo workspace"
    />
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background">
      {children}
    </div>
  )
}
