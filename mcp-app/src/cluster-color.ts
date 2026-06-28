import type { GraphCluster } from "./types";

// Copied from frontend/src/lib/cluster-color.ts so a cluster wears the same colour
// here as in the web app. Keep the palette in sync if the web app's changes.
export const CLUSTER_PALETTE = [
  "#7aa2f7",
  "#bb9af7",
  "#7dcfff",
  "#9ece6a",
  "#e0af68",
  "#f7768e",
  "#2ac3de",
  "#ff9e64",
  "#b4f9f8",
  "#c0caf5",
];

export const NO_CLUSTER_COLOR = "#6b7280";

/** Stable `clusterId -> colour` lookup ordered as the clusters arrive. */
export function clusterColorMap(
  clusters: GraphCluster[],
): (clusterId: string | null) => string {
  const order = new Map(clusters.map((c, i) => [c.id, i]));
  return (clusterId) => {
    if (clusterId == null) return NO_CLUSTER_COLOR;
    const i = order.get(clusterId);
    return i == null ? NO_CLUSTER_COLOR : CLUSTER_PALETTE[i % CLUSTER_PALETTE.length];
  };
}
