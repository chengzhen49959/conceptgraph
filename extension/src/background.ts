// All four entry points open the docked side panel:
//  - toolbar icon  → openPanelOnActionClick (native, set below)
//  - keyboard shortcut → the reserved `_execute_action` command, which also rides
//    openPanelOnActionClick (a named command can't open the panel cleanly — open()
//    needs a windowId/tabId, and fetching one is async, which drops the gesture)
//  - right-click context menu → chrome.sidePanel.open() from the click gesture
//  - in-page floating button (content/fab.ts) → relayed here via OPEN_PANEL; a port it
//    opens on pointerdown keeps this worker warm so open() lands inside the gesture
const MENU_ID = 'clip-to-graph'

// Runs on every service-worker start (not only onInstalled — the worker can be torn
// down and restarted), so clicking the toolbar icon always opens the panel.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {})

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Clip to graph',
    contexts: ['page', 'selection'],
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID || tab?.id == null) return
  // open() MUST be called synchronously inside the click gesture — putting any
  // `await` before it drops the user gesture and Chrome rejects the call. So open
  // first (fire-and-forget), then stash the scope. The panel reads invokeScope on
  // mount, which happens long after this tiny storage write lands.
  void chrome.sidePanel.open({ tabId: tab.id })
  void chrome.storage.session.set({
    invokeScope: info.selectionText ? 'selection' : 'page',
  })
})

// The floating button connects this port on pointerdown. It carries no messages — its
// only job is to wake this worker and hold it alive for the press, so the OPEN_PANEL
// below reaches a running worker. A worker cold-started by OPEN_PANEL itself opens too
// late (the user-gesture flag lapses during startup and sidePanel.open() is rejected),
// which made FAB clicks intermittent; the port makes them as reliable as the menu path.
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'fab-keepalive') return
  // An open port is enough to keep the worker warm; nothing else to do.
})

// In-page floating button (content/fab.ts). The click happens in the page, so it's
// relayed here: a content script can't call sidePanel.open(). open() runs synchronously
// (no await before it) to stay inside the user gesture, and the fab-keepalive port above
// guarantees this worker is already running when the message lands. The .catch surfaces
// the gesture-rejection error instead of letting a failed open() vanish silently.
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type !== 'OPEN_PANEL' || sender.tab?.id == null) return
  chrome.sidePanel
    .open({ tabId: sender.tab.id })
    .catch((e) => console.error('[graph-clipper] sidePanel.open failed', e))
  void chrome.storage.session.set({ invokeScope: msg.scope === 'selection' ? 'selection' : 'page' })
})
