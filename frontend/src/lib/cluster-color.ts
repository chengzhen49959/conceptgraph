import type { GraphCluster } from '@/lib/api'

// Tokyo-night-ish hues: distinct and legible on either canvas. One per cluster,
// assigned by the cluster's position in the graph's cluster list. The force
// graph and the sidebar swatches both read from here so a cluster wears the
// same colour in every view — change the palette in one place only.
export const CLUSTER_PALETTE = [
  '#7aa2f7', '#bb9af7', '#7dcfff', '#9ece6a', '#e0af68',
  '#f7768e', '#2ac3de', '#ff9e64', '#b4f9f8', '#c0caf5',
]

// Concepts with no cluster (and any unknown id) fall back to a neutral grey.
export const NO_CLUSTER_COLOR = '#6b7280'

/**
 * Build a stable `clusterId -> colour` lookup ordered as the clusters arrive.
 * Pass `null` (an unclustered concept) or an unknown id to get the grey fallback.
 */
export function clusterColorMap(
  clusters: GraphCluster[],
): (clusterId: string | null) => string {
  const order = new Map(clusters.map((c, i) => [c.id, i]))
  return (clusterId) => {
    if (clusterId == null) return NO_CLUSTER_COLOR
    const i = order.get(clusterId)
    return i == null ? NO_CLUSTER_COLOR : CLUSTER_PALETTE[i % CLUSTER_PALETTE.length]
  }
}
