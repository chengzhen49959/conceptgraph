'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { FileText, MoreVertical, Network, Pencil, Trash2 } from 'lucide-react'
import {
  type WorkspaceCard,
  deleteWorkspace,
  updateWorkspace,
} from '@/lib/api'
import { DEFAULT_ICON, ProjectIcon } from '@/lib/projectIcons'
import { IconPicker } from './IconPicker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  mentor: 'Mentor',
  member: 'Member',
}

export function ProjectCard({
  workspace,
  onOpen,
  onUpdated,
  onDeleted,
}: {
  workspace: WorkspaceCard
  onOpen: () => void
  onUpdated: (w: WorkspaceCard) => void
  onDeleted: (id: string) => void
}) {
  // The owner can rename / re-icon any workspace they own, including their
  // personal one. Only a shared project can be deleted — the personal workspace
  // is permanent.
  const isPersonal = workspace.type === 'private'
  const canRename = workspace.role === 'owner'
  const canDelete = canRename && !isPersonal
  const [renameOpen, setRenameOpen] = useState(false)
  const [name, setName] = useState(workspace.name)
  const [icon, setIcon] = useState(workspace.icon ?? DEFAULT_ICON)
  const [busy, setBusy] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const onRename = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setBusy(true)
    try {
      onUpdated(
        await updateWorkspace(workspace.id, { name: trimmed, icon }),
      )
      setRenameOpen(false)
      toast.success('Saved')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const onConfirmDelete = async () => {
    setBusy(true)
    try {
      await deleteWorkspace(workspace.id)
      onDeleted(workspace.id)
      toast.success('Project deleted')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
      setConfirmOpen(false)
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ProjectIcon
            name={workspace.icon}
            personal={isPersonal}
            size={18}
            className="text-muted-foreground"
          />
          <span className="truncate">{workspace.name}</span>
        </CardTitle>
        {canRename && (
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setName(workspace.name)
                    setIcon(workspace.icon ?? DEFAULT_ICON)
                    setRenameOpen(true)
                  }}
                >
                  <Pencil className="size-4" /> Rename
                </DropdownMenuItem>
                {canDelete && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setConfirmOpen(true)}
                  >
                    <Trash2 className="size-4" /> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">
            {ROLE_LABEL[workspace.role] ?? workspace.role}
          </Badge>
          <span className="inline-flex items-center gap-1">
            <Network className="size-3.5" /> {workspace.concept_count ?? 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <FileText className="size-3.5" /> {workspace.document_count ?? 0}
          </span>
        </div>
      </CardContent>

      <CardFooter className="items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {workspace.last_activity
            ? new Date(workspace.last_activity).toLocaleDateString()
            : '—'}
        </span>
        <Button size="sm" variant="outline" onClick={onOpen}>
          Open
        </Button>
      </CardFooter>

      <Dialog open={renameOpen} onOpenChange={(o) => !busy && setRenameOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRename()
            }}
          />
          <IconPicker icon={icon} onChange={setIcon} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button onClick={onRename} disabled={busy || !name.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        destructive
        loading={busy}
        title={`Delete "${workspace.name}"?`}
        description="The entire workspace — its documents, concepts, and graph — is permanently removed. This cannot be undone."
        confirmLabel={busy ? 'Deleting…' : 'Delete'}
        onConfirm={onConfirmDelete}
      />
    </Card>
  )
}
