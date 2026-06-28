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

type DisplayMode = "inline" | "fullscreen" | "pip";

// Default inline height (px). The app reports this to the host via auto-resize;
// the host grows the frame to it (capped at the host's max). Without an explicit
// height the content collapses to the host's ~250px default. Fullscreen mode
// switches the shell to 100vh.
const INLINE_H = 640;

// The host (Claude) IS the agent: it does search / Q&A itself by calling the
// memory_search / memory_ask tools from chat. So this App is purely the visual
// graph — the only in-app interaction is clicking a node to inspect it.
function Root() {
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConceptDetail | null>(null);
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
            onSelect={setSelectedId}
          />
        ) : (
          <div style={S.placeholder}>
            {error ? `Connection error: ${error.message}` : "Loading graph…"}
          </div>
        )}
        {graph && (
          <div style={S.stats}>
            {graph.nodes.length} concepts · {graph.links.length} links ·{" "}
            {graph.clusters.length} topics · click a node for detail
          </div>
        )}
      </div>

      {selectedId && (
        <aside style={S.panel}>
          <button onClick={() => setSelectedId(null)} style={S.close} title="Close">
            ✕
          </button>
          {detail ? <ConceptPanel detail={detail} /> : <div style={S.muted}>Loading…</div>}
        </aside>
      )}
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
  stats: {
    position: "absolute",
    left: 10,
    bottom: 8,
    fontSize: 11,
    color: "#6b7280",
    pointerEvents: "none",
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
  close: {
    alignSelf: "flex-end",
    background: "transparent",
    color: "#6b7280",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    padding: 0,
    lineHeight: 1,
  },
  muted: { color: "#6b7280", fontSize: 12, lineHeight: 1.5 },
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
