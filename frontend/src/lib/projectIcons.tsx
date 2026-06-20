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
  Home,
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
// The personal workspace has a fixed identity; its stored icon (if any) is ignored.
const PERSONAL_ICON = Home

/**
 * Render a workspace icon as a bare monochrome glyph that inherits the
 * surrounding text colour — matching the shadcn/lucide icons used elsewhere in
 * the UI (no accent colour, no tinted tile). `name` is an IconPark icon name;
 * unknown/empty falls back to the default. Pass `personal` for the personal
 * workspace: a stored icon still wins, but with none it shows the Home glyph
 * instead of the generic default.
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
  const Icon =
    PROJECT_ICONS[name ?? ''] ?? (personal ? PERSONAL_ICON : PROJECT_ICONS[DEFAULT_ICON])
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
