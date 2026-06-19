'use client'

import { GripVertical } from 'lucide-react'
import { Group, Panel, Separator } from 'react-resizable-panels'

import { cn } from '@/lib/utils'

// react-resizable-panels v4 API: Group (orientation) / Panel (panelRef, no
// `order`) / Separator (the drag handle). Group locks its own display/flex/
// overflow, so we only pass sizing classes through.
function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof Group>) {
  return (
    <Group
      data-slot="resizable-panel-group"
      className={cn('h-full w-full', className)}
      {...props}
    />
  )
}

// Re-export Panel directly so `panelRef` (PanelImperativeHandle) and the full
// prop types pass through untouched.
const ResizablePanel = Panel

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & { withHandle?: boolean }) {
  return (
    <Separator
      data-slot="resizable-handle"
      className={cn(
        'relative flex w-px items-center justify-center bg-border transition-colors hover:bg-ring data-[separator]:cursor-col-resize',
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-xs border bg-border">
          <GripVertical className="size-2.5" />
        </div>
      )}
    </Separator>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
