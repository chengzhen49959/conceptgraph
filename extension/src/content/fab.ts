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

// 3-node graph glyph. Solid fill so its alpha drives the CSS mask; the visible colour
// comes from the masked element's background, not from here.
const ICON_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>" +
  "<g stroke='black' stroke-width='1.6' stroke-linecap='round'>" +
  "<line x1='6' y1='7' x2='18' y2='6'/><line x1='18' y1='6' x2='14' y2='18'/>" +
  "<line x1='6' y1='7' x2='14' y2='18'/></g>" +
  "<g fill='black'><circle cx='6' cy='7' r='2.4'/><circle cx='18' cy='6' r='2.4'/>" +
  "<circle cx='14' cy='18' r='2.4'/></g></svg>"
const ICON_URL = `url("data:image/svg+xml,${encodeURIComponent(ICON_SVG)}")`

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
.glyph { width: 24px; height: 24px; background: #fff;
  -webkit-mask: ${ICON_URL} center / contain no-repeat; mask: ${ICON_URL} center / contain no-repeat; }
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
