'use client'

import { CircleCheck, FileText, LoaderCircle, Upload } from 'lucide-react'
import { type DocumentOut } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ACCEPT = '.pdf,.md,.markdown,.txt,application/pdf,text/markdown,text/plain'

function StatusBadge({ doc }: { doc: DocumentOut }) {
  if (doc.status === 'done')
    return (
      <Badge
        variant="outline"
        className="gap-1 border-emerald-500/40 text-emerald-600"
      >
        <CircleCheck className="size-3" />
        done
      </Badge>
    )
  if (doc.status === 'failed')
    return (
      <Badge variant="destructive" title={doc.error ?? 'failed'}>
        failed
      </Badge>
    )
  return (
    <Badge variant="secondary" className="gap-1 text-muted-foreground">
      <LoaderCircle className="size-3 animate-spin" />
      {doc.status}
    </Badge>
  )
}

export function Sidebar({
  documents,
  onPickFile,
  busy,
  loading,
}: {
  documents: DocumentOut[]
  onPickFile: (file: File) => void
  busy: boolean
  loading: boolean
}) {
  return (
    <aside className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b p-3">
        <label
          className={cn(
            buttonVariants({ variant: 'default', size: 'default' }),
            'w-full cursor-pointer',
            busy && 'pointer-events-none opacity-50',
          )}
        >
          {busy ? <LoaderCircle className="animate-spin" /> : <Upload />}
          {busy ? 'Uploading…' : 'Upload document'}
          <input
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onPickFile(file)
              e.target.value = '' // allow re-selecting the same file
            }}
          />
        </label>
        <p className="mt-2 px-0.5 text-xs leading-relaxed text-muted-foreground">
          PDF, Markdown, or text. Concepts merge into the graph automatically.
        </p>
      </div>

      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Documents
        </span>
        {documents.length > 0 && (
          <span className="text-xs text-muted-foreground">{documents.length}</span>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1 px-2 pb-2">
        {loading ? (
          <div className="space-y-2 px-1 py-1">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">
            No documents yet.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-accent"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-sm" title={doc.title}>
                  {doc.title}
                </span>
                <StatusBadge doc={doc} />
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </aside>
  )
}
