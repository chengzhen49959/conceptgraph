'use client'

import { ChevronRight } from 'lucide-react'
import { SidebarGroupLabel } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

/**
 * Collapsible section label built on `SidebarGroupLabel` (which fades out on the
 * icon rail). The chevron rotates with `open`; `count` trails the title. Shared by
 * the data sections (Documents / Topics) and the graph-control sections so they
 * read as one consistent sidebar.
 */
export function SectionLabel({
  label,
  count,
  open,
  onToggle,
}: {
  label: string
  count?: number
  open: boolean
  onToggle: () => void
}) {
  return (
    <SidebarGroupLabel asChild>
      <button
        type="button"
        onClick={onToggle}
        className="w-full cursor-pointer gap-1 hover:text-sidebar-foreground"
      >
        <ChevronRight className={cn('transition-transform', open && 'rotate-90')} />
        <span className="uppercase tracking-wide">{label}</span>
        {count != null && (
          <span className="ml-1 text-sidebar-foreground/40">{count}</span>
        )}
      </button>
    </SidebarGroupLabel>
  )
}
