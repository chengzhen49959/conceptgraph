'use client'

import { useEffect, useRef, useState } from 'react'
import {
  CircleAlert,
  CircleCheck,
  Download,
  ExternalLink,
  FileText,
  Globe,
  LoaderCircle,
  Trash2,
} from 'lucide-react'
import { type DocumentOut, DOC_STATUS_LABEL, isProcessing } from '@/lib/api'
import {
  downloadDocumentSource,
  openDocumentSource,
} from '@/lib/document-source'
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { type RowAction, RowContextMenu, RowOverflow } from './RowMenu'

/** Rough ETA for the merge phase, derived from how fast `current` is climbing.
 *
 * Anchors on the first sample seen for this run (resets if `current` drops — a new
 * document reusing the row), then extrapolates the remaining concepts at the average
 * rate since the anchor. Deliberately coarse (5s / 1m buckets): per-concept LLM
 * latency is too jittery for a precise countdown, and a wrong "~3s" that then stalls
 * reads worse than an honest "~30s".
 *
 * The estimate is refreshed from a 1s clock subscription rather than recomputed in
 * render: the wall-clock is the external system here, so `setState` lives in the
 * interval callback (never in the effect body or render — both would read the clock
 * impurely / setState synchronously). */
function useEta(
  current: number | null | undefined,
  total: number | null | undefined,
): string | null {
  const [eta, setEta] = useState<string | null>(null)
  const anchor = useRef<{ t0: number; c0: number } | null>(null)
  useEffect(() => {
    if (current == null || total == null || total === 0) {
      anchor.current = null
      return
    }
    const recompute = () => {
      const now = Date.now()
      const a = anchor.current
      if (!a || current < a.c0) {
        anchor.current = { t0: now, c0: current }
        setEta(null)
        return
      }
      const dc = current - a.c0
      const dt = (now - a.t0) / 1000
      if (dc <= 0 || dt < 1) return // not enough movement to estimate yet
      const remaining = (total - current) / (dc / dt) // seconds
      setEta(
        !isFinite(remaining) || remaining < 0
          ? null
          : remaining < 60
            ? `~${Math.ceil(remaining / 5) * 5}s`
            : `~${Math.ceil(remaining / 60)}m`,
      )
    }
    const id = setInterval(recompute, 1000)
    return () => clearInterval(id)
  }, [current, total])
  return eta
}

/** In-progress sub-line for a document: stage label, plus a live "30/62 · ~25s"
 * during the merge phase (the only stage that reports a count). */
function DocProgress({ doc }: { doc: DocumentOut }) {
  const eta = useEta(doc.progress_current, doc.progress_total)
  const label = DOC_STATUS_LABEL[doc.status]
  const { progress_current: cur, progress_total: tot } = doc
  if (cur == null || tot == null || tot === 0) return <>{label}…</>
  return (
    <>
      {label} {cur}/{tot}
      {eta ? ` · ${eta}` : ''}
    </>
  )
}

/** Compact terminal-state glyph for a document — denser than a full badge. */
function DocStatusIcon({ status }: { status: DocumentOut['status'] }) {
  if (status === 'done')
    return <CircleCheck className="size-3.5 shrink-0 text-emerald-500" />
  if (status === 'failed')
    return <CircleAlert className="size-3.5 shrink-0 text-destructive" />
  return (
    <LoaderCircle className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
  )
}

/** Hostname of a web clip's origin, for the row's secondary line (null for a file
 *  upload or an unparseable URL). */
