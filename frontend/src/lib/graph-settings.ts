'use client'

// The graph control panel's entire state lives here, in one place: the sidebar
// control sections write it, GraphCanvas reads it. Persisted to localStorage per
// workspace (Obsidian keeps graph settings as a local per-vault preference — no
// backend, no migration). Slider values are normalised 0..1; GraphCanvas owns the
// translation to d3-force units and pixel sizes, so this module stays pure data.

import { useCallback, useEffect, useState } from 'react'

export type GraphSettings = {
  filters: {
    // Cluster ids whose concepts are hidden on the canvas (the sidebar Topics
    // eye-toggle writes this).
    hiddenTopics: string[]
    // Hide nodes with no connections when off (the Display panel's Orphans toggle).
    orphans: boolean
  }
  // Per-topic colour overrides (clusterId → colour); default comes from
  // clusterColorMap. A topic IS the colour group — there is no separate manual
  // grouping. The sidebar Topics section is the single home for colour + hide.
  topicColors: Record<string, string>
  display: {
    arrows: boolean
    nodeSize: number // global radius multiplier (0.5 ≈ 1×)
    linkThickness: number // global link-width multiplier
  }
  forces: {
    center: number
    repel: number
    linkForce: number
    linkDistance: number
  }
  // Local graph mode: when on and a concept is selected, show only its
  // `depth`-hop neighbourhood (Obsidian's local graph).
  local: {
    enabled: boolean
    depth: number
  }
}

/** Patch shape for `useGraphSettings`'s setter: any subset of sections. Arrays
 *  (`filters.hiddenTopics`) are replaced wholesale; objects shallow-merge. */
export type GraphSettingsPatch = {
  filters?: Partial<GraphSettings['filters']>
  topicColors?: Record<string, string>
  display?: Partial<GraphSettings['display']>
  forces?: Partial<GraphSettings['forces']>
  local?: Partial<GraphSettings['local']>
}

export const DEFAULT_SETTINGS: GraphSettings = {
  filters: { hiddenTopics: [], orphans: true },
  topicColors: {},
  display: { arrows: false, nodeSize: 0.5, linkThickness: 0.3 },
  forces: { center: 0.3, repel: 0.5, linkForce: 0.5, linkDistance: 0.5 },
  local: { enabled: false, depth: 1 },
}

/** Swatches offered when picking a topic colour (Obsidian-leaning hues). */
export const SWATCH_COLORS = [
  '#e0533d', '#e0823d', '#dbb40c', '#5fb33d',
  '#3da5e0', '#7c6fdc', '#c44ec4', '#e0517f',
]

/** A topic's colour: its override if set, else the palette fallback. */
export function topicColorOf(
  clusterId: string | null,
  topicColors: Record<string, string>,
  fallback: (id: string | null) => string,
): string {
  if (clusterId && topicColors[clusterId]) return topicColors[clusterId]
  return fallback(clusterId)
}

// Shallow-merge each section over a base; arrays replace whole. Untouched sections
// keep their identity (no needless `{...}`) so consumers can depend on
// `settings.forces` etc. without re-firing when an unrelated section changed.
// Doubles as the load-time reconciler (base = DEFAULT_SETTINGS) so a stored blob
// missing newer keys still gets their defaults — and a stale `groups` key from an
// older build is simply dropped (it isn't read here).
function merge(base: GraphSettings, patch: GraphSettingsPatch): GraphSettings {
  return {
    filters: patch.filters ? { ...base.filters, ...patch.filters } : base.filters,
    topicColors: patch.topicColors
      ? { ...base.topicColors, ...patch.topicColors }
      : base.topicColors,
    display: patch.display ? { ...base.display, ...patch.display } : base.display,
    forces: patch.forces ? { ...base.forces, ...patch.forces } : base.forces,
    local: patch.local ? { ...base.local, ...patch.local } : base.local,
  }
}

const keyFor = (workspaceId: string | undefined) =>
  `graph-settings:${workspaceId ?? 'personal'}`

/**
 * Graph control-panel state for one workspace, persisted to localStorage.
 * Returns `[settings, patch]`. Starts from DEFAULT_SETTINGS on the server and the
 * first client render (so SSR markup matches), then loads the stored value in an
 * effect — avoiding a hydration mismatch. `patch` deep-merges and writes back.
 */
export function useGraphSettings(
  workspaceId: string | undefined,
): [GraphSettings, (patch: GraphSettingsPatch) => void] {
  const [settings, setSettings] = useState<GraphSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(keyFor(workspaceId))
      setSettings(raw ? merge(DEFAULT_SETTINGS, JSON.parse(raw)) : DEFAULT_SETTINGS)
    } catch {
      setSettings(DEFAULT_SETTINGS)
    }
  }, [workspaceId])

  const patch = useCallback(
    (p: GraphSettingsPatch) => {
      setSettings((prev) => {
        const next = merge(prev, p)
        try {
          localStorage.setItem(keyFor(workspaceId), JSON.stringify(next))
        } catch {
          // storage unavailable (private mode / quota) — keep in-memory only
        }
        return next
      })
    },
    [workspaceId],
  )

  return [settings, patch]
}
