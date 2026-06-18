'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { GraphData, GraphNode } from '@/lib/api'

// react-force-graph-2d touches `window` at import time, so it must load only on
// the client. We import it inside an effect (rather than next/dynamic) so we can
// hold a ref to the instance and drive the camera (zoomToFit / centerAt).
type ForceGraphComponent = React.ComponentType<Record<string, unknown>>
type ForceGraphHandle = {
  zoomToFit: (ms?: number, pad?: number) => void
  centerAt: (x?: number, y?: number, ms?: number) => void
  zoom: (z?: number, ms?: number) => void
  d3Force: (name: string) => { strength: (v: number) => void } | undefined
}

// The library augments each node object in place with x/y once it lays them out.
type FGNode = GraphNode & { x?: number; y?: number }
type FGLink = { source: string | FGNode; target: string | FGNode; weight: number }

// Tokyo-night-ish hues: distinct and legible on the dark canvas, one per cluster.
const PALETTE = [
  '#7aa2f7', '#bb9af7', '#7dcfff', '#9ece6a', '#e0af68',
  '#f7768e', '#2ac3de', '#ff9e64', '#b4f9f8', '#c0caf5',
]
const NO_CLUSTER = '#6b7280'
const BG = '#0b0e14'

const endpointId = (e: string | FGNode) => (typeof e === 'object' ? e.id : e)
const radiusOf = (n: GraphNode) => 2.5 + Math.sqrt(n.mentions) * 1.8

export function GraphCanvas({
  data,
  selectedId,
  onSelectId,
}: {
  data: GraphData
  selectedId: string | null
  onSelectId: (id: string | null) => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<ForceGraphHandle | null>(null)

  const [Comp, setComp] = useState<ForceGraphComponent | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [hoverId, setHoverId] = useState<string | null>(null)

  // Load the client-only component once.
  useEffect(() => {
    let alive = true
    import('react-force-graph-2d').then((m) => {
      if (alive) setComp(() => m.default as unknown as ForceGraphComponent)
    })
    return () => {
      alive = false
    }
  }, [])

  // Track the container size so the canvas fills its panel.
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

  // Fresh copies so the library can mutate (x/y/vx/vy) without touching props.
  // Keyed on `data` only — hover/select must not rebuild this or the layout resets.
  const graphData = useMemo(() => {
    const ids = new Set(data.nodes.map((n) => n.id))
    return {
      nodes: data.nodes.map((n) => ({ ...n })) as FGNode[],
      links: data.links
        .filter((l) => ids.has(l.source) && ids.has(l.target))
        .map((l) => ({ ...l })),
    }
  }, [data])

  // cluster id -> colour, in cluster order.
  const colorOf = useMemo(() => {
    const idx = new Map(data.clusters.map((c, i) => [c.id, i]))
    return (n: GraphNode) =>
      n.cluster_id != null
        ? PALETTE[(idx.get(n.cluster_id) ?? 0) % PALETTE.length]
        : NO_CLUSTER
  }, [data.clusters])

  // Adjacency from the original string endpoints — used to dim non-neighbours.
  const neighbors = useMemo(() => {
    const m = new Map<string, Set<string>>()
    for (const n of data.nodes) m.set(n.id, new Set())
    for (const l of data.links) {
      m.get(l.source)?.add(l.target)
      m.get(l.target)?.add(l.source)
    }
    return m
  }, [data])

  const activeId = hoverId ?? selectedId
  const highlightIds = useMemo(() => {
    if (!activeId) return null
    return new Set<string>([activeId, ...(neighbors.get(activeId) ?? [])])
  }, [activeId, neighbors])

  // Stronger repulsion than default so clusters breathe; refit when it loads.
  useEffect(() => {
    fgRef.current?.d3Force('charge')?.strength(-160)
  }, [Comp, graphData])

  // Centre the camera on the selected node (e.g. picked from search).
  useEffect(() => {
    if (!selectedId) return
    const node = graphData.nodes.find((n) => n.id === selectedId)
    if (node && node.x != null && node.y != null) {
      fgRef.current?.centerAt(node.x, node.y, 600)
      fgRef.current?.zoom(3, 600)
    }
  }, [selectedId, graphData])

  if (data.nodes.length === 0) {
    return (
      <div
        ref={wrapRef}
        className="flex h-full w-full items-center justify-center"
        style={{ background: BG }}
      >
        <p className="text-sm text-neutral-400">
          Your graph is empty — upload a document to grow it.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={wrapRef}
      className="h-full w-full overflow-hidden"
      style={{ background: BG, cursor: hoverId ? 'pointer' : 'default' }}
    >
      {Comp && size.w > 0 && size.h > 0 && (
        <Comp
          ref={fgRef}
          graphData={graphData}
          width={size.w}
          height={size.h}
          backgroundColor={BG}
          nodeRelSize={1}
          nodeLabel={(n: FGNode) =>
            `${n.name}${n.description ? ` — ${n.description}` : ''}`
          }
          onNodeHover={(n: FGNode | null) => setHoverId(n ? n.id : null)}
          onNodeClick={(n: FGNode) => onSelectId(selectedId === n.id ? null : n.id)}
          onBackgroundClick={() => onSelectId(null)}
          cooldownTicks={120}
          onEngineStop={() => fgRef.current?.zoomToFit(400, 48)}
          linkColor={(l: FGLink) => {
            if (!activeId) return 'rgba(120,130,150,0.28)'
            const on =
              endpointId(l.source) === activeId ||
              endpointId(l.target) === activeId
            return on ? 'rgba(180,190,210,0.85)' : 'rgba(120,130,150,0.06)'
          }}
          linkWidth={(l: FGLink) => {
            const on =
              activeId &&
              (endpointId(l.source) === activeId ||
                endpointId(l.target) === activeId)
            return on ? Math.min(0.6 + l.weight * 0.5, 4) : 0.5
          }}
          nodePointerAreaPaint={(
            n: FGNode,
            color: string,
            ctx: CanvasRenderingContext2D,
          ) => {
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(n.x ?? 0, n.y ?? 0, radiusOf(n) + 2, 0, 2 * Math.PI)
            ctx.fill()
          }}
          nodeCanvasObject={(
            n: FGNode,
            ctx: CanvasRenderingContext2D,
            scale: number,
          ) => {
            const x = n.x ?? 0
            const y = n.y ?? 0
            const r = radiusOf(n)
            const dim = highlightIds != null && !highlightIds.has(n.id)
            const focused = n.id === hoverId || n.id === selectedId

            ctx.globalAlpha = dim ? 0.15 : 1
            ctx.beginPath()
            ctx.arc(x, y, r, 0, 2 * Math.PI)
            ctx.fillStyle = colorOf(n)
            ctx.fill()
            if (focused) {
              ctx.lineWidth = (n.id === selectedId ? 2 : 1.5) / scale
              ctx.strokeStyle = n.id === selectedId ? '#ffffff' : '#e6edf3'
              ctx.stroke()
            }

            // Labels appear as you zoom in, or always for the focused/neighbour set.
            if (scale > 1.4 || focused || (highlightIds?.has(n.id) ?? false)) {
              const font = 11 / scale
              ctx.font = `${font}px ui-sans-serif, system-ui, sans-serif`
              ctx.textAlign = 'center'
              ctx.textBaseline = 'top'
              ctx.fillStyle = dim ? 'rgba(201,209,217,0.25)' : '#c9d1d9'
              ctx.fillText(n.name, x, y + r + 1.5 / scale)
            }
            ctx.globalAlpha = 1
          }}
        />
      )}
    </div>
  )
}
