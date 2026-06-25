'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { Maximize2 } from 'lucide-react'
import type { GraphData } from '@/lib/api'
import { topicColorOf } from '@/lib/graph-settings'
import { clusterColorMap } from '@/lib/cluster-color'

/**
 * The corner local graph shown while reading — the document's own concepts and
 * the edges among them, the Obsidian "关系图谱" pane reframed for one document.
 * A deliberately small, standalone force graph: it never touches GraphCanvas's
 * layout state (its nodes are clones), so the two views can't corrupt each other.
 * Clicking a node selects it in the main graph; the expand button restores it.
 */

type MiniNode = {
  id: string
  name: string
  cluster_id: string | null
  mentions: number
  x?: number
  y?: number
}

type ForceGraphComponent = React.ComponentType<Record<string, unknown>>
type ForceGraphHandle = {
  zoomToFit: (ms?: number, pad?: number) => void
}

// Palette aligned with GraphCanvas (DARK/LIGHT) so the mini matches the full graph.
const ACCENT = '#8b6cef'

export function LocalGraphMini({
  graph,
  conceptIds,
  selectedId,
  topicColors,
  onSelectConcept,
  onExpand,
}: {
  graph: GraphData
  conceptIds: Set<string>
  selectedId: string | null
  topicColors: Record<string, string>
  onSelectConcept: (id: string) => void
  onExpand: () => void
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const fgRef = useRef<ForceGraphHandle | null>(null)
  const [Comp, setComp] = useState<ForceGraphComponent | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme !== 'light'
  const bg = dark ? '#1e1e1e' : '#f7f7f5'
  const neutral = dark ? '#bcc1cb' : '#73777f'

  // Load the client-only force-graph once (it touches `window` at import time).
  useEffect(() => {
    let alive = true
    import('react-force-graph-2d').then((m) => {
      if (alive) setComp(() => m.default as unknown as ForceGraphComponent)
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // The document's concepts + edges among them. Nodes are CLONED so the mini's
  // force simulation mutates its own objects (x/y), never the shared graph nodes
  // that GraphCanvas lays out. Links reference ids; force-graph resolves them.
  const data = useMemo(() => {
    const nodes: MiniNode[] = graph.nodes
      .filter((n) => conceptIds.has(n.id))
      .map((n) => ({
        id: n.id,
        name: n.name,
        cluster_id: n.cluster_id,
        mentions: n.mentions,
      }))
    const present = new Set(nodes.map((n) => n.id))
    const links = graph.links
      .filter((l) => present.has(l.source) && present.has(l.target))
      .map((l) => ({ source: l.source, target: l.target }))
    return { nodes, links }
  }, [graph, conceptIds])

  const fallback = useMemo(() => clusterColorMap(graph.clusters), [graph.clusters])
  const colorOf = (n: MiniNode) => {
    if (n.id === selectedId) return ACCENT
    if (n.cluster_id) return topicColorOf(n.cluster_id, topicColors, fallback)
    return neutral
  }

  return (
    <div
      ref={wrapRef}
      className="relative size-full overflow-hidden rounded-lg border bg-background shadow-lg"
    >
      <button
        type="button"
        onClick={onExpand}
        title="Back to full graph"
        aria-label="Back to full graph"
        className="absolute right-1.5 top-1.5 z-10 rounded-md bg-background/80 p-1 text-muted-foreground backdrop-blur hover:bg-accent hover:text-foreground"
      >
        <Maximize2 className="size-3.5" />
      </button>

      {Comp && size.w > 0 && size.h > 0 && (
        <Comp
          ref={fgRef}
          graphData={data}
          width={size.w}
          height={size.h}
          backgroundColor={bg}
          nodeRelSize={1}
          minZoom={0.3}
          maxZoom={8}
          nodeLabel={(n: MiniNode) => n.name}
          enableNodeDrag={false}
          cooldownTicks={80}
          d3VelocityDecay={0.5}
          onNodeClick={(n: MiniNode) => onSelectConcept(n.id)}
          linkColor={() =>
            dark ? 'rgba(176,182,191,0.35)' : 'rgba(80,84,92,0.3)'
          }
          linkWidth={1}
          onEngineStop={() => fgRef.current?.zoomToFit(400, 16)}
          nodeCanvasObjectMode={() => 'replace'}
          nodeCanvasObject={(
            n: MiniNode,
            ctx: CanvasRenderingContext2D,
            scale: number,
          ) => {
            const r = 2 + Math.sqrt(n.mentions)
            ctx.beginPath()
            ctx.arc(n.x ?? 0, n.y ?? 0, r, 0, 2 * Math.PI)
            ctx.fillStyle = colorOf(n)
            ctx.fill()
            if (n.id === selectedId) {
              ctx.lineWidth = 1.5 / scale
              ctx.strokeStyle = ACCENT
              ctx.stroke()
            }
          }}
        />
      )}
    </div>
  )
}
