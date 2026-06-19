'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { forceCollide } from 'd3-force'
import type { GraphData, GraphNode } from '@/lib/api'
import { clusterColorMap } from '@/lib/cluster-color'

// react-force-graph-2d touches `window` at import time, so it must load only on
// the client. We import it inside an effect (rather than next/dynamic) so we can
// hold a ref to the instance and drive the camera (zoomToFit / centerAt) and read
// node→screen coordinates for the HTML label layer.
type ForceGraphComponent = React.ComponentType<Record<string, unknown>>
// A d3 force we tweak (charge/link/collide); methods return the force for chaining.
type ForceObj = {
  strength?: (v: number | ((n: FGNode) => number)) => ForceObj
  distance?: (v: number) => ForceObj
}
type ForceGraphHandle = {
  zoomToFit: (
    ms?: number,
    pad?: number,
    nodeFilter?: (n: FGNode) => boolean,
  ) => void
  centerAt: (x?: number, y?: number, ms?: number) => void
  // Getter (no args) returns the current zoom; setter (z, ms) animates to it.
  zoom: (z?: number, ms?: number) => number
  // One arg gets a named force to tweak; a second arg sets one (e.g. collide).
  d3Force: (name: string, force?: unknown) => ForceObj | undefined
  // Map a node's world (x,y) to on-screen CSS pixels — drives the HTML label layer.
  graph2ScreenCoords: (x: number, y: number) => { x: number; y: number }
}

// The library augments each node object in place with x/y once it lays them out.
// A node is either a concept (from the API) or a synthetic cluster super-node
// (isCluster) standing in for a collapsed cluster; `count` is its member tally.
type FGNode = GraphNode & {
  x?: number
  y?: number
  isCluster?: boolean
  count?: number
}
type FGLink = { source: string | FGNode; target: string | FGNode; weight: number }

// Per-theme chrome (everything NOT coloured by cluster). Node dots wear their
// cluster hue via `colorOf`; this holds the label text colours, the soft text
// shadow that lifts labels off the canvas, the selection ring, link shades, and
// the dim level for nodes outside the highlight set.
const DARK = {
  bg: '#1e1e1e', // Obsidian default dark canvas (neutral, not blue-black)
  dim: 0.18, // opacity of node dots outside the highlight set
  label: '#c8ccd2', // resting label text
  labelHi: '#ffffff', // hovered / highlighted label text
  labelShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.9)',
  selStroke: 'rgba(255,255,255,0.95)', // ring on the hovered / selected node
  link: 'rgba(176,182,191,0.38)', // resting link — visible, not faint
  linkOn: 'rgba(214,218,224,0.72)', // lit link (touches active node / inside focus)
  linkOff: 'rgba(176,182,191,0.06)', // link outside the highlight, nearly gone
}
const LIGHT = {
  bg: '#ffffff',
  dim: 0.2,
  label: '#3a3f47',
  labelHi: '#0f1216', // on white, emphasis is darker
  labelShadow: '0 1px 2px rgba(255,255,255,0.95), 0 0 2px rgba(255,255,255,0.95)',
  selStroke: 'rgba(26,29,34,0.9)',
  link: 'rgba(70,76,86,0.32)',
  linkOn: 'rgba(50,56,66,0.62)',
  linkOff: 'rgba(70,76,86,0.06)',
}

// Base style shared by every HTML label. Position is driven imperatively via
// `transform` (cheap, no reflow); the layer itself ignores pointer events so the
// canvas underneath still receives hover / click.
const LABEL_CSS =
  'position:absolute;left:0;top:0;white-space:nowrap;pointer-events:none;' +
  'will-change:transform;font-family:ui-sans-serif,system-ui,sans-serif;' +
  '-webkit-font-smoothing:antialiased;line-height:1;'

const endpointId = (e: string | FGNode) => (typeof e === 'object' ? e.id : e)
// Cluster super-nodes are drawn distinctly larger than concept dots.
const radiusOf = (n: FGNode) =>
  n.isCluster ? 10 + Math.sqrt(n.count ?? 1) * 2.5 : 5 + Math.sqrt(n.mentions) * 1.8

// Approximate label height in CSS px (font ~12–13px, line-height:1) — used to
// build each candidate placement box.
const LABEL_H = 15

// A label's screen-space rectangle (CSS px) used only for de-overlap. `m` is the
// breathing room so labels never kiss.
type Box = { x0: number; y0: number; x1: number; y1: number }
const overlaps = (a: Box, b: Box, m = 3) =>
  a.x0 - m < b.x1 && a.x1 + m > b.x0 && a.y0 - m < b.y1 && a.y1 + m > b.y0

