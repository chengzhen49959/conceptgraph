'use client'

import { useEffect, useRef, useState } from 'react'
import {
  CircleAlert,
  CircleCheck,
  Download,
  ExternalLink,
  FileText,
  LoaderCircle,
  Trash2,
} from 'lucide-react'
import {
  type DocumentOut,
  DOC_STATUS_LABEL,
  isProcessing,
} from '@/lib/api'
import {
  downloadDocumentSource,
  openDocumentSource,
} from '@/lib/document-source'
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

// Width (px) of one revealed swipe action. The content slides left by
// actions × this, exposing the action panel that slid in from the right.
const ACTION_W = 56

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

/** One revealed swipe action — full row height, icon over a tiny label. Not
 *  tabbable while the row is closed (it sits off-screen). */
function SwipeAction({
  icon,
  label,
  onClick,
  reachable,
  className,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  reachable: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      tabIndex={reachable ? 0 : -1}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      style={{ width: ACTION_W }}
      className={cn(
        'flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors [&>svg]:size-4',
        className,
      )}
    >
      {icon}
      {label}
    </button>
  )
}

/**
 * A document row in the sidebar. Three shapes, by mode:
 *  - **select mode** — leading checkbox; clicking the row toggles its selection.
 *  - **failed** — the import error plus a one-click delete (re-upload to retry).
 *  - **normal** — a WeChat-style swipe: clicking the row slides it left to reveal
 *    [Download] [Open] (file uploads) or just [Open] (web clips), instead of
 *    opening directly — so opening vs. saving is an explicit, visible choice.
 *
 * `swipeOpen` / `onSwipeOpenChange` are owned by the parent so only one row is
 * open at a time (and an outside click can close it).
 */
export function DocumentRow({
  doc,
  selectMode,
  selected,
  onToggleSelect,
  swipeOpen,
  onSwipeOpenChange,
  onDeleteFailed,
}: {
  doc: DocumentOut
  selectMode: boolean
  selected: boolean
  onToggleSelect: () => void
  swipeOpen: boolean
  onSwipeOpenChange: (open: boolean) => void
  onDeleteFailed: () => void
}) {
  const { state } = useSidebar()
  // A web clip has no uploaded file — open links to its origin, no download.
  const canDownload = doc.status !== 'failed' && !doc.source_url
  const isFailed = doc.status === 'failed'

  // On the collapsed icon rail there's no room to swipe or select — a click just
  // opens the source, the one useful action at that size.
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

  if (isFailed) {
    return (
      <SidebarMenuItem className="group/row">
        <SidebarMenuButton
          className="h-auto min-h-8 items-center pr-8"
          tooltip={doc.title}
          title={doc.error ?? 'Import failed'}
        >
          <FileText className="text-muted-foreground" />
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
        <button
          type="button"
          title="Delete this document — then re-upload to try again"
          aria-label={`Delete ${doc.title} and re-upload`}
          onClick={(e) => {
            e.stopPropagation()
            onDeleteFailed()
          }}
          className="absolute top-1.5 right-1 z-10 flex aspect-square w-5 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
        >
          <Trash2 className="size-3.5" />
        </button>
      </SidebarMenuItem>
    )
  }

  // Normal: swipe to reveal actions. The panel sits off the right edge (clipped by
  // `overflow-hidden`) and slides in as the content slides out by the same width.
  const panelW = (canDownload ? 2 : 1) * ACTION_W
  return (
    <SidebarMenuItem
      data-doc-row={doc.id}
      className="relative overflow-hidden"
    >
      <div
        className="transition-transform duration-200 ease-out"
        style={{ transform: swipeOpen ? `translateX(-${panelW}px)` : undefined }}
      >
        <SidebarMenuButton
          className="h-auto min-h-8 items-center"
          tooltip={doc.title}
          onClick={() => onSwipeOpenChange(!swipeOpen)}
          title={doc.title}
        >
          <FileText className="text-muted-foreground" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate">{doc.title}</span>
            {isProcessing(doc.status) && (
              <span className="truncate text-[10px] leading-tight text-muted-foreground tabular-nums">
                <DocProgress doc={doc} />
              </span>
            )}
          </span>
          <DocStatusIcon status={doc.status} />
        </SidebarMenuButton>
      </div>

      <div
        aria-hidden={!swipeOpen}
        className={cn(
          'absolute inset-y-0 right-0 z-10 flex transition-transform duration-200 ease-out',
          !swipeOpen && 'pointer-events-none',
        )}
        style={{
          width: panelW,
          transform: swipeOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {canDownload && (
          <SwipeAction
            icon={<Download />}
            label="Download"
            reachable={swipeOpen}
            onClick={() => {
              onSwipeOpenChange(false)
              void downloadDocumentSource(doc)
            }}
            className="bg-sidebar-accent text-sidebar-accent-foreground hover:brightness-95"
          />
        )}
        <SwipeAction
          icon={<ExternalLink />}
          label="Open"
          reachable={swipeOpen}
          onClick={() => {
            onSwipeOpenChange(false)
            void openDocumentSource(doc)
          }}
          className="bg-primary text-primary-foreground hover:brightness-110"
        />
      </div>
    </SidebarMenuItem>
  )
}
