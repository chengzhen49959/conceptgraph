import { createRoot } from 'react-dom/client'
import { useEffect, useMemo, useState } from 'react'
import { type ExtractResult, type ExtractScope } from '../content/extract'
import { listWorkspaces, createWorkspace, clip, type Workspace } from '../api/client'
import { getIdToken, openAppLogin, NotLoggedInError } from '../auth/cognito'
import { APP_ORIGIN } from '../config'
import { Markdown } from './Markdown'
import './sidepanel.css'

const LAST_WS_KEY = 'lastWorkspaceId'
// Soft warning threshold: above this the clip still works, but ingestion (one LLM
// call per ~512-token chunk) is slow. The backend hard-rejects far higher.
const LONG_CLIP_CHARS = 50_000

async function activeTabId(): Promise<number | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab?.id
}

async function runExtract(tabId: number, scope: ExtractScope): Promise<ExtractResult> {
  // Inject the content bundle (idempotent — it self-guards against double-load),
  // then ask it to extract. activeTab grants the host access for this gesture.
  await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] })
  return (await chrome.tabs.sendMessage(tabId, { type: 'EXTRACT', scope })) as ExtractResult
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function App() {
  const [tabId, setTabId] = useState<number | undefined>()
  const [scope, setScope] = useState<ExtractScope>('page')
  const [extract, setExtract] = useState<ExtractResult | null>(null)
  const [extracting, setExtracting] = useState(true)
  const [title, setTitle] = useState('')

  const [authed, setAuthed] = useState<boolean | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [wsLoading, setWsLoading] = useState(true)
  // Selected destination — always a real workspace id once the list loads. The
  // personal workspace is one of the listed rows (type === 'private'), not a
  // separate "undefined" case, so there's no longer a duplicate "Personal" entry.
  const [wsId, setWsId] = useState<string | undefined>()
  const [wsFilter, setWsFilter] = useState('')
  const [newWsName, setNewWsName] = useState('')
  const [creating, setCreating] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ workspaceId?: string; duplicate?: boolean } | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      // Load the workspace list in parallel with extraction — they're independent,
      // and serializing them (load *after* extract) was why the destination list
      // popped in late, a visible "jump" once the preview had already rendered.
      const auth = loadAuth()
      const id = await activeTabId()
      setTabId(id)
      const { invokeScope } = await chrome.storage.session.get('invokeScope')
      const initial: ExtractScope = invokeScope === 'selection' ? 'selection' : 'page'
      setScope(initial)
      await chrome.storage.session.remove('invokeScope')
      if (id != null) await doExtract(id, initial)
      await auth
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The side panel is one persistent page — it does NOT re-mount when the user
  // switches tabs or re-opens the panel on a different tab. Without this it kept
  // showing (and re-clipping) the page it was first opened on; every arxiv tab
  // shares the host "arxiv.org", so the stale source line gave no hint and the
  // re-clip silently de-duped server-side instead of saving the new paper. Re-read
  // whatever tab is active now whenever the active tab changes or navigates, so
  // Clip always submits the page in front of the user.
  useEffect(() => {
    if (!chrome.tabs?.onActivated) return
    let myWindowId: number | undefined
    void chrome.windows.getCurrent().then((w) => {
      myWindowId = w.id
    })
    async function reExtractActive() {
      const id = await activeTabId()
      if (id == null) return
      setTabId(id)
      void doExtract(id, scope)
    }
    const onActivated = (info: chrome.tabs.TabActiveInfo) => {
      if (myWindowId != null && info.windowId !== myWindowId) return
      void reExtractActive()
    }
    const onUpdated = (
      _tabId: number,
      change: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab,
    ) => {
      // Only a real navigation of the foreground tab in this window — not every
      // loading tick, and not a background window's churn.
      if (!change.url || !tab.active) return
      if (myWindowId != null && tab.windowId !== myWindowId) return
      void reExtractActive()
    }
    chrome.tabs.onActivated.addListener(onActivated)
    chrome.tabs.onUpdated.addListener(onUpdated)
    return () => {
      chrome.tabs.onActivated.removeListener(onActivated)
      chrome.tabs.onUpdated.removeListener(onUpdated)
    }
    // doExtract reads only stable setters; scope is the one value to keep fresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope])

  async function loadAuth() {
    setWsLoading(true)
    try {
      await getIdToken()
      setAuthed(true)
      const ws = await listWorkspaces()
      setWorkspaces(ws)
      // Pre-select the last-used workspace if it still exists, else the personal
      // one (the sole type === 'private' row — everything created is 'shared').
      const personal = ws.find((w) => w.type === 'private') ?? ws[0]
      const { [LAST_WS_KEY]: last } = await chrome.storage.local.get(LAST_WS_KEY)
      setWsId(last && ws.some((w) => w.id === last) ? last : personal?.id)
    } catch (e) {
      if (e instanceof NotLoggedInError) setAuthed(false)
      else {
        setAuthed(true)
        setError((e as Error).message)
      }
    } finally {
      setWsLoading(false)
    }
  }

  async function doExtract(id: number, s: ExtractScope) {
    setExtracting(true)
    setError(null)
    try {
      const r = await runExtract(id, s)
      setExtract(r)
      setTitle(r.title)
    } catch {
      setExtract({
        ok: false,
        title: '',
        text: '',
        sourceUrl: '',
        metadata: {},
        reason: "This page can't be clipped (try a normal article page).",
      })
    } finally {
      setExtracting(false)
    }
  }

  function onScope(s: ExtractScope) {
    setScope(s)
    if (tabId != null) void doExtract(tabId, s)
  }

  // The side panel persists across tab switches; re-read whatever tab is active now
  // (it may be a different page than the one the panel was opened on).
  async function onReExtract() {
    const id = await activeTabId()
    if (id == null) return
    setTabId(id)
    void doExtract(id, scope)
  }

  const filtered = useMemo(
    () => workspaces.filter((w) => w.name.toLowerCase().includes(wsFilter.toLowerCase())),
    [workspaces, wsFilter],
  )

  async function onCreateWorkspace() {
    const name = newWsName.trim()
    if (!name) return
    setCreating(true)
    setError(null)
    try {
      const ws = await createWorkspace(name)
      setWorkspaces((prev) => [ws, ...prev])
      setWsId(ws.id)
      setNewWsName('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setCreating(false)
    }
  }

  async function onSubmit(linkOnly: boolean) {
    if (!extract) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await clip({
        title: title.trim() || extract.sourceUrl,
        content: linkOnly ? '' : extract.text,
        source_url: extract.sourceUrl,
        workspace_id: wsId,
        metadata: extract.metadata,
      })
      await chrome.storage.local.set({ [LAST_WS_KEY]: wsId ?? '' })
      setResult({ workspaceId: wsId, duplicate: res.duplicate })
    } catch (e) {
      if (e instanceof NotLoggedInError) setAuthed(false)
      else setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (authed === false) {
    return (
      <div className="panel">
        <h1>Clip to graph</h1>
        <p className="muted">Sign in to the web app first, then reopen this panel.</p>
        <button className="primary" onClick={openAppLogin}>
          Open sign-in
        </button>
      </div>
    )
  }

  if (result) {
    const url = `${APP_ORIGIN}/dashboard${
      result.workspaceId ? `?workspace=${result.workspaceId}` : ''
    }`
    return (
      <div className="panel">
        <h1>{result.duplicate ? 'Already in your graph ✓' : 'Clipped ✓'}</h1>
        <p className="muted">
          {result.duplicate
            ? 'This page was already clipped into this workspace — opened the existing document instead of adding a duplicate.'
            : 'Added to the ingest pipeline. New nodes appear in the graph once processing finishes (the open app refreshes on its own).'}
        </p>
        <a className="primary link" href={url} target="_blank" rel="noreferrer">
          View in graph
        </a>
        <button
          className="ghost"
          onClick={() => {
            // Re-read the now-active tab, not the one we just clipped — the user has
            // usually switched tabs by the time they reach for the next clip.
            setResult(null)
            void onReExtract()
          }}
        >
          Clip another
        </button>
      </div>
    )
  }

  const canClip = !!extract?.ok && !extracting && !submitting

  return (
    <div className="panel">
      <header className="head">
        <h1>Clip to graph</h1>
        <button className="ghost small" onClick={onReExtract} disabled={extracting}>
          {extracting ? 'Reading…' : 'Re-extract'}
        </button>
      </header>
      {extract?.ok && extract.sourceUrl && (
        <p className="source" title={extract.sourceUrl}>
          {hostnameOf(extract.sourceUrl)}
        </p>
      )}

      <div className="seg">
        <button className={scope === 'page' ? 'on' : ''} onClick={() => onScope('page')}>
          Whole page
        </button>
        <button
          className={scope === 'selection' ? 'on' : ''}
          onClick={() => onScope('selection')}
        >
          Selection
        </button>
      </div>

      <label className="field">
        <span>Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Document title"
        />
      </label>

      <div className="field">
        <span>
          Preview{extract?.ok ? ` · ${extract.text.length.toLocaleString()} chars` : ''}
          {extract?.ok && extract.text.length > LONG_CLIP_CHARS && (
            <span className="warn"> · long page, slower to process</span>
          )}
        </span>
        <div className="preview">
          {extracting ? (
            'Extracting…'
          ) : extract?.ok ? (
            <Markdown text={extract.text} />
          ) : (
            <span className="warn">{extract?.reason ?? 'Nothing to clip.'}</span>
          )}
        </div>
      </div>

      <div className="field">
        <span>Destination</span>
        {/* Search only earns its space once the list is long; for a handful of
            workspaces it's noise that pushes the options out of view. */}
        {workspaces.length > 6 && (
          <input
            className="search"
            value={wsFilter}
            onChange={(e) => setWsFilter(e.target.value)}
            placeholder="Search workspaces…"
          />
        )}
        <div className="ws-list" role="radiogroup" aria-label="Choose a workspace">
          {wsLoading && workspaces.length === 0 ? (
            // Reserve the list's space while it loads so the panel doesn't reflow
            // when the workspaces arrive — the old "jump" the user saw.
            <>
              <div className="ws-skel" />
              <div className="ws-skel" />
              <div className="ws-skel" />
            </>
          ) : filtered.length === 0 ? (
            <div className="ws-empty">
              {wsFilter ? `No workspaces match “${wsFilter}”.` : 'No workspaces yet.'}
            </div>
          ) : (
            filtered.map((w) => {
              const selected = wsId === w.id
              return (
                <button
                  key={w.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={selected ? 'ws on' : 'ws'}
                  onClick={() => setWsId(w.id)}
                >
                  <span className="ws-dot" aria-hidden="true" />
                  <span className="ws-name">{w.name}</span>
                  {w.type === 'private' && <span className="ws-tag">Default</span>}
                </button>
              )
            })
          )}
        </div>
        <div className="newws">
          <input
            value={newWsName}
            onChange={(e) => setNewWsName(e.target.value)}
            placeholder="+ New workspace name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void onCreateWorkspace()
            }}
          />
          <button onClick={onCreateWorkspace} disabled={creating || !newWsName.trim()}>
            {creating ? '…' : 'Create'}
          </button>
        </div>
      </div>

      {error && <p className="warn">{error}</p>}

      <div className="actions">
        {extract && !extract.ok && (
          <button className="ghost" disabled={submitting} onClick={() => onSubmit(true)}>
            Save link only
          </button>
        )}
        <button className="primary" disabled={!canClip} onClick={() => onSubmit(false)}>
          {submitting ? 'Clipping…' : 'Clip'}
        </button>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