// One HTML label element plus the cached node + measured width it tracks.
type Label = { el: HTMLDivElement; w: number; n: FGNode }

export function GraphCanvas({
  data,
  selectedId,
  onSelectId,
  focusedClusterId,
  onFocusCluster,
  highlightClusterId,
  highlightConceptId,
}: {
  data: GraphData
  selectedId: string | null
  onSelectId: (id: string | null) => void
  /** Drilled-in cluster id, or null for the overview of cluster super-nodes. */
  focusedClusterId: string | null
  /** Focus a cluster (drill in) or pass null to return to the overview. */
  onFocusCluster: (clusterId: string | null) => void
  /** Topic the sidebar is hovering — light all its member concepts. */
  highlightClusterId: string | null
  /** Concept the sidebar is hovering — light it and its neighbours. */
  highlightConceptId: string | null
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<ForceGraphHandle | null>(null)
  // The HTML overlay that holds the label <div>s, and a live id → label map we
  // mutate imperatively (creating/removing elements only when the node set changes).
  const layerRef = useRef<HTMLDivElement>(null)
  const labelsRef = useRef<Map<string, Label>>(new Map())

  const [Comp, setComp] = useState<ForceGraphComponent | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [hoverId, setHoverId] = useState<string | null>(null)

  // resolvedTheme is undefined until mount → default to the dark palette (which
  // is also the app default). Changing it only swaps colours, not layout.
  const { resolvedTheme } = useTheme()
  const c = resolvedTheme === 'light' ? LIGHT : DARK

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

  // cluster id -> colour (shared with the sidebar swatches); every node dot reads
  // from here so a cluster wears the same hue on the canvas and in the sidebar.
  const colorOf = useMemo(() => clusterColorMap(data.clusters), [data.clusters])

  // Derived render graph in two modes (see the body): the overview collapses every
  // cluster into one super-node; drilling into a cluster shows its concepts and the
  // edges between them. Keyed on [data, focusedClusterId] — hover/select never
  // rebuild this, so the layout is stable.
  const graphData = useMemo(() => {
    // Drill-in: show only the focused cluster's concepts and the edges between them
    // (the dense intra-cluster links the overview hides — see clustering note).
    if (focusedClusterId != null) {
      const ids = new Set(
        data.nodes.filter((n) => n.cluster_id === focusedClusterId).map((n) => n.id),
      )
      const nodes: FGNode[] = data.nodes
        .filter((n) => ids.has(n.id))
        .map((n) => ({ ...n }))
      const links: FGLink[] = data.links
        .filter((l) => ids.has(l.source) && ids.has(l.target))
        .map((l) => ({ source: l.source, target: l.target, weight: l.weight }))
      return { nodes, links }
    }

    // Overview: every clustered concept collapses into one cluster super-node;
    // unclustered concepts show as dots. Links are re-routed to each endpoint's
    // representative and aggregated; intra-cluster edges collapse away (they live
    // inside the cluster — only cross-cluster edges remain between super-nodes).
    const byId = new Map(data.nodes.map((n) => [n.id, n]))
    const repOf = (id: string): string => {
      const n = byId.get(id)
      if (n && n.cluster_id) return `cluster:${n.cluster_id}`
      return id
    }

    const nodes: FGNode[] = []
    const counts = new Map<string, number>()
    for (const n of data.nodes) {
      if (n.cluster_id) {
        counts.set(n.cluster_id, (counts.get(n.cluster_id) ?? 0) + 1)
      } else {
        nodes.push({ ...n }) // unclustered concept
      }
    }
    const labelOf = new Map(data.clusters.map((cl) => [cl.id, cl.label]))
    for (const [cid, count] of counts) {
      nodes.push({
        id: `cluster:${cid}`,
        name: labelOf.get(cid) ?? 'Unlabeled',
        description: null,
        cluster_id: cid,
        mentions: count,
        isCluster: true,
        count,
      })
    }

    const present = new Set(data.nodes.map((n) => n.id))
    const agg = new Map<string, FGLink>()
    for (const l of data.links) {
      if (!present.has(l.source) || !present.has(l.target)) continue
      const s = repOf(l.source)
      const t = repOf(l.target)
      if (s === t) continue
      const key = s < t ? `${s}--${t}` : `${t}--${s}`
      const cur = agg.get(key)
      if (cur) cur.weight += l.weight
      else agg.set(key, { source: s, target: t, weight: l.weight })
    }
    return { nodes, links: [...agg.values()] }
  }, [data, focusedClusterId])

  // Adjacency over the DERIVED graph (so super-node hover highlights correctly).
  const neighbors = useMemo(() => {
    const m = new Map<string, Set<string>>()
    for (const n of graphData.nodes) m.set(n.id, new Set())
    for (const l of graphData.links) {
      const s = endpointId(l.source)
      const t = endpointId(l.target)
      m.get(s)?.add(t)
      m.get(t)?.add(s)
    }
    return m
  }, [graphData])

  // Map a real concept id to the node id actually rendered right now: itself when
  // its cluster is drilled in, otherwise the cluster super-node standing in for it
  // in the overview. null = not currently on screen.
  const renderedIdOf = (conceptId: string): string | null => {
    const n = data.nodes.find((x) => x.id === conceptId)
    if (!n) return null
    if (focusedClusterId != null)
      return n.cluster_id === focusedClusterId ? conceptId : null
    return n.cluster_id ? `cluster:${n.cluster_id}` : conceptId
  }

  // Highlight requested from the sidebar (hovering a topic row or a concept row),
  // translated to ids that exist in the current render. Empty → null, so hovering
  // something that's off-screen doesn't dim the whole canvas.
  const externalHighlight = useMemo(() => {
    const present = new Set(graphData.nodes.map((n) => n.id))
    let raw: string[] = []
    if (highlightClusterId) {
      if (focusedClusterId != null) {
        // In drill-in every rendered dot belongs to the focused cluster, so light
        // them all only when that's the topic being hovered.
        raw = highlightClusterId === focusedClusterId
          ? graphData.nodes.map((n) => n.id)
          : []
      } else {
        raw = [`cluster:${highlightClusterId}`] // overview super-node
      }
    } else if (highlightConceptId) {
      const rid = renderedIdOf(highlightConceptId)
      if (rid) raw = [rid, ...(neighbors.get(rid) ?? [])]
    }
    const set = new Set(raw.filter((id) => present.has(id)))
    return set.size ? set : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightClusterId, highlightConceptId, focusedClusterId, graphData, neighbors])

  // Resting style unless something is active. Priority: the canvas's own hover,
  // then the sidebar hover, then a persistent selection. Drill-in with nothing
  // active leaves this null → every dot stays lit.
  const setOf = (id: string) => new Set<string>([id, ...(neighbors.get(id) ?? [])])
  const highlightIds = useMemo(() => {
    if (hoverId) return setOf(hoverId)
    if (externalHighlight) return externalHighlight
    if (selectedId) return setOf(selectedId)
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverId, selectedId, externalHighlight, neighbors])

  // Spread nodes apart so labels stop piling: strong repulsion, long links, and a
  // collision radius that reserves a whole label-width of room. The label sits
  // centred under the dot, so keeping node centres ≥ half a label width apart
  // means neighbouring below-labels can't overlap — this is what makes the layout
  // breathe like Obsidian's. Widths come from the label-build effect (measured
  // into labelsRef); until measured we fall back to a sane default.
  useEffect(() => {
    const fg = fgRef.current
    if (!fg) return
    // Gentle charge only unfolds the graph; the collide force is the real spacer,
    // reserving a label-width of room around every node. Strong charge would fling
    // nodes so far that zoomToFit clamps to minZoom and every dot shrinks to a
    // speck — so keep it weak and let collide set a compact, even spacing.
    fg.d3Force('charge')?.strength?.((n: FGNode) => (n.isCluster ? -300 : -120))
    fg.d3Force('link')?.distance?.(45)
    fg.d3Force(
      'collide',
      forceCollide<FGNode>((n) => {
        const labelW = labelsRef.current.get(n.id)?.w ?? 60
        return Math.max(radiusOf(n) + 4, labelW / 2 + 6)
      }).strength(1),
    )
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

  // Position + show/hide every HTML label for the current frame. Called on each
  // canvas frame (onRenderFramePost) and once after (re)building the elements, so
  // labels track the live layout, zoom and pan. `k` is the current zoom.
  const syncLabels = (k: number) => {
    const fg = fgRef.current
    if (!fg) return
    const active = highlightIds != null

    // Order: focused (selected/hovered) first, then biggest dots — so important
    // labels claim space before the de-overlap pass culls the rest.
    const list = [...labelsRef.current.values()].filter(
      (v) => v.n.x != null && v.n.y != null,
    )
    list.sort((a, b) => {
      const fa = a.n.id === selectedId || a.n.id === hoverId
      const fb = b.n.id === selectedId || b.n.id === hoverId
      if (fa !== fb) return fa ? -1 : 1
      return radiusOf(b.n) - radiusOf(a.n)
    })

    // Screen-space box of every dot, so a resting label can avoid sitting on ANY
    // node, not just on other labels. Computed once per frame.
    const dotBoxes: Box[] = list.map((v) => {
      const p = fg.graph2ScreenCoords(v.n.x as number, v.n.y as number)
      const r = radiusOf(v.n) * k
      return { x0: p.x - r, y0: p.y - r, x1: p.x + r, y1: p.y + r }
    })

    const placed: Box[] = []
    for (const v of list) {
      const n = v.n
      const focus = n.id === selectedId || n.id === hoverId
      // When something is active, only its highlight set is labelled.
      if (active && !highlightIds.has(n.id)) {
        v.el.style.display = 'none'
        continue
      }
      const show = focus || active
      // Tie label visibility to the dot's on-screen size: when zoomed so far out
      // the dot is a speck, drop its label so the overview stays clean. Self-scales
      // (unlike a fixed zoom threshold) so labels are present at the fitted zoom.
      const screenR = radiusOf(n) * k
      if (!show && screenR < 0.8) {
        v.el.style.display = 'none'
        continue
      }

      const sp = fg.graph2ScreenCoords(n.x as number, n.y as number)
      const hw = v.w / 2
      const hh = LABEL_H / 2

      // Label-centre candidates around the dot, nearest-first: below, above,
      // right, left, then the four diagonals — "put it wherever there's room".
      // A resting label takes the first spot that clears both already-placed
      // labels AND every dot. If nothing is free it still shows below — a label
      // is never dropped. Focused/active labels always sit below.
      const oy = screenR + 7 + hh
      const ox = screenR + 7 + hw
      const dy = screenR + 6 + hh
      const dx = screenR + 6 + hw
      const centers: [number, number][] = [
        [sp.x, sp.y + oy],
        [sp.x, sp.y - oy],
        [sp.x + ox, sp.y],
        [sp.x - ox, sp.y],
        [sp.x + dx, sp.y + dy],
        [sp.x - dx, sp.y + dy],
        [sp.x + dx, sp.y - dy],
        [sp.x - dx, sp.y - dy],
      ]
      const boxAt = (lx: number, ly: number): Box => ({
        x0: lx - hw,
        y0: ly - hh,
        x1: lx + hw,
        y1: ly + hh,
      })

      let [lx, ly] = centers[0]
      if (!show) {
        const free = centers.find(([cx, cy]) => {
          const b = boxAt(cx, cy)
          return (
            !placed.some((p) => overlaps(p, b)) &&
            !dotBoxes.some((d) => overlaps(d, b, 1))
          )
        })
        if (free) [lx, ly] = free
        placed.push(boxAt(lx, ly))
      }

      v.el.style.display = 'block'
      v.el.style.color = show ? c.labelHi : c.label
      v.el.style.transform = `translate(${Math.round(lx)}px, ${Math.round(ly)}px) translate(-50%, -50%)`
    }
  }

  // Build / tear down the label elements when the node set or theme changes.
  // Elements live across hover/zoom (only their transform is touched per frame),
  // so this runs rarely. Width is measured once here and cached for de-overlap.
  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    const map = labelsRef.current
    const want = new Set(graphData.nodes.map((n) => n.id))
    for (const [id, v] of map) {
      if (!want.has(id)) {
        v.el.remove()
        map.delete(id)
      }
    }
    for (const n of graphData.nodes) {
      let v = map.get(n.id)
      if (!v) {
        const el = document.createElement('div')
        el.style.cssText = LABEL_CSS
        layer.appendChild(el)
        v = { el, w: 0, n }
        map.set(n.id, v)
      }
      v.n = n
      v.el.style.fontSize = n.isCluster ? '13px' : '12px'
      v.el.style.fontWeight = n.isCluster ? '600' : '500'
      v.el.style.textShadow = c.labelShadow
      v.el.textContent = n.isCluster ? `${n.name} · ${n.count}` : n.name
      v.w = v.el.offsetWidth // measure once (one reflow); cached for de-overlap
    }
    // Place immediately so a settled graph (e.g. after a theme toggle) shows labels
    // without waiting for the next pan/zoom to trigger a frame.
    syncLabels(fgRef.current?.zoom() ?? 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphData, resolvedTheme, Comp])

  // Label of the drilled-in cluster (for the back chip); null in the overview.
  const focusedLabel = useMemo(() => {
    if (focusedClusterId == null) return null
    return data.clusters.find((cl) => cl.id === focusedClusterId)?.label ?? 'Unlabeled'
  }, [focusedClusterId, data.clusters])

  // Is a link "lit"? A link lights when both endpoints are in the highlight set,
  // so it tracks canvas hover, sidebar hover and selection alike. `null` = nothing
  // active, so links keep their resting style.
  const linkLit = (l: FGLink): boolean | null => {
    if (!highlightIds) return null
    return (
      highlightIds.has(endpointId(l.source)) &&
      highlightIds.has(endpointId(l.target))
    )
  }

  if (data.nodes.length === 0) {
    return (
      <div
        ref={wrapRef}
        className="flex h-full w-full items-center justify-center"
        style={{ background: c.bg }}
      >
        <p className="text-sm text-muted-foreground">
          Your graph is empty — upload a document to grow it.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full overflow-hidden"
      style={{ background: c.bg, cursor: hoverId ? 'pointer' : 'default' }}
    >
      {Comp && size.w > 0 && size.h > 0 && (
        <Comp
          ref={fgRef}
          graphData={graphData}
          width={size.w}
          height={size.h}
          backgroundColor={c.bg}
          nodeRelSize={1}
          minZoom={0.4}
          maxZoom={8}
          nodeLabel={() => ''}
          onNodeHover={(n: FGNode | null) => setHoverId(n ? n.id : null)}
          onNodeClick={(n: FGNode) =>
            n.isCluster && n.cluster_id
              ? onFocusCluster(n.cluster_id) // drill into this cluster
              : onSelectId(selectedId === n.id ? null : n.id)
          }
          onBackgroundClick={() =>
            focusedClusterId != null ? onFocusCluster(null) : onSelectId(null)
          }
          cooldownTicks={120}
          onEngineStop={() => fgRef.current?.zoomToFit(400, 70)}
          linkColor={(l: FGLink) => {
            const lit = linkLit(l)
            if (lit == null) return c.link
            return lit ? c.linkOn : c.linkOff
          }}
          linkWidth={(l: FGLink) =>
            linkLit(l)
              ? Math.min(1.2 + l.weight * 0.6, 5)
              : Math.min(0.7 + l.weight * 0.45, 4)
          }
          nodePointerAreaPaint={(
            n: FGNode,
            color: string,
            ctx: CanvasRenderingContext2D,
          ) => {
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(n.x ?? 0, n.y ?? 0, radiusOf(n) + 3, 0, 2 * Math.PI)
            ctx.fill()
          }}
          // Dots only — labels are real HTML in the overlay layer (always crisp).
          nodeCanvasObjectMode={() => 'replace'}
          nodeCanvasObject={(
            n: FGNode,
            ctx: CanvasRenderingContext2D,
            scale: number,
          ) => {
            const x = n.x ?? 0
            const y = n.y ?? 0
            const active = highlightIds != null // something hovered/selected
            const dim = active && !highlightIds.has(n.id)
            const isHover = n.id === hoverId
            const isSelected = n.id === selectedId

            // Hovered node grows a touch; the rest keep their size.
            const r = radiusOf(n) * (isHover ? 1.22 : 1)
            ctx.globalAlpha = dim ? c.dim : 1

            // Every dot wears its cluster colour (sidebar swatches match); concepts
            // with no cluster fall back to the neutral grey inside colorOf.
            ctx.beginPath()
            ctx.arc(x, y, r, 0, 2 * Math.PI)
            ctx.fillStyle = colorOf(n.cluster_id)
            ctx.fill()

            // A thin ring marks the hovered or selected node (the open concept).
            if (isSelected || isHover) {
              ctx.lineWidth = 1.5 / scale
              ctx.strokeStyle = c.selStroke
              ctx.stroke()
            }
            ctx.globalAlpha = 1
          }}
          onRenderFramePost={(_ctx: CanvasRenderingContext2D, k: number) =>
            syncLabels(k)
          }
        />
      )}
      {/* HTML label overlay — native text, never blurred by the canvas zoom. */}
      <div ref={layerRef} className="pointer-events-none absolute inset-0 overflow-hidden" />
      {/* Drill-in breadcrumb — return to the cluster overview. */}
      {focusedLabel != null && (
        <button
          type="button"
          onClick={() => onFocusCluster(null)}
          className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-md border border-border bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur transition-colors hover:bg-accent"
        >
          <span aria-hidden>←</span>
          <span className="max-w-[220px] truncate">{focusedLabel}</span>
        </button>
      )}
    </div>
  )
}
