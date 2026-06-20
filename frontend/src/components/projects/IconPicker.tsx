'use client'

import { PROJECT_ICONS, PROJECT_ICON_NAMES, ProjectIcon } from '@/lib/projectIcons'

/**
 * Inline icon picker: a grid of curated monochrome icons (shadcn black-and-white
 * style — no accent colours). Controlled — the parent owns the selected name and
 * gets every change. Lives inside the create / rename dialogs (no popover).
 */
export function IconPicker({
  icon,
  onChange,
}: {
  icon: string
  onChange: (name: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <ProjectIcon name={icon} size={20} />
        <span className="text-sm">Project icon</span>
      </div>

      <div className="grid max-h-44 grid-cols-8 gap-1 overflow-y-auto rounded-md border p-2">
        {PROJECT_ICON_NAMES.map((n) => {
          const Icon = PROJECT_ICONS[n]
          const selected = n === icon
          return (
            <button
              key={n}
              type="button"
              aria-label={n}
              onClick={() => onChange(n)}
              className={`flex aspect-square items-center justify-center rounded-md text-foreground hover:bg-accent ${
                selected ? 'bg-accent ring-1 ring-ring' : ''
              }`}
            >
              <Icon theme="outline" size={18} fill="currentColor" strokeWidth={4} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
