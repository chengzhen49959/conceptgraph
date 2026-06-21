'use client'

// The Obsidian-style graph control panel's entire state lives here, in one place:
// GraphControls writes it, GraphCanvas reads it. Persisted to localStorage per
// workspace (Obsidian keeps graph settings as a local per-vault preference — no
// backend, no migration). Slider values are normalised 0..1; GraphCanvas owns the
// translation to d3-force units and pixel sizes, so this module stays pure data.

import { useCallback, useEffect, useState } from 'react'

/** A colour group: nodes whose name matches `query` are painted `color`. */
export type GraphGroup = { id: string; query: string; color: string }

export type GraphSettings = {
  filters: {
    search: string
    // tags/attachments/existingOnly have no concept-graph equivalent yet — they
    // exist so the panel mirrors Obsidian's; they currently filter nothing.
    tags: boolean
    attachments: boolean
    existingOnly: boolean
    // The one real filter: hide nodes with no connections when off.
    orphans: boolean
  }
  groups: GraphGroup[]
  display: {
    arrows: boolean
    textFade: number // label fade-in threshold (higher = labels appear later)
    nodeSize: number // global radius multiplier (0.5 ≈ 1×)
    linkThickness: number // global link-width multiplier
  }
  forces: {
    center: number
    repel: number
    linkForce: number
    linkDistance: number
  }
}

/** Patch shape for `useGraphSettings`'s setter: any subset of sections; `groups`
 *  is replaced wholesale (it's an array), the rest shallow-merge. */
export type GraphSettingsPatch = {
  filters?: Partial<GraphSettings['filters']>
  groups?: GraphGroup[]
  display?: Partial<GraphSettings['display']>
  forces?: Partial<GraphSettings['forces']>
}

export const DEFAULT_SETTINGS: GraphSettings = {
  filters: { search: '', tags: true, attachments: true, existingOnly: false, orphans: true },
  groups: [],
  display: { arrows: false, textFade: 0.5, nodeSize: 0.5, linkThickness: 0.3 },
  forces: { center: 0.3, repel: 0.4, linkForce: 0.5, linkDistance: 0.4 },
}

/** Swatches offered when picking a group colour (Obsidian-leaning hues). */
export const GROUP_COLORS = [
  '#e0533d', '#e0823d', '#dbb40c', '#5fb33d',
  '#3da5e0', '#7c6fdc', '#c44ec4', '#e0517f',
]

/** A fresh, empty group seeded with the first preset colour. */
export const newGroup = (): GraphGroup => ({
  id: crypto.randomUUID(),
  query: '',
  color: GROUP_COLORS[0],
})

/** First group whose (non-empty) query is a case-insensitive substring of the
 *  node name; null when nothing matches (→ caller uses the default node colour). */
export function groupColorOf(name: string, groups: GraphGroup[]): string | null {
  const lower = name.toLowerCase()
  for (const g of groups) {
    const q = g.query.trim().toLowerCase()
    if (q && lower.includes(q)) return g.color
  }
  return null
}

// Shallow-merge each section over a base; `groups` is taken whole. Untouched
// sections keep their identity (no needless `{...}`) so consumers can depend on
// `settings.forces` etc. without re-firing when an unrelated section changed.
// Doubles as the load-time reconciler (base = DEFAULT_SETTINGS) so a stored blob
// missing newer keys still gets their defaults.
function merge(base: GraphSettings, patch: GraphSettingsPatch): GraphSettings {
  return {
    filters: patch.filters ? { ...base.filters, ...patch.filters } : base.filters,
    groups: patch.groups ?? base.groups,
    display: patch.display ? { ...base.display, ...patch.display } : base.display,
    forces: patch.forces ? { ...base.forces, ...patch.forces } : base.forces,
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
