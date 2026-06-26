import { toast } from 'sonner'
import { type DocumentOut, getDocumentDownloadUrl } from './api'

/**
 * Open / download a document's original source — the actions surfaced on each
 * sidebar document row (there is no in-app reader). A **web clip** has only its
 * origin page; a **file upload** has a file in S3 reached via a short-lived
 * presigned URL fetched on demand (so the URL is never stale when used).
 */

/** Escape a document title for the loading placeholder's HTML. */
function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!,
  )
}

/** Minimal "Opening…" page written into the new tab while the presigned URL
 *  resolves — so the user never stares at a blank tab. */
function loadingDocument(title: string): string {
  const t = escapeHtml(title)
  return (
    `<!doctype html><html><head><meta charset="utf-8"><title>${t}</title></head>` +
    `<body style="margin:0;display:grid;place-items:center;height:100vh;` +
    `font:14px/1.5 system-ui,sans-serif;color:#6b7280;background:#fff">` +
    `Opening “${t}”…</body></html>`
  )
}

/** Open the source in a new tab: a web clip → its origin page; a file upload →
 *  its file inline (e.g. a PDF in the browser viewer).
 *
 *  For a file upload we must open the tab *synchronously* inside the click (so the
 *  pop-up blocker lets it through), then point it at the presigned URL once it
 *  resolves. Crucially we open WITHOUT `noopener`: with `noopener`, `window.open`
 *  returns `null`, so the placeholder/redirect can't run and a second `window.open`
 *  after the await fires — stranding an empty tab. We keep the handle, show a
 *  loading page, redirect, then sever `opener` ourselves for the same safety. */
export async function openDocumentSource(doc: DocumentOut): Promise<void> {
  // Web clip: an external page — keep noopener, no presign needed.
  if (doc.source_url) {
    window.open(doc.source_url, '_blank', 'noopener,noreferrer')
    return
  }

  const tab = window.open('about:blank', '_blank')
  if (tab) tab.document.write(loadingDocument(doc.title))
  try {
    const url = await getDocumentDownloadUrl(doc.id)
    if (tab) {
      tab.opener = null // sever the opener now that we're done driving the tab
      tab.location.replace(url)
    } else {
      // Pop-up was blocked outright — last-ditch foreground attempt.
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  } catch (e) {
    tab?.close()
    toast.error(`Couldn't open “${doc.title}”: ${(e as Error).message}`)
  }
}

/** Force a local save of a file upload (Content-Disposition: attachment), with a
 *  toast so the user actually sees the download happen. A no-op for a web clip —
 *  it has no uploaded file (open its origin page instead). */
export async function downloadDocumentSource(doc: DocumentOut): Promise<void> {
  if (doc.source_url) return
  const toastId = toast.loading(`Preparing “${doc.title}”…`)
  try {
    const url = await getDocumentDownloadUrl(doc.id, { download: true })
    const a = document.createElement('a')
    a.href = url
    a.rel = 'noreferrer'
    document.body.appendChild(a)
    a.click()
    a.remove()
    toast.success(`Downloading “${doc.title}”`, { id: toastId })
  } catch (e) {
    toast.error(`Couldn't download “${doc.title}”: ${(e as Error).message}`, {
      id: toastId,
    })
  }
}
