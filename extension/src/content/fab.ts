// Floating clip button — a fourth, in-page entry point to the clipper, alongside
// the toolbar icon, the Cmd/Ctrl+Shift+S shortcut, and the right-click menu.
//
// Why a *declared* content script (unlike extract.ts, which the panel injects on
// demand): the button has to be present on the page with no prior trigger, so the
// manifest auto-injects this on every http(s) top frame. Clicking it can't open the
// side panel itself — chrome.sidePanel.open() runs only in an extension context and
// must stay inside the user gesture — so the click is relayed to the background,
// which owns the open() call. That mirrors the context-menu path in background.ts,
// so the FAB and the right-click menu share one open()+invokeScope code path.
//
// Isolation: the whole widget lives in a closed Shadow DOM, so the host page's CSS
// can't restyle it and ours can't leak onto the page. The icon is painted with a CSS
// mask (data-URI SVG), never innerHTML, so pages enforcing Trusted Types (e.g. Google)
// don't throw on an injection-sink assignment.
//
// The button drags vertically (right-pinned, position persisted) and can be dismissed
// for the current page (× returns it on the next reload — no persistent hide, which
// was a trap with no in-UI way back). Click vs. drag is told apart by a movement threshold.

const HOST_ID = 'graph-clipper-fab-host'
const TOP_KEY = 'fabTop' // persisted vertical offset (px from viewport top)
const SIZE = 46 // button diameter, px
const MARGIN = 18 // min gap from any viewport edge, px
const DRAG_THRESHOLD = 4 // px of movement before a press counts as a drag, not a click

// The app's orb brand mark, inlined as a data-URI PNG. Same self-contained
// approach as the old SVG glyph (no innerHTML, so it stays Trusted-Types safe),
// but painted as a background-image rather than a CSS mask so the orb keeps its
// own tones instead of being recoloured by the element background.
const ICON_URL = `url("data:image/png;base64,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")`

const STYLE = `
.wrap { position: fixed; right: ${MARGIN}px; width: ${SIZE}px; height: ${SIZE}px; pointer-events: auto; }
.fab {
  width: 100%; height: 100%; border: 0; border-radius: 50%; padding: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center; touch-action: none;
  background: #4f46e5; color: #fff; -webkit-tap-highlight-color: transparent;
  box-shadow: 0 4px 14px rgba(0,0,0,.28), 0 0 0 1px rgba(255,255,255,.08);
  transition: transform .15s ease, background .15s ease, box-shadow .15s ease;
}
.fab:hover { background: #4338ca; transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0,0,0,.34), 0 0 0 1px rgba(255,255,255,.12); }
.fab:active { transform: scale(.96); }
.glyph { width: 36px; height: 36px; background: ${ICON_URL} center / contain no-repeat; }
.close {
  position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; padding: 0;
  border: 0; border-radius: 50%; cursor: pointer; background: #111827; color: #fff;
  font: 600 13px/1 system-ui, sans-serif; display: none; align-items: center; justify-content: center;
  box-shadow: 0 1px 4px rgba(0,0,0,.4);
}
.wrap:hover .close { display: flex; }
.tip {
  position: absolute; right: ${SIZE + 12}px; top: 50%; transform: translateY(-50%);
  white-space: nowrap; background: #111827; color: #fff; pointer-events: none;
  font: 600 12px/1.3 system-ui, sans-serif; padding: 7px 10px; border-radius: 7px;
  box-shadow: 0 2px 10px rgba(0,0,0,.4);
}
@media (prefers-reduced-motion: reduce) {
  .fab { transition: none; } .fab:hover, .fab:active { transform: none; }
}`

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)
const maxTop = () => Math.max(MARGIN, window.innerHeight - SIZE - MARGIN)

// chrome.runtime is wiped from a content script whose extension was reloaded or
// auto-updated — the page's already-injected copy is orphaned, and any chrome.* call
// on it throws "Cannot read properties of undefined (reading 'sendMessage')". A page
// reload re-injects a live copy; until then every entry point must no-op, not throw.
const runtimeAlive = () => !!chrome.runtime?.id

// Open the clipper for the current page; 'selection' when text is highlighted, else
// 'page' — same rule the context menu uses. sendMessage carries the click gesture to
// the background so its sidePanel.open() is allowed.
function triggerClip() {
  if (!runtimeAlive()) return
  const sel = window.getSelection()
  const scope = sel && sel.toString().trim() ? 'selection' : 'page'
  void chrome.runtime.sendMessage({ type: 'OPEN_PANEL', scope }).catch(() => {})
}

