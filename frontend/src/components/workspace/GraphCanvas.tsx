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
  // Pan the camera so world (x,y) sits at the viewport centre; animates over ms.
  centerAt: (x?: number, y?: number, ms?: number) => void
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
  focusedClusterId,
  highlightConceptId,
  highlightConceptIds,
  annotationsByConceptId,
  canEdit = false,
  onToggleHighlight,
  onToggleFlag,
  onDeleteConcept,
  restrictToIds,
  thumbnail = false,
}: {
  data: GraphData
  /** The Obsidian-style control-panel state (filters, groups, display, forces). */
  settings: GraphSettings
  selectedId: string | null
  onSelectId: (id: string | null) => void
  /** When set, the render graph is narrowed to exactly these concept ids — a real
   *  sub-graph (the reading-view local graph for the open document), not the full
   *  graph with outsiders hidden. Undefined = the whole workspace graph. */
  restrictToIds?: ReadonlySet<string>
  /** Render as the small reading-view thumbnail: keep the camera auto-fit to the
   *  current content (which changes when the scope toggles local↔global). */
  thumbnail?: boolean
  /** Topic the sidebar is hovering — light all its member concepts. */
  highlightClusterId: string | null
  /** Topic focused from search — like a node selection: lights its whole cluster
   *  and pans it to centre. Persistent (unlike the transient hover above). */
  focusedClusterId: string | null
  /** Concept the sidebar is hovering — light it and its neighbours. */
  highlightConceptId: string | null
  /** An explicit set of concepts to light (the rest dim). Used by the global
   *  fullscreen graph to highlight the open document's concepts within the whole
   *  workspace. When set, it overrides the cluster/concept highlight above. */
  highlightConceptIds?: ReadonlySet<string>
  /** Open annotation markers per concept: green ring = highlight, amber = flag. */
  annotationsByConceptId?: Map<string, { highlight: boolean; flag: boolean }>
  /** Editor/owner — gates the editing items in the node right-click menu. */
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
  // pass during the drag to keep it smooth.
  const draggingRef = useRef(false)

  const [Comp, setComp] = useState<ForceGraphComponent | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [hoverId, setHoverId] = useState<string | null>(null)
  // Set to the node being dragged so its edges + neighbours light up and everything
  // else dims for the whole drag (Obsidian's drag emphasis). Hover can drop out
  // mid-drag, so we track this explicitly instead of leaning on hoverId.
  const [dragId, setDragId] = useState<string | null>(null)
  const [menu, setMenu] = useState<Menu | null>(null)

  // Eased highlight strength: 0 = resting, 1 = fully focused. Drives the smooth
  // fade of dimmed nodes/links so hover + cluster highlight breathe in and out
  // instead of hard-cutting (Obsidian's soft focus transition).
  const focusRef = useRef(0)
  // The highlight set currently being rendered. Held through the fade-OUT (after
  // highlightIds drops to null) so the dim can ease back instead of snapping.
  const activeSetRef = useRef<Set<string> | null>(null)
  const focusRafRef = useRef<number | null>(null)
  // While a fade is in flight we turn autoPauseRedraw off so the canvas keeps
  // repainting — it otherwise stops once the sim settles, freezing the fade.
  const [liveRedraw, setLiveRedraw] = useState(false)

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

  // Stable signature of the active restriction (the open document's concept set).
  // Folded into the graphData gate so switching documents rebuilds the local graph,
  // while an unrelated same-shape refetch does not.
  const restrictKey = useMemo(
    () => (restrictToIds ? [...restrictToIds].sort().join(',') : ''),
    [restrictToIds],
  )

  // Flat render graph. Workspace view: every concept and every edge (Obsidian shows
  // one global graph — no super-nodes, no drill-in). Reading view: `restrictToIds`
  // narrows it to the open document's concepts and the edges among them — a genuine
  // sub-graph, NOT the full graph with outsiders hidden, so the simulation lays the
  // document's concepts out as their own compact ball and the camera frames them to
  // fill the pane (Obsidian's local-graph thumbnail). Nodes are seeded with their
  // cached position so a topology-change re-heat resumes the layout.
  const graphData = useMemo(() => {
    const allow = restrictToIds
    const src = allow ? data.nodes.filter((n) => allow.has(n.id)) : data.nodes
    const nodes: FGNode[] = src.map((n) => {
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
    // topoSig + restrictKey gate rebuilds; data is read fresh in the closure when they change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topoSig, restrictKey])

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
  // layout stable: filtering never re-heats the simulation. (The reading-view
  // document scope is applied upstream in graphData as a real sub-graph, not here.)
  const nodeVisible = useCallback(
    (n: FGNode) => {
      if (!settings.filters.orphans && (degreeOf.get(n.id) ?? 0) === 0) return false
      if (n.cluster_id && settings.filters.hiddenTopics.includes(n.cluster_id)) return false
      if (localSet && !localSet.has(n.id)) return false
      return true
    },
    [settings.filters.orphans, settings.filters.hiddenTopics, degreeOf, localSet],
  )

  // Highlight requested from outside the canvas. An explicit id set wins (the global
  // fullscreen graph passes the open document's concepts, to light them within the
  // whole workspace). Else: hovering a topic lights all its concepts; hovering a
  // concept lights it + neighbours. Empty → null (no dimming).
  const externalHighlight = useMemo(() => {
    if (highlightConceptIds && highlightConceptIds.size)
      return new Set(highlightConceptIds)
    // A hovered topic wins over a focused one (the user is actively pointing);
    // both light the whole cluster.
    const cluster = highlightClusterId ?? focusedClusterId
    let raw: string[] = []
    if (cluster) {
      raw = graphData.nodes
        .filter((n) => n.cluster_id === cluster)
        .map((n) => n.id)
    } else if (highlightConceptId && neighbors.has(highlightConceptId)) {
      raw = [highlightConceptId, ...(neighbors.get(highlightConceptId) ?? [])]
    }
    const set = new Set(raw)
    return set.size ? set : null
  }, [highlightConceptIds, highlightClusterId, focusedClusterId, highlightConceptId, graphData, neighbors])

  // Resting style unless something is active. Priority: canvas hover, then sidebar
  // hover, then a persistent selection.
  const setOf = (id: string) => new Set<string>([id, ...(neighbors.get(id) ?? [])])
  const highlightIds = useMemo(() => {
    if (dragId) return setOf(dragId)
    if (hoverId) return setOf(hoverId)
    if (externalHighlight) return externalHighlight
    if (selectedId) return setOf(selectedId)
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragId, hoverId, selectedId, externalHighlight, neighbors])

  // Ease focusRef toward the live highlight target whenever it changes, keeping
  // the canvas repainting (autoPauseRedraw off) only for the duration of the
  // fade. Adopt the newest set on the way in; hold the old set on the way out so
  // the dim eases back before we forget it.
  useEffect(() => {
    const target = highlightIds != null ? 1 : 0
    if (highlightIds != null) activeSetRef.current = highlightIds
    // Membership (activeSetRef) can change even when focusRef is already at the
    // target — e.g. hover jumps straight from one topic to another, so the set
    // swaps A→B with no fade. The canvas is otherwise paused (autoPauseRedraw),
    // so we must keep it live for a frame or it freezes on the previous set's
    // frame and the area you're now pointing at stays dimmed.
    setLiveRedraw(true)
    if (Math.abs(focusRef.current - target) < 0.001) {
      focusRef.current = target
      if (target === 0) activeSetRef.current = null
      // No ease to run, but give the canvas two frames to paint the new
      // membership before letting it settle (pause) again.
      let raf2 = 0
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setLiveRedraw(false))
      })
      return () => {
        cancelAnimationFrame(raf1)
        cancelAnimationFrame(raf2)
      }
    }
    let last = performance.now()
    const tick = (now: number) => {
      const dt = now - last
      last = now
      // Exponential ease-out; tau≈55ms → ~200ms perceived settle.
      focusRef.current += (target - focusRef.current) * (1 - Math.exp(-dt / 55))
      if (Math.abs(focusRef.current - target) < 0.01) {
        focusRef.current = target
        if (target === 0) activeSetRef.current = null
        focusRafRef.current = null
        setLiveRedraw(false)
        return
      }
      focusRafRef.current = requestAnimationFrame(tick)
    }
    focusRafRef.current = requestAnimationFrame(tick)
    return () => {
      if (focusRafRef.current != null) cancelAnimationFrame(focusRafRef.current)
      focusRafRef.current = null
    }
  }, [highlightIds])

  // Pan the selected node + its 1-hop neighbours to the canvas centre, keeping the
  // current zoom. Re-runs when the canvas resizes (the right panel mounting shrinks
  // it), so the cluster ends up centred in the *visible* area, not behind the panel.
  useEffect(() => {
    if (!selectedId) return
    const fg = fgRef.current
    if (!fg) return
    const ids = setOf(selectedId)
    const pts = graphData.nodes.filter(
      (n) => ids.has(n.id) && n.x != null && n.y != null,
    )
    if (pts.length === 0) return
    const cx = pts.reduce((s, n) => s + (n.x as number), 0) / pts.length
    const cy = pts.reduce((s, n) => s + (n.y as number), 0) / pts.length
    const raf = requestAnimationFrame(() => fg.centerAt(cx, cy, 400))
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, size.w, size.h])

  // The topic analogue of selecting a node: zoom-and-pan to frame the whole
  // focused cluster. zoomToFit (not centerAt) so the camera also scales — the
  // cluster fills the view regardless of how spread out it is.
  useEffect(() => {
    if (!focusedClusterId) return
    const fg = fgRef.current
    if (!fg) return
    const ready = graphData.nodes.some(
      (n) => n.cluster_id === focusedClusterId && n.x != null,
    )
    if (!ready) return
    const raf = requestAnimationFrame(() =>
      fg.zoomToFit(600, 80, (n) => n.cluster_id === focusedClusterId),
    )
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedClusterId, size.w, size.h])

  // Thumbnail (reading-view): keep the graph framed to fill the small pane through
  // every change. Toggling scope (local↔global) or switching documents rebuilds the
  // node set and re-heats the sim — re-arm the one-shot fit so the settle
  // (onEngineStop) frames the new set. A pane resize doesn't re-heat, so also fit
  // directly once the layout already has positions. The full workspace view
  // (thumbnail=false) keeps its passive camera, untouched.
  useEffect(() => {
    if (!thumbnail) return
    pendingFitRef.current = true
    const fg = fgRef.current
    if (!fg || !graphData.nodes.some((n) => n.x != null)) return
    const raf = requestAnimationFrame(() => fg.zoomToFit(500, 50))
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thumbnail, restrictKey, size.w, size.h])

  // Apply the Forces panel to the simulation and re-heat. Repel = charge strength,
  // Link distance/force = the link force, Center = a gentle pull toward the origin
  // (replaces the default centering force so the slider actually controls it).
  // collide just keeps node dots from overlapping (radius ≈ the dot, like
  // Obsidian). Label de-overlap is handled at render time in syncLabels, NOT by
  // the physics — a label-width collide radius made the layout stiff and buzz on a
  // drag reheat. Re-runs on a forces change, a node size change, or a topology change.
  useEffect(() => {
    const fg = fgRef.current
    if (!fg) return
    const f = settings.forces
    fg.d3Force('charge')?.strength?.(-(30 + f.repel * 1200))
    fg.d3Force('link')?.distance?.(20 + f.linkDistance * 230)
    fg.d3Force('link')?.strength?.(0.1 + f.linkForce * 0.9)
    fg.d3Force('center', null) // drop the library's default centering
    fg.d3Force('x', forceX(0).strength(f.center * 0.5))
    fg.d3Force('y', forceY(0).strength(f.center * 0.5))
    fg.d3Force('collide', forceCollide<FGNode>((n) => radiusOf(n) + 6).strength(1))
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
    for (const { v, sp, screenR, show, focus } of shown) {
      const hw = v.w / 2
      const hh = LABEL_H / 2
      const boxAt = (lx: number, ly: number): Box => ({
        x0: lx - hw,
        y0: ly - hh,
        x1: lx + hw,
        y1: ly + hh,
      })

      // Label-centre candidates around the dot, nearest-first: below, above, right,
      // left, then the diagonals — repeated at growing radii so a dense cluster can
      // still find an open spot before giving up. centers[0] (just below) is the
      // resting home each label falls back to.
      const centers: [number, number][] = []
      for (const ring of [0, 1, 2]) {
        const ext = ring * (LABEL_H + 4)
        const oy = screenR + 7 + hh + ext
        const ox = screenR + 7 + hw + ext
        centers.push(
          [sp.x, sp.y + oy],
          [sp.x, sp.y - oy],
          [sp.x + ox, sp.y],
          [sp.x - ox, sp.y],
          [sp.x + ox, sp.y + oy],
          [sp.x - ox, sp.y + oy],
          [sp.x + ox, sp.y - oy],
          [sp.x - ox, sp.y - oy],
        )
      }

      // While dragging the sim fires every frame — skip the O(n²) de-overlap search
      // and drop every label below its dot until the drag ends.
      if (dragging) {
        const [bx, by] = centers[0]
        v.el.style.display = 'block'
        v.el.style.color = show ? c.labelHi : c.label
        v.el.style.transform = `translate(${Math.round(bx)}px, ${Math.round(by)}px) translate(-50%, -50%)`
        continue
      }

      // De-overlap EVERY shown label (focused, highlighted, and resting alike): take
      // the first candidate clear of every already-placed label AND every dot. No
      // open spot anywhere → hide the label rather than let two names overlap (the
      // hard rule), except the selected/hovered node, which sorts first and always
      // keeps its name below its dot.
      const free = centers.find(([cx, cy]) => {
        const b = boxAt(cx, cy)
        return (
          !placed.some((p) => overlaps(p, b)) &&
          !dotBoxes.some((d) => overlaps(d, b, 1))
        )
      })
      let lx: number
      let ly: number
      if (free) {
        ;[lx, ly] = free
      } else if (focus) {
        ;[lx, ly] = centers[0]
      } else {
        v.el.style.display = 'none'
        continue
      }
      placed.push(boxAt(lx, ly))

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

  // graphData is rebuilt only when topoSig (the node/edge id SET) changes, so the
  // layout never re-heats on a same-shape refetch. The cost: a node's render
  // attributes are frozen at first sight, but they DO drift — re-clustering
  // reassigns cluster_id on the same concepts, an edit renames one. Left stale, the
  // canvas reads an old cluster_id that clusterColorMap no longer knows and paints
  // every node grey, while the sidebar (which reads `data` straight) stays
  // coloured — and the same stale id makes the focus zoom-to-topic find no members
  // and never fire. Patch the changed attributes onto the existing node objects in
  // place (x/y untouched ⇒ no re-heat), refresh any renamed label, then flag one
  // repaint via a no-op zoom set so the new colours land.
  useEffect(() => {
    const fresh = new Map(data.nodes.map((n) => [n.id, n]))
    let dirty = false
    for (const node of graphData.nodes) {
      const f = fresh.get(node.id)
      if (!f) continue
      if (node.cluster_id !== f.cluster_id) {
        node.cluster_id = f.cluster_id
        dirty = true
      }
      if (node.name !== f.name) {
        node.name = f.name
        const lab = labelsRef.current.get(node.id)
        if (lab) {
          lab.el.textContent = f.name
          lab.w = lab.el.offsetWidth // re-measure for de-overlap
        }
        dirty = true
      }
    }
    if (!dirty) return
    const fg = fgRef.current
    if (!fg) return
    syncLabels(fg.zoom()) // a renamed label changed width — reposition
    fg.zoom(fg.zoom()) // flag needsRedraw so the recolour paints; does not re-heat
    // graphData is intentionally not a dep: it only changes when topoSig does, which
    // already rebuilds nodes with fresh attributes. Keying on `data` is the point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // Link colours share one rgb and differ only in alpha (see DARK/LIGHT), so the
  // fade just interpolates the alpha channel. Parse the three alphas + the
  // "rgba(r,g,b," prefix once per theme.
  const linkFade = useMemo(() => {
    const alphaOf = (s: string) => Number(s.match(/[\d.]+(?=\)$)/)?.[0] ?? '1')
    return {
      rest: alphaOf(c.link),
      on: alphaOf(c.linkOn),
      off: alphaOf(c.linkOff),
      at: (a: number) => c.link.replace(/[\d.]+\)$/, `${a})`),
    }
  }, [c])

  // Is a link "lit"? Lit when both endpoints are in the active set. null =
  // nothing active, so links keep their resting style. Uses the retained set so
  // links keep fading through the hover-OUT instead of snapping back.
  const linkLit = (l: FGLink): boolean | null => {
    const aset = activeSetRef.current
    if (!aset) return null
    return aset.has(endpointId(l.source)) && aset.has(endpointId(l.target))
  }
  const linkColorOf = (l: FGLink) => {
    const lit = linkLit(l)
    if (lit == null) return c.link
    const to = lit ? linkFade.on : linkFade.off
    return linkFade.at(linkFade.rest + (to - linkFade.rest) * focusRef.current)
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
          // Hovering a node lights it + its neighbours; its name surfaces through the
          // HTML label layer (the focus path in syncLabels). No richer peek card — it
          // was wider than the canvas and overlapped the side panel; the name alone is
          // the Obsidian hover.
          onNodeHover={(n: FGNode | null) => setHoverId(n ? n.id : null)}
          onNodeClick={(n: FGNode) => onSelectId(selectedId === n.id ? null : n.id)}
          onNodeRightClick={(n: FGNode, e: MouseEvent) => {
            e.preventDefault()
            setMenu({ x: e.clientX, y: e.clientY, node: n })
          }}
          // Neighbours follow the drag through the link force (Obsidian's springy
          // feel). On the first frame: mark the dragged node (lights its edges +
          // neighbours, dims the rest) AND clear every other node's pin so the whole
          // connected neighbourhood is free to move — including any node pinned by an
          // earlier drag (Obsidian keeps nothing nailed down). Guarded to fire once;
          // syncLabels also skips its de-overlap pass while dragging.
          onNodeDrag={(n: FGNode) => {
            if (draggingRef.current) return
            draggingRef.current = true
            setDragId(n.id)
            for (const node of graphData.nodes) {
              if (node === n) continue
              node.fx = undefined
              node.fy = undefined
            }
          }}
          // Release the dragged node on drop (don't pin it) so a later drag of a
          // neighbour can pull it too — Obsidian lets dropped nodes settle under the
          // forces rather than nailing them. syncLabels keeps posRef in sync every
          // frame, so a later rebuild still resumes from here.
          onNodeDragEnd={(n: FGNode) => {
            draggingRef.current = false
            setDragId(null)
            n.fx = undefined
            n.fy = undefined
          }}
          onBackgroundClick={() => {
            setMenu(null)
            onSelectId(null)
          }}
          // Friction above the d3 default (0.4). Damps the spring so neighbours
          // follow a drag smoothly instead of overshooting and ringing, and keeps
          // any forces/topology reheat from bouncing. ~Obsidian's settled feel.
          d3VelocityDecay={0.6}
          cooldownTicks={120}
          // Normally the canvas stops repainting once the sim settles. While a
          // highlight fade is in flight we keep it live so the transition shows.
          autoPauseRedraw={!liveRedraw}
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
            const f = focusRef.current
            const aset = activeSetRef.current
            const isMember = aset == null || aset.has(n.id)
            const isHover = n.id === hoverId
            const isSelected = n.id === selectedId

            // Hovered node grows a touch (eased in); the rest keep their size.
            const r = radiusOf(n) * (isHover ? 1 + 0.15 * f : 1)
            // Members stay full; everyone else eases toward c.dim as focus rises.
            ctx.globalAlpha = isMember ? 1 : 1 - (1 - c.dim) * f

            ctx.beginPath()
            ctx.arc(x, y, r, 0, 2 * Math.PI)
            ctx.fillStyle = colorOf(n)
            ctx.fill()

            // Accent ring marks the hovered / selected node (Obsidian highlight).
            // Selection ring is persistent; the hover ring eases in with focus.
            if (isSelected || isHover) {
              ctx.save()
              if (isHover && !isSelected) ctx.globalAlpha = f
              ctx.lineWidth = 1.5 / scale
              ctx.strokeStyle = c.accent
              ctx.stroke()
              ctx.restore()
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
