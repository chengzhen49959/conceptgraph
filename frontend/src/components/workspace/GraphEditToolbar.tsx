'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { LoaderCircle, Plus } from 'lucide-react'
import { createConcept } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * Floating editor controls over the graph canvas (shown only to owner/editor).
 * "Add node" creates a hand-authored direction concept; edge wiring and node
 * edit/delete live in the concept detail panel where a node is already selected.
 */
export function GraphEditToolbar({
  workspaceId,
  onCreated,
}: {
  workspaceId: string | undefined
  onCreated: (conceptId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  const onAdd = async () => {
    const n = name.trim()
    if (!n) return
    setBusy(true)
    try {
      const c = await createConcept({
        workspace_id: workspaceId,
        name: n,
        description: description.trim() || null,
      })
      toast.success(`Added "${c.name}"`)
      setOpen(false)
      setName('')
      setDescription('')
      onCreated(c.id)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* Top-right so it never collides with the cluster drill-in back chip,
          which sits at the canvas top-left. */}
      <div className="absolute right-3 top-3 z-10">
        <Button
          size="sm"
          variant="outline"
          className="shadow-sm"
          onClick={() => setOpen(true)}
        >
          <Plus className="size-4" /> Add node
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a direction node</DialogTitle>
            <DialogDescription>
              A hand-authored concept — a research question, hypothesis, or next
              step.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onAdd()
            }}
          />
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={onAdd} disabled={busy || !name.trim()}>
              {busy ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" /> Adding…
                </>
              ) : (
                'Add'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