async function mount() {
  // Top frame only, and never twice on one page.
  if (window.top !== window.self) return
  // Orphaned at injection time (extension mid-reload/update) — every chrome.* call below,
  // starting with storage.local.get, would throw on the wiped runtime. Skip building a
  // button that couldn't reach the worker anyway; a page reload re-injects a live copy.
  // Guard before the __graphClipperFab flag so a later live injection can still mount.
  if (!runtimeAlive()) return
  const flagged = window as unknown as { __graphClipperFab?: boolean }
  if (flagged.__graphClipperFab || document.getElementById(HOST_ID)) return
  flagged.__graphClipperFab = true

  const store = await chrome.storage.local.get(TOP_KEY)

  const host = document.createElement('div')
  host.id = HOST_ID
  // `all: initial` walls off inherited page styles; the box itself is inert (the
  // fixed-positioned .wrap inside re-enables pointer events on just the button).
  // Max z-index so the button rides above the page's own stacked overlays/headers;
  // it must come *after* `all: initial`, which resets z-index back to auto.
  host.style.cssText =
    'all: initial; position: fixed; inset: 0; width: 0; height: 0; pointer-events: none; z-index: 2147483647;'
  const shadow = host.attachShadow({ mode: 'closed' })

  const style = document.createElement('style')
  style.textContent = STYLE

  const wrap = document.createElement('div')
  wrap.className = 'wrap'
  const saved = store[TOP_KEY]
  const initialTop = typeof saved === 'number' ? saved : maxTop() - 60 // default: low-right
  wrap.style.top = `${clamp(initialTop, MARGIN, maxTop())}px`

  const fab = document.createElement('button')
  fab.type = 'button'
  fab.className = 'fab'
  fab.title = 'Clip to graph'
  fab.setAttribute('aria-label', 'Clip to graph')
  const glyph = document.createElement('span')
  glyph.className = 'glyph'
  glyph.setAttribute('aria-hidden', 'true')
  fab.appendChild(glyph)

  const close = document.createElement('button')
  close.type = 'button'
  close.className = 'close'
  close.textContent = '×'
  close.title = 'Hide (returns on refresh)'
  close.setAttribute('aria-label', 'Hide the clip button until the page reloads')

  wrap.append(fab, close)
  shadow.append(style, wrap)
  document.documentElement.appendChild(host)

  // Drag (vertical) vs. click, told apart by DRAG_THRESHOLD. preventDefault on the
  // press keeps the page's text selection intact (so 'selection' scope survives) and
  // stops the button stealing focus.
  let dragging = false
  let moved = false
  let startY = 0
  let startTop = 0
  // Held only while the button is pressed. Opening the side panel has to happen in the
  // background worker (a content script can't), but a worker woken by the pointerup
  // OPEN_PANEL message starts too late: chrome.sidePanel.open() then throws "may only
  // be called in response to a user gesture" because the gesture flag lapses during the
  // worker's cold start. That race is why FAB-open was intermittent while the right-click
  // menu (a gesture delivered straight to the worker) always worked. Connecting a port on
  // pointerdown wakes the worker and keeps it warm for the whole press, so the pointerup
  // open() reaches a live worker inside the gesture window.
  let keepAlive: chrome.runtime.Port | null = null
  const dropKeepAlive = () => {
    try {
      keepAlive?.disconnect()
    } catch {
      /* context already gone */
    }
    keepAlive = null
  }
  // Shown when the button is clicked after its extension was reloaded/updated: the
  // orphaned content script can't reach the worker, and only a page reload fixes it.
  let hint: HTMLDivElement | null = null
  const showReloadHint = () => {
    if (hint) return
    hint = document.createElement('div')
    hint.className = 'tip'
    hint.textContent = 'Clipper updated — reload the page'
    wrap.appendChild(hint)
    setTimeout(() => {
      hint?.remove()
      hint = null
    }, 2800)
  }
  fab.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    dragging = true
    moved = false
    startY = e.clientY
    startTop = parseFloat(wrap.style.top) || 0
    fab.setPointerCapture(e.pointerId)
    if (runtimeAlive()) {
      try {
        keepAlive = chrome.runtime.connect({ name: 'fab-keepalive' })
      } catch {
        /* worker unreachable — open() still works if it happens to be warm already */
      }
    }
  })
  fab.addEventListener('pointermove', (e) => {
    if (!dragging) return
    const dy = e.clientY - startY
    if (Math.abs(dy) > DRAG_THRESHOLD) moved = true
    if (moved) wrap.style.top = `${clamp(startTop + dy, MARGIN, maxTop())}px`
  })
  fab.addEventListener('pointerup', (e) => {
    if (!dragging) return
    dragging = false
    try {
      fab.releasePointerCapture(e.pointerId)
    } catch {
      /* capture may already be gone */
    }
    dropKeepAlive()
    // Orphaned (extension reloaded/updated) → every chrome.* call would throw; tell the
    // user the one thing that fixes it instead of dying with an uncaught TypeError.
    if (!runtimeAlive()) {
      showReloadHint()
      return
    }
    if (moved) void chrome.storage.local.set({ [TOP_KEY]: parseFloat(wrap.style.top) })
    else triggerClip()
  })
  // Press interrupted (e.g. the OS stole the pointer) — release the keep-alive too.
  fab.addEventListener('pointercancel', () => {
    dragging = false
    dropKeepAlive()
  })

  // Dismiss for this page load only — no persistence, so a refresh brings it back.
  close.addEventListener('click', (e) => {
    e.stopPropagation()
    host.remove()
  })

  window.addEventListener('resize', () => {
    wrap.style.top = `${clamp(parseFloat(wrap.style.top) || 0, MARGIN, maxTop())}px`
  })
}

void mount()
