import {
  StrictMode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { useApp, useHostStyles } from "@modelcontextprotocol/ext-apps/react";

import { GraphView } from "./GraphView";
import type { ConceptDetail, GraphData } from "./types";

/** Measure a container so the canvas can fill it (ResizeObserver-backed). */
function useSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

type Mode = "search" | "ask";
type DisplayMode = "inline" | "fullscreen" | "pip";

// Default inline height (px). The app reports this to the host via auto-resize;
// the host grows the frame to it (capped at the host's max). Without an explicit
// height the content collapses to the host's ~250px default. Fullscreen mode
// switches the shell to 100vh.
const INLINE_H = 640;

function Root() {
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConceptDetail | null>(null);
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const workspaceRef = useRef<string | undefined>(undefined);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("inline");
  // undefined = host hasn't told us yet (show the button optimistically);
  // false = host confirmed fullscreen isn't available (hide it).
  const [canFullscreen, setCanFullscreen] = useState<boolean | undefined>(undefined);

  const { app, isConnected, error } = useApp({
    appInfo: { name: "Concept Graph", version: "1.0.0" },
    capabilities: {},
    // Register handlers before the init handshake so the first tool-result isn't missed.
    onAppCreated: (a) => {
      a.ontoolresult = (res: { structuredContent?: unknown }) => {
        if (res?.structuredContent) setGraph(res.structuredContent as GraphData);
      };
      a.ontoolinput = (p: { arguments?: Record<string, unknown> }) => {
        const wid = p?.arguments?.workspace_id;
        if (typeof wid === "string") workspaceRef.current = wid;
      };
      // Track the host's display mode + whether it offers fullscreen.
      a.onhostcontextchanged = (ctx) => {
        if (ctx.displayMode) setDisplayMode(ctx.displayMode);
        if (ctx.availableDisplayModes)
          setCanFullscreen(ctx.availableDisplayModes.includes("fullscreen"));
      };
    },
  });
  useHostStyles(app);

  // Fallback: if the host didn't push a show_graph result, fetch the graph ourselves.
  useEffect(() => {
    if (!app || !isConnected || graph) return;
    app
      .callServerTool({ name: "graph_get", arguments: { workspace_id: workspaceRef.current } })
      .then((r: { structuredContent?: unknown }) => {
        if (r?.structuredContent) setGraph(r.structuredContent as GraphData);
      })
      .catch(() => {});
  }, [app, isConnected, graph]);

  // Load the selected concept's detail (description, aliases, docs, passages).
  useEffect(() => {
    if (!app || !selectedId) {
      setDetail(null);
      return;
    }
    let alive = true;
    app
      .callServerTool({
        name: "concept_get",
        arguments: { concept_id: selectedId, include_passages: true },
      })
      .then((r: { structuredContent?: unknown }) => {
        if (alive && r?.structuredContent) setDetail(r.structuredContent as ConceptDetail);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [app, selectedId]);

  const run = useCallback(async () => {
    if (!app || !query.trim() || busy) return;
    setBusy(true);
    setAnswer(null);
    try {
      if (mode === "search") {
        const r: { structuredContent?: { concepts?: { id: string }[] } } =
          await app.callServerTool({
            name: "memory_search",
            arguments: { query, workspace_id: workspaceRef.current },
          });
        setHighlighted(new Set((r.structuredContent?.concepts ?? []).map((c) => c.id)));
        setSelectedId(null);
      } else {
        const r: {
          structuredContent?: { answer?: string; cited_concept_ids?: string[] };
        } = await app.callServerTool({
          name: "memory_ask",
          arguments: { question: query, workspace_id: workspaceRef.current },
        });
        setAnswer(r.structuredContent?.answer ?? "(no answer)");
        setHighlighted(new Set(r.structuredContent?.cited_concept_ids ?? []));
      }
    } catch (e) {
      setAnswer(`Error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }, [app, query, mode, busy]);

  const toggleFullscreen = useCallback(async () => {
    if (!app) return;
    const target: DisplayMode = displayMode === "fullscreen" ? "inline" : "fullscreen";
    try {
      const r = await app.requestDisplayMode({ mode: target });
      setDisplayMode(r.mode);
      // Host ignored the fullscreen request -> it isn't supported; hide the button.
      if (target === "fullscreen" && r.mode !== "fullscreen") setCanFullscreen(false);
    } catch {
      setCanFullscreen(false);
    }
  }, [app, displayMode]);

  const [canvasRef, size] = useSize<HTMLDivElement>();

  return (
    <div style={{ ...S.shell, height: displayMode === "fullscreen" ? "100vh" : INLINE_H }}>
      <div ref={canvasRef} style={S.canvas}>
        {canFullscreen !== false && (
          <button
            onClick={toggleFullscreen}
            style={S.expandBtn}
            title={displayMode === "fullscreen" ? "Collapse" : "Expand"}
          >
            {displayMode === "fullscreen" ? "⤡ Collapse" : "⤢ Expand"}
          </button>
        )}
        {graph ? (
          <GraphView
            data={graph}
            width={size.w}
            height={size.h}
            selectedId={selectedId}
            highlighted={highlighted}
            onSelect={setSelectedId}
          />
        ) : (
          <div style={S.placeholder}>
            {error ? `Connection error: ${error.message}` : "Loading graph…"}
          </div>
        )}
      </div>

      <aside style={S.panel}>
        <div style={S.tabs}>
          {(["search", "ask"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{ ...S.tab, ...(mode === m ? S.tabActive : {}) }}
            >
              {m === "search" ? "Search" : "Ask"}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === "search" ? "Find concepts…" : "Ask your library…"}
            style={S.input}
          />
        </form>

        {busy && <div style={S.muted}>Working…</div>}

        {mode === "ask" && answer && (
          <div style={S.answer}>{answer}</div>
        )}

        {detail ? (
          <ConceptPanel detail={detail} />
        ) : (
          <div style={S.muted}>
            {graph
              ? `${graph.nodes.length} concepts · ${graph.links.length} links · ${graph.clusters.length} topics. Click a node for detail.`
              : null}
          </div>
        )}
      </aside>
    </div>
  );
}

function ConceptPanel({ detail }: { detail: ConceptDetail }) {
  return (
    <div style={S.detail}>
      <h2 style={S.h2}>{detail.name}</h2>
      <div style={S.meta}>
        {detail.cluster_label ? `${detail.cluster_label} · ` : ""}
        {detail.mentions} mentions · degree {detail.degree}
      </div>
      {detail.description && <p style={S.desc}>{detail.description}</p>}
      {detail.aliases.length > 0 && (
        <div style={S.muted}>aka {detail.aliases.join(", ")}</div>
      )}
      {detail.documents.length > 0 && (
        <div style={S.section}>
          <div style={S.sectionTitle}>Documents</div>
          {detail.documents.map((d) => (
            <div key={d.document_id} style={S.docRow}>
              {d.title}
            </div>
          ))}
        </div>
      )}
      {detail.passages && detail.passages.length > 0 && (
        <div style={S.section}>
          <div style={S.sectionTitle}>Passages</div>
          {detail.passages.slice(0, 6).map((p) => (
            <div key={p.chunk_id} style={S.passage}>
              {p.content.slice(0, 280)}
              {p.content.length > 280 ? "…" : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Inline styles keep the bundle a single self-contained file. Colours lean dark;
// useHostStyles overlays the host's theme variables where available.
const S: Record<string, React.CSSProperties> = {
  shell: { display: "flex", width: "100%", background: "#16161e", color: "#c0caf5" },
  canvas: { flex: 1, position: "relative", minWidth: 0 },
  expandBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 5,
    padding: "5px 10px",
    fontSize: 12,
    background: "#1f1f2e",
    color: "#c0caf5",
    border: "1px solid #2a2a37",
    borderRadius: 6,
    cursor: "pointer",
  },
  placeholder: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    fontSize: 14,
  },
  panel: {
    width: 320,
    borderLeft: "1px solid #2a2a37",
    padding: "14px 16px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    boxSizing: "border-box",
  },
  tabs: { display: "flex", gap: 6 },
  tab: {
    flex: 1,
    padding: "6px 0",
    background: "#1f1f2e",
    color: "#9aa0b5",
    border: "1px solid #2a2a37",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
  },
  tabActive: { background: "#2d2d44", color: "#c0caf5" },
  input: {
    width: "100%",
    padding: "8px 10px",
    background: "#1a1a25",
    color: "#c0caf5",
    border: "1px solid #2a2a37",
    borderRadius: 6,
    fontSize: 13,
    boxSizing: "border-box",
  },
  muted: { color: "#6b7280", fontSize: 12, lineHeight: 1.5 },
  answer: {
    background: "#1a1a25",
    border: "1px solid #2a2a37",
    borderRadius: 6,
    padding: 10,
    fontSize: 13,
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
  },
  detail: { display: "flex", flexDirection: "column", gap: 8 },
  h2: { margin: 0, fontSize: 16, color: "#e0e3f0" },
  meta: { fontSize: 12, color: "#7aa2f7" },
  desc: { margin: 0, fontSize: 13, lineHeight: 1.55 },
  section: { marginTop: 4 },
  sectionTitle: { fontSize: 11, textTransform: "uppercase", color: "#6b7280", marginBottom: 4 },
  docRow: { fontSize: 12, padding: "2px 0", color: "#9ece6a" },
  passage: {
    fontSize: 12,
    lineHeight: 1.5,
    color: "#a9b1d6",
    padding: "6px 0",
    borderTop: "1px solid #222231",
  },
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
