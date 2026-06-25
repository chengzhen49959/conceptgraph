'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Check,
  CornerDownRight,
  Flag,
  Highlighter,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import {
  type Annotation,
  createAnnotation,
  deleteAnnotation,
  reopenAnnotation,
  resolveAnnotation,
} from '@/lib/api'
import { Button } from '@/components/ui/button'

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return new Date(iso).toLocaleDateString()
}

// No users table to resolve a sub → email, so others show a short id prefix.
const author = (a: Annotation) =>
  a.author_is_you ? 'You' : a.author_id.slice(0, 6)

/**
 * Annotation surface for one concept: highlight / flag toggles (owner/editor
 * only, via `canFlag`) plus a comment thread (owner/editor/commenter, via
 * `canComment`; a viewer sees threads read-only). State lives in the parent (the
 * workspace annotation list); every action calls the API then `onChanged`.
 */
export function ConceptAnnotations({
  conceptId,
  workspaceId,
  canFlag,
  canComment,
  annotations,
  onChanged,
}: {
  conceptId: string
  workspaceId: string | undefined
  canFlag: boolean
  canComment: boolean
  annotations: Annotation[]
  onChanged: () => void
}) {
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const roots = annotations.filter((a) => !a.parent_id)
  const repliesByParent = new Map<string, Annotation[]>()
  for (const a of annotations) {
    if (a.parent_id) {
      const arr = repliesByParent.get(a.parent_id) ?? []
      arr.push(a)
      repliesByParent.set(a.parent_id, arr)
    }
  }
  const openHighlight = roots.find((a) => a.kind === 'highlight' && a.status === 'open')
  const openFlag = roots.find((a) => a.kind === 'flag' && a.status === 'open')

  // Threads worth listing: comments, plus any flag/highlight that carries a body
  // or has replies (a bare highlight/flag shows only as a canvas marker + toggle).
  const threads = roots.filter(
    (a) =>
      a.kind === 'comment' ||
      a.body ||
      (repliesByParent.get(a.id)?.length ?? 0) > 0,
  )

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    try {
      await fn()
      onChanged()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const toggleHighlight = () =>
    run(async () => {
      if (openHighlight) await resolveAnnotation(openHighlight.id)
      else
        await createAnnotation({
          workspace_id: workspaceId,
          target_type: 'concept',
          target_concept_id: conceptId,
          kind: 'highlight',
        })
      toast.success(openHighlight ? 'Highlight removed' : 'Marked a good direction')
    })

  const toggleFlag = () =>
    run(async () => {
      if (openFlag) await resolveAnnotation(openFlag.id)
      else
        await createAnnotation({
          workspace_id: workspaceId,
          target_type: 'concept',
          target_concept_id: conceptId,
          kind: 'flag',
        })
      toast.success(openFlag ? 'Flag cleared' : 'Flagged as off-track')
    })

  const addComment = () => {
    const b = comment.trim()
    if (!b) return
    run(async () => {
      await createAnnotation({
        workspace_id: workspaceId,
        target_type: 'concept',
        target_concept_id: conceptId,
        kind: 'comment',
        body: b,
      })
      setComment('')
    })
  }

  const sendReply = (parentId: string) => {
    const b = replyText.trim()
    if (!b) return
    run(async () => {
      await createAnnotation({ parent_id: parentId, body: b })
      setReplyText('')
      setReplyTo(null)
    })
  }

  const toggleResolve = (a: Annotation) =>
    run(async () => {
      if (a.status === 'open') await resolveAnnotation(a.id)
      else await reopenAnnotation(a.id)
    })

  const remove = (id: string) => run(async () => deleteAnnotation(id))

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Notes
      </h3>

      {canFlag && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={openHighlight ? 'default' : 'outline'}
            className={openHighlight ? 'bg-emerald-600 text-white hover:bg-emerald-600/90' : ''}
            disabled={busy}
            onClick={toggleHighlight}
          >
            <Highlighter className="size-3.5" />
            {openHighlight ? 'Highlighted' : 'Highlight'}
          </Button>
          <Button
            size="sm"
            variant={openFlag ? 'default' : 'outline'}
            className={openFlag ? 'bg-amber-600 text-white hover:bg-amber-600/90' : ''}
            disabled={busy}
            onClick={toggleFlag}
          >
            <Flag className="size-3.5" />
            {openFlag ? 'Flagged' : 'Flag'}
          </Button>
        </div>
      )}

      {threads.length > 0 && (
        <ul className="space-y-2">
          {threads.map((a) => (
            <li key={a.id} className="rounded-md border p-2 text-xs">
              <div className="flex items-start gap-1.5">
                {a.kind === 'flag' && (
                  <Flag className="mt-0.5 size-3 shrink-0 text-amber-500" />
                )}
                {a.kind === 'highlight' && (
                  <Highlighter className="mt-0.5 size-3 shrink-0 text-emerald-500" />
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={
                      a.status === 'resolved'
                        ? 'text-muted-foreground line-through'
                        : ''
                    }
                  >
                    {a.body ||
                      (a.kind === 'flag'
                        ? 'Flagged as off-track'
                        : a.kind === 'highlight'
                          ? 'Good direction'
                          : '')}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    {author(a)} · {timeAgo(a.created_at)}
                    {a.status === 'resolved' && ' · resolved'}
                  </p>

                  {(repliesByParent.get(a.id) ?? []).map((r) => (
                    <div
                      key={r.id}
                      className="mt-1 flex items-start gap-1 border-l pl-2"
                    >
                      <CornerDownRight className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p>{r.body}</p>
                        <p className="text-muted-foreground">
                          {author(r)} · {timeAgo(r.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {canComment && (replyTo === a.id ? (
                    <div className="mt-1 flex gap-1">
                      <input
                        autoFocus
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') sendReply(a.id)
                        }}
                        placeholder="Reply…"
                        className="h-7 min-w-0 flex-1 rounded border bg-background px-2 text-xs"
                      />
                      <Button
                        size="sm"
                        className="h-7"
                        disabled={busy || !replyText.trim()}
                        onClick={() => sendReply(a.id)}
                      >
                        Send
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setReplyTo(a.id)
                        setReplyText('')
                      }}
                      className="mt-1 text-muted-foreground hover:text-foreground"
                    >
                      Reply
                    </button>
                  ))}
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                  {canComment && (
                    <button
                      onClick={() => toggleResolve(a)}
                      aria-label={a.status === 'open' ? 'Resolve' : 'Reopen'}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                    >
                      {a.status === 'open' ? (
                        <Check className="size-3.5" />
                      ) : (
                        <RotateCcw className="size-3.5" />
                      )}
                    </button>
                  )}
                  {a.author_is_you && (
                    <button
                      onClick={() => remove(a.id)}
                      aria-label="Delete note"
                      className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canComment && (
        <div className="flex gap-1.5">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addComment()
            }}
            placeholder="Add a comment…"
            className="h-8 min-w-0 flex-1 rounded-md border bg-background px-2 text-xs"
          />
          <Button
            size="sm"
            className="h-8"
            disabled={busy || !comment.trim()}
            onClick={addComment}
          >
            Comment
          </Button>
        </div>
      )}
    </div>
  )
}
