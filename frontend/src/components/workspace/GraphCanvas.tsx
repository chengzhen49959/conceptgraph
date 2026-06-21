'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { forceCollide, forceX, forceY } from 'd3-force'
import { Flag, Highlighter, Maximize2, SquareArrowOutUpRight, Trash2, ZoomIn, ZoomOut } from 'lucide-react'
import type { GraphData, GraphNode } from '@/lib/api'
import { type GraphSettings, topicColorOf } from '@/lib/graph-settings'
import { clusterColorMap } from '@/lib/cluster-color'

// react-force-graph-2d touches `window` at import time, so it must load only on
// the client. We import it inside an effect (rather than next/dynamic) so we can
// hold a ref to the instance and drive the camera (zoomToFit / zoom) and read
// node→screen coordinates for the HTML label layer.
type ForceGraphComponent = React.ComponentType<Record<string, unknown>>
// A d3 force we tweak (charge/link/collide); methods return the force for chaining.
type ForceObj = {
  strength?: (v: number | ((n: FGNode) => number)) => ForceObj
  distance?: (v: number) => ForceObj
}
type ForceGraphHandle = {
  zoomToFit: (ms?: number, pad?: number, nodeFilter?: (n: FGNode) => boolean) => void
  // Getter (no args) returns the current zoom; setter (z, ms) animates to it.
  zoom: (z?: number, ms?: number) => number
  // One arg gets a named force to tweak; a second arg sets one (null removes it).
  d3Force: (name: string, force?: unknown) => ForceObj | undefined
  // Kick the simulation back to life after the forces change.
  d3ReheatSimulation: () => void
  // Map a node's world (x,y) to on-screen CSS pixels — drives the HTML label layer.
  graph2ScreenCoords: (x: number, y: number) => { x: number; y: number }
}

// The library augments each node object in place with x/y once it lays them out.
type FGNode = GraphNode & {
  x?: number
  y?: number
  // Fixed position: when set, d3-force holds the node here every tick (pinning).
  fx?: number
  fy?: number
}
type FGLink = { source: string | FGNode; target: string | FGNode; weight: number }

