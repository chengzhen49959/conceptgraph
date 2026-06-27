'use client'

import { Fragment, type ComponentType, type ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

/**
 * One entry in a sidebar row's action menu. A row declares its actions **once**;
 * the same array is rendered into both the right-click `ContextMenu` and the
 * hover `⋯` `DropdownMenu` (`RowContextMenu` + `RowOverflow` below), so every row
 * — document, topic, concept — gets one consistent operation model instead of a
 * per-feature grab-bag of swipes / dots / eyes. Single-object actions live here;
 * batch actions stay on the section header's Select toggle.
 */
export type RowAction = {
  icon: ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  /** Render in the destructive (red) style — e.g. Delete. */
  destructive?: boolean
  /** Draw a separator above this item (group a trailing Delete off the rest). */
  separatorBefore?: boolean
}

const itemClass = (a: RowAction) =>
  cn('gap-2', a.destructive && 'text-destructive focus:text-destructive')

/**
 * Wrap a row so right-clicking anywhere on it opens its action menu (the desktop
 * standard — Notion / Linear / VS Code / Figma). Renders children unwrapped when
 * there are no actions, so there's never a dead trigger.
 */
export function RowContextMenu({
  actions,
  children,
}: {
  actions: RowAction[]
  children: ReactNode
}) {
  if (actions.length === 0) return <>{children}</>
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {actions.map((a, i) => (
          <Fragment key={a.label}>
            {a.separatorBefore && i > 0 && <ContextMenuSeparator />}
            <ContextMenuItem className={itemClass(a)} onSelect={() => a.onClick()}>
              <a.icon className="size-4" />
              {a.label}
            </ContextMenuItem>
          </Fragment>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  )
}

/**
 * The hover-revealed `⋯` overflow button for a row — the same actions as the
 * right-click menu, for users who don't think to right-click (discoverable +
 * pointer-only friendly). The caller positions it (absolute) and gates its
 * visibility on row hover via `className`.
 */
export function RowOverflow({
  actions,
  label,
  className,
}: {
  actions: RowAction[]
  label: string
  className?: string
}) {
  if (actions.length === 0) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          // Don't let the trigger click bubble to the row (open / focus / select).
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'flex aspect-square w-5 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            className,
          )}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {actions.map((a, i) => (
          <Fragment key={a.label}>
            {a.separatorBefore && i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem className={itemClass(a)} onSelect={() => a.onClick()}>
              <a.icon className="size-4" />
              {a.label}
            </DropdownMenuItem>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
