# Graph Clipper (Chrome extension)

Clip the current web page's main content — as **Markdown**, with headings, links,
lists, tables and code preserved — into your concept graph. Click the toolbar icon
(the in-page **floating button**, right-click → **Clip to graph**, or press the
shortcut), preview the rendered content, pick or create a destination workspace,
and confirm. The clip goes through
the **same** backend ingest pipeline as an uploaded document, tagged with the page
URL (and scraped page metadata), so its concepts merge and de-duplicate across
everything in the workspace. Re-clipping a page already in the workspace returns the
existing document instead of a duplicate.

Single page, user-triggered. No automatic crawling. No AI runs in the extension —
main-content extraction (Mozilla Readability → Turndown Markdown) and light page-
metadata scraping are the only client-side steps; all embedding/LLM/clustering
stays in the backend.

## How it fits the existing app

| Concern | Mechanism |
| --- | --- |
| Auth | Reuses the web app's **Cognito** session — reads the id token cookie on the app origin, refreshes via Cognito when near expiry. No second login. |
| Target | A single **workspace** (the app's "project" == one graph). Pick an existing one or create a new one inline. |
| Ingest | `POST /api/imports/clip` → backend de-dups by canonical URL, writes the Markdown to S3, and enqueues the existing `ingest_document` worker. Oversized pages are rejected. |
| Graph update | None pushed from here. The open web app polls and shows new nodes ~2.5s after the document finishes processing. |

## Build

```bash
cd extension
npm install
npm run build          # localhost dev defaults → extension/dist/
```

Point at a deployed stack with env vars (see `.env.example`):

```bash
APP_ORIGIN=https://app.example.com \
API_BASE=https://api.example.com \
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx \
COGNITO_CLIENT_ID=your-app-client-id \
npm run build:prod
```

For local dev, `COGNITO_USER_POOL_ID` / `COGNITO_CLIENT_ID` should match the web
app's `NEXT_PUBLIC_COGNITO_*` values (needed only for the token-refresh call).

## Load it

1. `chrome://extensions` → enable **Developer mode** → **Load unpacked** →
   select `extension/dist`.
2. The `key` in `manifest.json` pins the extension ID to
   **`bknaciplmhinobiglpkofbimbfamflpg`**, so the id stays stable across reloads.

## Backend CORS (one-time)

The backend must allow this extension's origin. Set in `backend/.env.local`:

```
EXTENSION_ORIGINS=chrome-extension://bknaciplmhinobiglpkofbimbfamflpg
```

(Comma-separate if you ship more than one build/id.) Restart the API after editing.

## Use

1. Open an article / blog / docs / paper page.
2. Toolbar icon, right-click **Clip to graph**, or `Ctrl/Cmd+Shift+S`.
3. Toggle **Whole page** / **Selection**, edit the title, pick/create a workspace.
4. **Clip** → "View in graph" opens the workspace; the node appears once ingest
   finishes. Re-clipping the **same** page returns the existing document (no
   duplicate); a **related** page merges concepts (mention count goes up) rather
   than duplicating nodes.

If extraction fails on an unusual page, use **Save link only** to record the URL
without body text.

## Notes / limits

- The clipper is a docked **side panel** (Chrome ≥ 114). The toolbar icon, the
  `Ctrl/Cmd+Shift+S` shortcut, the right-click **Clip to graph** entry, and the
  in-page **floating button** all open it through `chrome.sidePanel` (opening from
  the menu/shortcut/button needs a recent Chrome). The panel stays open across tab
  switches — hit **Re-extract** to read whatever tab is active now.
- The **floating button** (`content/fab.ts`) is auto-injected on every http(s) page
  as a draggable round button (Shadow-DOM isolated, so it can't clash with page CSS).
  Click it to open the panel for the current page — **selection** scope if text is
  highlighted, else **page**, same as the menu. Drag it vertically to reposition
  (saved); hover and hit **×** to dismiss it for the current page (it returns on the
  next reload — there's no persistent hide). A content script can't call
  `chrome.sidePanel.open()`, so the click is relayed to the background. A service
  worker cold-started by that message would open the panel too late — the user-gesture
  flag lapses during startup and `open()` is rejected (this is why the button used to
  open only *sometimes*, while the right-click menu always worked) — so pressing the
  button first opens a `fab-keepalive` port that warms the worker, and the panel then
  opens reliably inside the gesture.
- The preview is rendered rich text — headings, lists, tables, code, and KaTeX
  math — not raw Markdown. The full document is always clipped (the preview is the
  whole thing, not a truncation).
- No custom toolbar icon is bundled yet (Chrome shows a default). Add `icons` +
  `action.default_icon` to `manifest.json` before publishing to the Web Store.
- You must be signed in to the web app at `APP_ORIGIN` at least once so the
  Cognito session cookie exists for the extension to reuse.