// Per-theme chrome. `node` is the default monochrome dot colour (Obsidian paints
// every node one neutral grey; colour comes from its topic); `accent` is
// the focused/selected node and the hover ring (Obsidian's purple). The rest are
// label text colours, the soft text shadow that lifts labels off the canvas, the
// link shades, and the dim level for nodes outside the highlight set.
const DARK = {
  bg: '#1e1e1e', // Obsidian default dark canvas
  node: '#bcc1cb', // default monochrome node
  accent: '#8b6cef', // focused/selected node + hover ring (Obsidian purple)
  dim: 0.1, // opacity of node dots outside the highlight set
  label: '#c8ccd2',
  labelHi: '#ffffff',
  labelShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.9)',
  link: 'rgba(176,182,191,0.38)',
  linkOn: 'rgba(214,218,224,0.72)',
  linkOff: 'rgba(176,182,191,0.06)',
}
const LIGHT = {
  bg: '#ffffff',
  node: '#73777f',
  accent: '#7c6fdc',
  dim: 0.12,
  label: '#3a3f47',
  labelHi: '#0f1216',
  labelShadow: '0 1px 2px rgba(255,255,255,0.95), 0 0 2px rgba(255,255,255,0.95)',
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
  '-webkit-font-smoothing:antialiased;line-height:1;font-size:12px;font-weight:500;'

const endpointId = (e: string | FGNode) => (typeof e === 'object' ? e.id : e)

// Approximate label height in CSS px (font ~12px, line-height:1).
const LABEL_H = 15

// A label's screen-space rectangle (CSS px) used only for de-overlap. `m` is the
// breathing room so labels never kiss.
type Box = { x0: number; y0: number; x1: number; y1: number }
const overlaps = (a: Box, b: Box, m = 3) =>
  a.x0 - m < b.x1 && a.x1 + m > b.x0 && a.y0 - m < b.y1 && a.y1 + m > b.y0

// One HTML label element plus the cached node + measured width it tracks.
type Label = { el: HTMLDivElement; w: number; n: FGNode }

// Node right-click menu state: anchored at viewport coords, acting on one node.
type Menu = { x: number; y: number; node: FGNode }

export function GraphCanvas({
  data,
  settings,
  selectedId,
  onSelectId,
  highlightClusterId,
  highlightConceptId,
  annotationsByConceptId,
  canEdit = false,
  onToggleHighlight,
  onToggleFlag,
  onDeleteConcept,
}: {
  data: GraphData
  /** The Obsidian-style control-panel state (filters, groups, display, forces). */
  settings: GraphSettings
  selectedId: string | null
  onSelectId: (id: string | null) => void
  /** Topic the sidebar is hovering — light all its member concepts. */
  highlightClusterId: string | null
  /** Concept the sidebar is hovering — light it and its neighbours. */
  highlightConceptId: string | null
  /** Open mentor markers per concept: green ring = highlight, amber = flag. */
  annotationsByConceptId?: Map<string, { highlight: boolean; flag: boolean }>
  /** Mentor/owner — gates the editing items in the node right-click menu. */
  canEdit?: boolean
  onToggleHighlight?: (conceptId: string) => void
  onToggleFlag?: (conceptId: string) => void
  onDeleteConcept?: (conceptId: string) => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<ForceGraphHandle | null>(null)
  // The HTML overlay that holds the label <div>s, and a live id → label map we
  // mutate imperatively (creating/removing elements only when the node set changes).
  const layerRef = useRef<HTMLDivElement>(null)
  const labelsRef = useRef<Map<string, Label>>(new Map())
  // Cache of each node's last-known world position (keyed by id). Seeded back onto
  // rebuilt nodes in the graphData memo so a topology change re-heats from where
  // nodes were (only new ones fly in) rather than re-exploding from the centre.
  const posRef = useRef<Map<string, { x: number; y: number }>>(new Map())
  // Passive camera: fit the view only on first layout, never on a drag/add/refetch
  // re-heat. onEngineStop consumes this once.
  const pendingFitRef = useRef(true)
  // True while a node is being dragged — syncLabels skips its O(n²) de-overlap
  // pass during the drag (the sim runs hot, every frame) to keep it smooth.
  const draggingRef = useRef(false)

  const [Comp, setComp] = useState<ForceGraphComponent | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [menu, setMenu] = useState<Menu | null>(null)

  // resolvedTheme is undefined until mount → default to the dark palette (also the
  // app default). Changing it only swaps colours, not layout.
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

  // Topology signature: the SET of node + edge ids (not their attributes). The
  // graphData memo keys on this, so a refetch that returns the same shape yields
  // the SAME graphData reference → force-graph does NOT re-heat → the layout stays
  // put. Filters (search / orphans) do NOT rebuild this — they hide nodes via
  // nodeVisibility instead, so filtering never re-lays-out the graph.
  const topoSig = useMemo(() => {
    const ns = data.nodes.map((n) => n.id).sort().join(',')
    const es = data.links.map((l) => `${l.source}>${l.target}`).sort().join(',')
    return `${ns}|${es}`
  }, [data])

  // Flat render graph: every concept and every edge, always. (No cluster
  // super-nodes, no drill-in — Obsidian shows one global graph.) Nodes are seeded
  // with their cached position so a topology-change re-heat resumes the layout.
  const graphData = useMemo(() => {
    const nodes: FGNode[] = data.nodes.map((n) => {
      const copy: FGNode = { ...n }
      const p = posRef.current.get(n.id)
      if (p) {
        copy.x = p.x
        copy.y = p.y
      }
      return copy
    })
    const present = new Set(nodes.map((n) => n.id))
    const links: FGLink[] = data.links
      .filter((l) => present.has(l.source) && present.has(l.target))
      .map((l) => ({ source: l.source, target: l.target, weight: l.weight }))
    return { nodes, links }
    // topoSig (not data) gates rebuilds; data is read fresh in the closure when it does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topoSig])

  // Degree (connection count) per node — Obsidian sizes nodes by it.
  const degreeOf = useMemo(() => {
    const m = new Map<string, number>()
    for (const n of graphData.nodes) m.set(n.id, 0)
    for (const l of graphData.links) {
      const s = endpointId(l.source)
      const t = endpointId(l.target)
      m.set(s, (m.get(s) ?? 0) + 1)
      m.set(t, (m.get(t) ?? 0) + 1)
    }
    return m
  }, [graphData])

  // Adjacency over the render graph (for hover/sidebar highlight propagation and
  // the Local-graph BFS).
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

  // Local graph: the selected concept's `depth`-hop neighbourhood (Obsidian's
  // local view). null = global graph (mode off, or nothing selected → no-op).
  const localSet = useMemo(() => {
    if (!settings.local.enabled || !selectedId || !neighbors.has(selectedId)) return null
    const depth = Math.max(1, Math.round(settings.local.depth))
    const seen = new Set<string>([selectedId])
    let frontier = [selectedId]
    for (let d = 0; d < depth; d++) {
      const next: string[] = []
      for (const id of frontier)
        for (const nb of neighbors.get(id) ?? [])
          if (!seen.has(nb)) {
            seen.add(nb)
            next.push(nb)
          }
      frontier = next
    }
    return seen
  }, [settings.local.enabled, settings.local.depth, selectedId, neighbors])

  // Radius: scales with degree (Obsidian) × the Node size slider (0.5 ≈ 1×).
  const radiusOf = useCallback(
    (n: FGNode) => {
      const mult = Math.max(0.3, settings.display.nodeSize * 2)
      return (4 + Math.sqrt(degreeOf.get(n.id) ?? 0) * 1.6) * mult
    },
    [degreeOf, settings.display.nodeSize],
  )

  // Default per-topic colour (shared with the sidebar swatches); topicColors
  // overrides ride on top via topicColorOf.
  const topicFallback = useMemo(() => clusterColorMap(data.clusters), [data.clusters])

  // Fill colour, in priority order: selected → accent (Obsidian's focused node);
  // the node's topic colour; else neutral grey.
  const colorOf = useCallback(
    (n: FGNode) => {
      if (n.id === selectedId) return c.accent
      if (n.cluster_id) return topicColorOf(n.cluster_id, settings.topicColors, topicFallback)
      return c.node
    },
    [selectedId, settings.topicColors, topicFallback, c.accent, c.node],
  )

  // A node is visible unless Orphans is off and it has no connections, its topic is
  // hidden, or Local graph excludes it. Drives both nodeVisibility and the label
  // layer, so hidden nodes also lose their labels. Hiding (not removing) keeps the
  // layout stable: filtering never re-heats the simulation.
  const nodeVisible = useCallback(
    (n: FGNode) => {
      if (!settings.filters.orphans && (degreeOf.get(n.id) ?? 0) === 0) return false
      if (n.cluster_id && settings.filters.hiddenTopics.includes(n.cluster_id)) return false
      if (localSet && !localSet.has(n.id)) return false
      return true
    },
    [settings.filters.orphans, settings.filters.hiddenTopics, degreeOf, localSet],
  )

  // Highlight requested from the sidebar: hovering a topic lights all its concepts;
  // hovering a concept lights it + neighbours. Empty → null (no dimming).
  const externalHighlight = useMemo(() => {
    let raw: string[] = []
    if (highlightClusterId) {
      raw = graphData.nodes
        .filter((n) => n.cluster_id === highlightClusterId)
        .map((n) => n.id)
    } else if (highlightConceptId && neighbors.has(highlightConceptId)) {
      raw = [highlightConceptId, ...(neighbors.get(highlightConceptId) ?? [])]
    }
    const set = new Set(raw)
    return set.size ? set : null
  }, [highlightClusterId, highlightConceptId, graphData, neighbors])

  // Resting style unless something is active. Priority: canvas hover, then sidebar
  // hover, then a persistent selection.
  const setOf = (id: string) => new Set<string>([id, ...(neighbors.get(id) ?? [])])
  const highlightIds = useMemo(() => {
    if (hoverId) return setOf(hoverId)
    if (externalHighlight) return externalHighlight
    if (selectedId) return setOf(selectedId)
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverId, selectedId, externalHighlight, neighbors])

  // Apply the Forces panel to the simulation and re-heat. Repel = charge strength,
  // Link distance/force = the link force, Center = a gentle pull toward the origin
  // (replaces the default centering force so the slider actually controls it).
  // collide reserves a label-width of room so labels don't pile (the spacer that
  // makes the layout breathe like Obsidian's). Re-runs on a forces change, a node
  // size change (collide radius), or a topology change.
  useEffect(() => {
    const fg = fgRef.current
    if (!fg) return
    const f = settings.forces
    fg.d3Force('charge')?.strength?.(-(30 + f.repel * 470))
    fg.d3Force('link')?.distance?.(20 + f.linkDistance * 230)
    fg.d3Force('link')?.strength?.(0.1 + f.linkForce * 0.9)
    fg.d3Force('center', null) // drop the library's default centering
    fg.d3Force('x', forceX(0).strength(f.center * 0.5))
    fg.d3Force('y', forceY(0).strength(f.center * 0.5))
    fg.d3Force(
      'collide',
      forceCollide<FGNode>((n) => {
        const labelW = labelsRef.current.get(n.id)?.w ?? 60
        return Math.max(radiusOf(n) + 4, labelW / 2 + 6)
      }).strength(1),
    )
    fg.d3ReheatSimulation()
  }, [Comp, settings.forces, radiusOf])

  // Position + show/hide every HTML label for the current frame. Called on each
  // canvas frame (onRenderFramePost) and once after (re)building the elements.
  // `k` is the current zoom. Label fade threshold comes from the Display slider.
  const syncLabels = (k: number) => {
    const fg = fgRef.current
    if (!fg) return
    const active = highlightIds != null
    // Higher "text fade threshold" → labels appear only when more zoomed in.
    const minLabelR = 0.5 + settings.display.textFade * 5
    const dragging = draggingRef.current

    const all = [...labelsRef.current.values()].filter(
      (v) => v.n.x != null && v.n.y != null,
    )
    // Snapshot live positions so the next data rebuild can seed them back (no relayout).
    for (const v of all)
      posRef.current.set(v.n.id, { x: v.n.x as number, y: v.n.y as number })

    // Cull to the labels that will actually show, THEN de-overlap only those — this
    // bounds the O(n²) placement pass to visible labels (a handful when zoomed out
    // or hovering), which is what keeps a big graph smooth while the sim runs hot.
    type Cand = {
      v: Label
      sp: { x: number; y: number }
      screenR: number
      show: boolean
      focus: boolean
    }
    const shown: Cand[] = []
    for (const v of all) {
      const n = v.n
      if (!nodeVisible(n)) {
        v.el.style.display = 'none'
        continue
      }
      const focus = n.id === selectedId || n.id === hoverId
      // When something is active, only its highlight set is labelled.
      if (active && !highlightIds.has(n.id)) {
        v.el.style.display = 'none'
        continue
      }
      const show = focus || active
      const screenR = radiusOf(n) * k
      // Obsidian's text fade: drop a resting label when its dot is a speck.
      if (!show && screenR < minLabelR) {
        v.el.style.display = 'none'
        continue
      }
      shown.push({
        v,
        sp: fg.graph2ScreenCoords(n.x as number, n.y as number),
        screenR,
        show,
        focus,
      })
    }

    // Focused first, then biggest — important labels claim space first.
    shown.sort((a, b) => {
      if (a.focus !== b.focus) return a.focus ? -1 : 1
      return b.screenR - a.screenR
    })

    // Screen-space boxes of the shown dots, so a resting label avoids sitting on one.
    const dotBoxes: Box[] = shown.map(({ sp, screenR }) => ({
      x0: sp.x - screenR,
      y0: sp.y - screenR,
      x1: sp.x + screenR,
      y1: sp.y + screenR,
    }))

    const placed: Box[] = []
    for (const { v, sp, screenR, show } of shown) {
      const hw = v.w / 2
      const hh = LABEL_H / 2

      // Label-centre candidates around the dot, nearest-first: below, above, right,
      // left, then the four diagonals. A resting label takes the first spot clear of
      // both placed labels AND dots; if none, it still shows below. Focused labels
      // always sit below.
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
      // Skip the de-overlap search while dragging (sim is hot, fires every frame) —
      // resting labels just drop below their dot until the drag ends.
      if (!show && !dragging) {
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
  // Elements live across hover/zoom (only their transform is touched per frame).
  // Width is measured once here and cached for de-overlap.
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
      v.el.style.textShadow = c.labelShadow
      v.el.textContent = n.name
      v.w = v.el.offsetWidth // measure once (one reflow); cached for de-overlap
    }
    // Place immediately so a settled graph (e.g. after a theme toggle) shows labels
    // without waiting for the next pan/zoom to trigger a frame.
    syncLabels(fgRef.current?.zoom() ?? 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphData, resolvedTheme, Comp])

  // Is a link "lit"? Lit when both endpoints are in the highlight set. null =
  // nothing active, so links keep their resting style.
  const linkLit = (l: FGLink): boolean | null => {
    if (!highlightIds) return null
    return (
      highlightIds.has(endpointId(l.source)) && highlightIds.has(endpointId(l.target))
    )
  }
  const linkColorOf = (l: FGLink) => {
    const lit = linkLit(l)
    if (lit == null) return c.link
    return lit ? c.linkOn : c.linkOff
  }

  // Camera helpers for the bottom-right zoom controls.
  const zoomBy = (factor: number) => {
    const fg = fgRef.current
    if (!fg) return
    fg.zoom(fg.zoom() * factor, 200)
  }
  const fitView = () => fgRef.current?.zoomToFit(400, 70)

  const ann = menu ? annotationsByConceptId?.get(menu.node.id) : undefined

  if (data.nodes.length === 0) {
    return (
      <div
        ref={wrapRef}
        className="flex h-full w-full items-center justify-center bg-white dark:bg-[#1e1e1e]"
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
      className="relative h-full w-full overflow-hidden bg-white dark:bg-[#1e1e1e]"
      style={{ cursor: hoverId ? 'pointer' : 'default' }}
      // Suppress the browser menu so our node right-click menu is the only one.
      onContextMenu={(e) => e.preventDefault()}
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
          nodeVisibility={(n: FGNode) => nodeVisible(n)}
          linkVisibility={(l: FGLink) =>
            nodeVisible(l.source as FGNode) && nodeVisible(l.target as FGNode)
          }
          onNodeHover={(n: FGNode | null) => setHoverId(n ? n.id : null)}
          onNodeClick={(n: FGNode) => onSelectId(selectedId === n.id ? null : n.id)}
          onNodeRightClick={(n: FGNode, e: MouseEvent) => {
            e.preventDefault()
            setMenu({ x: e.clientX, y: e.clientY, node: n })
          }}
          // While dragging, syncLabels degrades (skips de-overlap) to stay smooth.
          onNodeDrag={() => {
            draggingRef.current = true
          }}
          // Pin a node where the user drops it; cache so a later rebuild resumes it.
          onNodeDragEnd={(n: FGNode) => {
            draggingRef.current = false
            n.fx = n.x
            n.fy = n.y
            if (n.x != null && n.y != null)
              posRef.current.set(n.id, { x: n.x, y: n.y })
          }}
          onBackgroundClick={() => {
            setMenu(null)
            onSelectId(null)
          }}
          cooldownTicks={120}
          onEngineStop={() => {
            if (!pendingFitRef.current) return
            pendingFitRef.current = false
            fgRef.current?.zoomToFit(400, 70)
          }}
          linkColor={(l: FGLink) => linkColorOf(l)}
          linkWidth={(l: FGLink) => {
            const t = 0.5 + settings.display.linkThickness * 2
            return linkLit(l)
              ? Math.min((1.2 + l.weight * 0.6) * t, 6)
              : Math.min((0.7 + l.weight * 0.45) * t, 5)
          }}
          linkDirectionalArrowLength={settings.display.arrows ? 3.5 : 0}
          linkDirectionalArrowRelPos={1}
          linkDirectionalArrowColor={(l: FGLink) => linkColorOf(l)}
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
            const active = highlightIds != null
            const dim = active && !highlightIds.has(n.id)
            const isHover = n.id === hoverId
            const isSelected = n.id === selectedId

            // Hovered node grows a touch; the rest keep their size.
            const r = radiusOf(n) * (isHover ? 1.15 : 1)
            ctx.globalAlpha = dim ? c.dim : 1

            ctx.beginPath()
            ctx.arc(x, y, r, 0, 2 * Math.PI)
            ctx.fillStyle = colorOf(n)
            ctx.fill()

            // Accent ring marks the hovered / selected node (Obsidian highlight).
            if (isSelected || isHover) {
              ctx.lineWidth = 1.5 / scale
              ctx.strokeStyle = c.accent
              ctx.stroke()
            }

            // Mentor annotation markers — drawn at full opacity even on a dimmed
            // node. Green ring = highlight (good direction); amber ring + corner
            // badge = flag.
            const a = annotationsByConceptId?.get(n.id)
            if (a && (a.highlight || a.flag)) {
              ctx.globalAlpha = 1
              if (a.highlight) {
                ctx.beginPath()
                ctx.arc(x, y, r + 3 / scale, 0, 2 * Math.PI)
                ctx.lineWidth = 2 / scale
                ctx.strokeStyle = '#22c55e'
                ctx.stroke()
              }
              if (a.flag) {
                ctx.beginPath()
                ctx.arc(x, y, r + (a.highlight ? 6 : 3) / scale, 0, 2 * Math.PI)
                ctx.lineWidth = 2 / scale
                ctx.strokeStyle = '#f59e0b'
                ctx.stroke()
                ctx.beginPath()
                ctx.arc(x + r * 0.72, y - r * 0.72, 2.6 / scale, 0, 2 * Math.PI)
                ctx.fillStyle = '#f59e0b'
                ctx.fill()
              }
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

      {/* Bottom-right zoom controls (Obsidian graph chrome). */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1">
        {[
          { key: 'in', icon: ZoomIn, label: 'Zoom in', onClick: () => zoomBy(1.3) },
          { key: 'out', icon: ZoomOut, label: 'Zoom out', onClick: () => zoomBy(1 / 1.3) },
          { key: 'fit', icon: Maximize2, label: 'Fit view', onClick: fitView },
        ].map(({ key, icon: Icon, label, onClick }) => (
          <button
            key={key}
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            className="flex size-7 items-center justify-center rounded-md border border-border bg-background/80 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-accent"
          >
            <Icon className="size-4" />
          </button>
        ))}
      </div>

      {/* Node right-click menu (Obsidian context menu). */}
      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
          <div
            className="fixed z-50 min-w-40 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
            style={{ left: menu.x, top: menu.y }}
          >
            <MenuItem
              icon={SquareArrowOutUpRight}
              label="Open"
              onClick={() => {
                onSelectId(menu.node.id)
                setMenu(null)
              }}
            />
            {canEdit && onToggleHighlight && (
              <MenuItem
                icon={Highlighter}
                label={ann?.highlight ? 'Remove highlight' : 'Highlight'}
                onClick={() => {
                  onToggleHighlight(menu.node.id)
                  setMenu(null)
                }}
              />
            )}
            {canEdit && onToggleFlag && (
              <MenuItem
                icon={Flag}
                label={ann?.flag ? 'Remove flag' : 'Flag'}
                onClick={() => {
                  onToggleFlag(menu.node.id)
                  setMenu(null)
                }}
              />
            )}
            {canEdit && onDeleteConcept && (
              <MenuItem
                icon={Trash2}
                label="Delete"
                destructive
                onClick={() => {
                  onDeleteConcept(menu.node.id)
                  setMenu(null)
                }}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors ' +
        (destructive
          ? 'text-destructive hover:bg-destructive/10'
          : 'hover:bg-accent hover:text-accent-foreground')
      }
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  )
}
