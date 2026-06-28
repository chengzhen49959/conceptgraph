/**
 * Project icons — the single source of truth for the Notion-style workspace
 * icon picker and every place a workspace icon renders.
 *
 * Icons come from IconPark (`@icon-park/react`). We import a curated, research-
 * relevant subset by name so the bundle stays small (importing `.../es/all`
 * would pull in 2000+ icons). A workspace stores only the icon *name* + an
 * accent colour; `<ProjectIcon>` is the one component that turns that pair into
 * pixels, so callers never touch IconPark directly.
 */
import {
  Analysis,
  Blackboard,
  Book,
  Bookmark,
  Bookshelf,
  Brain,
  Calculator,
  ChartGraph,
  ChartHistogram,
  ChartLine,
  ChartPie,
  Code,
  Compass,
  Connection,
  DataAll,
  Experiment,
  Flask,
  Formula,
  Hourglass,
  Microscope,
  NetworkTree,
  Notebook,
  Notes,
  Planet,
  Rocket,
  Search,
  Seedling,
  Target,
  Telescope,
  Terminal,
  TestTube,
  Tree,
} from '@icon-park/react'

// IconPark components share this prop shape; typing it here avoids importing
// their internal types and keeps `<ProjectIcon>` self-contained.
type IconPark = React.ComponentType<{
  theme?: 'outline' | 'filled' | 'two-tone' | 'multi-color'
  size?: number | string
  fill?: string | string[]
  strokeWidth?: number
  className?: string
}>

/** Curated picker set: IconPark name → component. The name is what we persist. */
export const PROJECT_ICONS: Record<string, IconPark> = {
  Microscope,
  Experiment,
  Flask,
  TestTube,
  Brain,
  Blackboard,
  Book,
  Bookshelf,
  Notebook,
  Notes,
  ChartLine,
  ChartHistogram,
  ChartPie,
  ChartGraph,
  DataAll,
  Analysis,
  Search,
  Telescope,
  Formula,
  Calculator,
  Rocket,
  Target,
  Compass,
  Planet,
  NetworkTree,
  Connection,
  Code,
  Terminal,
  Seedling,
  Tree,
  Bookmark,
  Hourglass,
}

/** Ordered list for the picker grid (object key order isn't guaranteed). */
export const PROJECT_ICON_NAMES = Object.keys(PROJECT_ICONS)

export const DEFAULT_ICON = 'Book'

/**
 * Render a workspace icon. Custom workspaces (and any with a stored icon) get a
 * bare monochrome IconPark glyph that inherits the surrounding text colour —
 * matching the shadcn/lucide icons used elsewhere (no accent colour, no tinted
 * tile). `name` is an IconPark icon name; unknown/empty falls back to the
 * default. The **personal** workspace has a fixed brand identity: with no stored
 * icon it shows the app's orb mark (`/orb.png`, a raster badge — not a glyph, so
 * it does not inherit `currentColor`); a stored icon still wins.
 */
export function ProjectIcon({
  name,
  size = 16,
  personal = false,
  className = '',
}: {
  name?: string | null
  size?: number
  personal?: boolean
  className?: string
}) {
  const stored = PROJECT_ICONS[name ?? '']
  if (personal && !stored) {
    // eslint-disable-next-line @next/next/no-img-element -- a tiny static brand
    // asset; next/image's optimisation pipeline buys nothing at icon sizes.
    return (
      <img
        src="/orb.png"
        alt=""
        width={size}
        height={size}
        draggable={false}
        // A white rounded app-icon badge; the ring gives a hairline edge so the
        // white badge still separates from a light background.
        className={`shrink-0 rounded-[22%] object-contain ring-1 ring-black/10 ${className}`}
      />
    )
  }
  const Icon = stored ?? PROJECT_ICONS[DEFAULT_ICON]
  return (
    <Icon
      theme="outline"
      size={size}
      fill="currentColor"
      strokeWidth={4}
      className={className}
    />
  )
}
