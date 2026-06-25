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
  const [wsId, setWsId] = useState<string | undefined>() // undefined → personal workspace
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
      const id = await activeTabId()
      setTabId(id)
      const { invokeScope } = await chrome.storage.session.get('invokeScope')
      const initial: ExtractScope = invokeScope === 'selection' ? 'selection' : 'page'
      setScope(initial)
      await chrome.storage.session.remove('invokeScope')
      if (id != null) await doExtract(id, initial)
      await loadAuth()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadAuth() {
    try {
      await getIdToken()
      setAuthed(true)
      const ws = await listWorkspaces()
      setWorkspaces(ws)
      const { [LAST_WS_KEY]: last } = await chrome.storage.local.get(LAST_WS_KEY)
      if (last && ws.some((w) => w.id === last)) setWsId(last)
    } catch (e) {
      if (e instanceof NotLoggedInError) setAuthed(false)
      else {
        setAuthed(true)
        setError((e as Error).message)
      }
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
        <button className="ghost" onClick={() => setResult(null)}>
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
        <input
          className="search"
          value={wsFilter}
          onChange={(e) => setWsFilter(e.target.value)}
          placeholder="Search workspaces…"
        />
        <div className="ws-list">
          <button
            className={wsId === undefined ? 'ws on' : 'ws'}
            onClick={() => setWsId(undefined)}
          >
            Personal workspace
          </button>
          {filtered.map((w) => (
            <button
              key={w.id}
              className={wsId === w.id ? 'ws on' : 'ws'}
              onClick={() => setWsId(w.id)}
            >
              {w.name}
            </button>
          ))}
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
