'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LoaderCircle, Plus } from 'lucide-react'
import { type WorkspaceCard, createWorkspace } from '@/lib/api'
import { DEFAULT_ICON } from '@/lib/projectIcons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconPicker } from './IconPicker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ProjectCard } from './ProjectCard'

export function ProjectDashboard({
  initialWorkspaces,
}: {
  initialWorkspaces: WorkspaceCard[]
}) {
  const router = useRouter()
  const [items, setItems] = useState(initialWorkspaces)
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(DEFAULT_ICON)
  const [creating, setCreating] = useState(false)

  const onCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setCreating(true)
    try {
      const ws = await createWorkspace(trimmed, icon)
      toast.success(`Created "${ws.name}"`)
      router.push(`/dashboard?workspace=${ws.id}`) // open the new project
    } catch (e) {
      toast.error((e as Error).message)
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Each research project is an isolated workspace.
          </p>
        </div>
        <Button
          onClick={() => {
            setName('')
            setIcon(DEFAULT_ICON)
            setCreateOpen(true)
          }}
        >
          <Plus className="size-4" /> New project
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          No projects yet. Create your first one.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((w) => (
            <ProjectCard
              key={w.id}
              workspace={w}
              onOpen={() => router.push(`/dashboard?workspace=${w.id}`)}
              onUpdated={(u) =>
                setItems((xs) => xs.map((x) => (x.id === u.id ? u : x)))
              }
              onDeleted={(id) => setItems((xs) => xs.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={(o) => !creating && setCreateOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>
              Create an isolated workspace for a research direction.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCreate()
            }}
          />
          <IconPicker icon={icon} onChange={setIcon} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={onCreate} disabled={creating || !name.trim()}>
              {creating ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" /> Creating…
                </>
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
