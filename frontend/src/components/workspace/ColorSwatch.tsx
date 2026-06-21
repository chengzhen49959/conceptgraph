'use client'

import type { ReactNode } from 'react'
import { SWATCH_COLORS } from '@/lib/graph-settings'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/**
 * A colour-picker popover: preset swatches (SWATCH_COLORS) plus a native picker.
 * The trigger is supplied by the caller as `children` (call sites want different
 * shapes — a round dot beside a topic, a square in a form row), so this component
 * owns only the palette, not the button.
 */
export function ColorPicker({
  color,
  onPick,
  children,
}: {
  color: string
  onPick: (color: string) => void
  children: ReactNode
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-4 gap-1.5">
          {SWATCH_COLORS.map((col) => (
            <button
              key={col}
              type="button"
              aria-label={col}
              onClick={() => onPick(col)}
              className={cn(
                'size-6 rounded-md border transition-transform hover:scale-110',
                col === color ? 'border-foreground' : 'border-border',
              )}
              style={{ background: col }}
            />
          ))}
        </div>
        <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          Custom
          <input
            type="color"
            value={color}
            onChange={(e) => onPick(e.target.value)}
            className="h-6 w-8 cursor-pointer rounded border border-border bg-transparent"
          />
        </label>
      </PopoverContent>
    </Popover>
  )
}
