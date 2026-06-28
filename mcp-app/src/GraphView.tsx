import { useCallback, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";

import { clusterColorMap } from "./cluster-color";
import type { GraphData, GraphNode } from "./types";

type FGNode = GraphNode & { x?: number; y?: number };

const SELECTED_COLOR = "#e0af68";

/**
 * A lean force-directed concept graph — a subset of the web app's GraphCanvas:
 * dots sized by degree, coloured by cluster, with directional relation arrows.
 * When `highlighted` is non-empty, non-matching nodes dim (the search/ask focus
 * effect). Clicking a node calls `onSelect`.
 */
export function GraphView({
  data,
  width,
  height,
  selectedId,
  highlighted,
  onSelect,
}: {
  data: GraphData;
  width: number;
  height: number;
  selectedId: string | null;
  highlighted: Set<string>;
  onSelect: (id: string | null) => void;
}) {
  const color = useMemo(() => clusterColorMap(data.clusters), [data.clusters]);

  const degree = useMemo(() => {
    const d = new Map<string, number>();
    for (const l of data.links) {
      d.set(l.source, (d.get(l.source) ?? 0) + 1);
      d.set(l.target, (d.get(l.target) ?? 0) + 1);
    }
    return d;
  }, [data.links]);

  const radiusOf = useCallback(
    (n: FGNode) => 3 + Math.sqrt(degree.get(n.id) ?? 0) * 0.8,
    [degree],
  );

  // react-force-graph mutates node/link objects (adds x/y, resolves link ends),
  // so hand it fresh copies each time the data changes.
  const graphData = useMemo(
    () => ({
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.links.map((l) => ({ ...l })),
    }),
    [data],
  );

  const focusing = highlighted.size > 0;

  return (
    <ForceGraph2D
      graphData={graphData}
      width={width}
      height={height}
      backgroundColor="rgba(0,0,0,0)"
      nodeRelSize={1}
      cooldownTicks={120}
      linkColor={() => "rgba(140,140,160,0.30)"}
      linkWidth={(l: { weight?: number }) => 0.4 + Math.log1p(l.weight ?? 1)}
      linkDirectionalArrowLength={3}
      linkDirectionalArrowRelPos={1}
      linkDirectionalArrowColor={() => "rgba(140,140,160,0.5)"}
      onNodeClick={(n: FGNode) => onSelect(n.id === selectedId ? null : n.id)}
      nodeCanvasObjectMode={() => "replace"}
      nodeCanvasObject={(n: FGNode, ctx: CanvasRenderingContext2D, scale: number) => {
        const isSelected = n.id === selectedId;
        const lit = !focusing || highlighted.has(n.id) || isSelected;
        const r = radiusOf(n) * (isSelected ? 1.4 : 1);

        ctx.globalAlpha = lit ? 1 : 0.12;
        ctx.beginPath();
        ctx.arc(n.x ?? 0, n.y ?? 0, r, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? SELECTED_COLOR : color(n.cluster_id);
        ctx.fill();

        if (isSelected) {
          ctx.lineWidth = 1.5 / scale;
          ctx.strokeStyle = "#ffffff";
          ctx.stroke();
        }

        // Label when zoomed in, when this node is a focus match, or when selected.
        if (scale > 1.6 || (focusing && highlighted.has(n.id)) || isSelected) {
          ctx.globalAlpha = lit ? 0.95 : 0.2;
          ctx.font = `${11 / scale}px -apple-system, system-ui, sans-serif`;
          ctx.fillStyle = "rgba(190,195,210,0.95)";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(n.name, n.x ?? 0, (n.y ?? 0) + r + 2 / scale);
        }
      }}
    />
  );
}