function clipHost(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

// Shared position for the hover-revealed ⋯ button: top-right, fading in on row
// hover and staying put while its menu is open.
const OVERFLOW_POS =
  'absolute top-1.5 right-1 opacity-0 transition-opacity group-hover/row:opacity-100 data-[state=open]:opacity-100'

/**
 * A document row in the sidebar. Four shapes, by mode:
 *  - **collapsed (icon rail)** — just an icon; a click opens the source.
 *  - **select mode** — leading checkbox; clicking the row toggles its selection.
 *  - **failed** — the import error plus a one-click delete (re-upload to retry).
 *  - **normal** — clicking the row **opens** the source (file inline / clip origin);
 *    Download + Delete live on the hover `⋯` menu and the right-click menu, so the
 *    row follows the same one-model operation scheme as topics and concepts (no
 *    bespoke swipe). Batch delete stays on the section header's Select toggle.
 */
export function DocumentRow({
  doc,
  selectMode,
  selected,
  onToggleSelect,
  onDelete,
}: {
  doc: DocumentOut
  selectMode: boolean
  selected: boolean
  onToggleSelect: () => void
  /** Delete this one document (the menu's Delete; batch delete is the header toggle). */
  onDelete: () => void
}) {
  const { state } = useSidebar()
  // A web clip has no uploaded file — open links to its origin, no download.
  const canDownload = doc.status !== 'failed' && !doc.source_url
  const isFailed = doc.status === 'failed'

  // On the collapsed icon rail there's no room for a menu — a click just opens the
  // source, the one useful action at that size.
  if (state === 'collapsed') {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={doc.title}
          onClick={() => void openDocumentSource(doc)}
        >
          <FileText className="text-muted-foreground" />
          <span className="truncate">{doc.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  if (selectMode) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          className="h-auto min-h-8 items-center"
          tooltip={doc.title}
          isActive={selected}
          onClick={onToggleSelect}
          title={doc.title}
        >
          <span className="flex size-4 shrink-0 items-center justify-center">
            <input
              type="checkbox"
              checked={selected}
              readOnly
              aria-label={`Select ${doc.title}`}
              className="pointer-events-none size-3.5 accent-primary"
            />
          </span>
          <span className="min-w-0 flex-1 truncate">{doc.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  // One action declaration, surfaced by both the right-click menu and the ⋯ button.
  const actions: RowAction[] = isFailed
    ? [{ icon: Trash2, label: 'Delete', destructive: true, onClick: onDelete }]
    : [
        {
          icon: ExternalLink,
          label: 'Open',
          onClick: () => void openDocumentSource(doc),
        },
        ...(canDownload
          ? [
              {
                icon: Download,
                label: 'Download',
                onClick: () => void downloadDocumentSource(doc),
              },
            ]
          : []),
        {
          icon: Trash2,
          label: 'Delete',
          destructive: true,
          separatorBefore: true,
          onClick: onDelete,
        },
      ]

  if (isFailed) {
    return (
      <SidebarMenuItem className="group/row">
        <RowContextMenu actions={actions}>
          <SidebarMenuButton
            className="h-auto min-h-8 items-center pr-8"
            tooltip={doc.title}
            title={doc.error ?? 'Import failed'}
          >
            <CircleAlert className="text-destructive" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate">{doc.title}</span>
              <span className="flex min-w-0 flex-col text-[10px] leading-tight text-destructive">
                <span className="truncate" title={doc.error ?? 'Import failed'}>
                  {doc.error ?? 'Import failed'}
                </span>
                {/* Ingest can't resume in place (the original file isn't kept), so
                    the only recovery is delete + re-upload — spell it out. */}
                <span className="font-medium">Delete &amp; re-upload to retry</span>
              </span>
            </span>
          </SidebarMenuButton>
        </RowContextMenu>
        {/* A failed import needs an obvious action, so its ⋯ stays visible. */}
        <RowOverflow
          actions={actions}
          label={`Actions for ${doc.title}`}
          className="absolute top-1.5 right-1 text-destructive"
        />
      </SidebarMenuItem>
    )
  }

  // Normal: click the row to Open; Download / Delete via ⋯ or right-click.
  const Icon = doc.source_url ? Globe : FileText
  const host = clipHost(doc.source_url)
  return (
    <SidebarMenuItem className="group/row">
      <RowContextMenu actions={actions}>
        <SidebarMenuButton
          className="h-auto min-h-8 items-center pr-8"
          tooltip={doc.title}
          onClick={() => void openDocumentSource(doc)}
          title={doc.title}
        >
          <Icon className="text-muted-foreground" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate">{doc.title}</span>
            {isProcessing(doc.status) ? (
              <span className="truncate text-[10px] leading-tight text-muted-foreground tabular-nums">
                <DocProgress doc={doc} />
              </span>
            ) : host ? (
              <span className="truncate text-[10px] leading-tight text-muted-foreground">
                {host}
              </span>
            ) : null}
          </span>
          {/* Status glyph yields to the ⋯ on hover (same slot). */}
          <span className="transition-opacity group-hover/row:opacity-0">
            <DocStatusIcon status={doc.status} />
          </span>
        </SidebarMenuButton>
      </RowContextMenu>
      <RowOverflow
        actions={actions}
        label={`Actions for ${doc.title}`}
        className={OVERFLOW_POS}
      />
    </SidebarMenuItem>
  )
}
