'use client'

import { useState } from 'react'
import { ChevronRight, Plus, X } from 'lucide-react'
import {
  type GraphSettings,
  type GraphSettingsPatch,
  GROUP_COLORS,
  newGroup,
} from '@/lib/graph-settings'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

// The floating Obsidian-style control panel (top-left of the canvas). It owns no
// state of its own beyond which sections are expanded — all graph settings live in
// `settings` and flow back out through `onChange`. Sections mirror Obsidian's
// Graph view: Filters / Groups / Display / Forces.
export function GraphControls({
  settings,
  onChange,
}: {
  settings: GraphSettings
  onChange: (patch: GraphSettingsPatch) => void
}) {
  return (
    <div className="absolute left-3 top-3 z-10 w-60">
      <div className="max-h-[calc(100vh-9rem)] overflow-y-auto rounded-lg border border-border bg-background/95 p-1 text-sm shadow-md backdrop-blur">
        {/* Filters */}
        <Section title="Filters" defaultOpen>
          <Input
            value={settings.filters.search}
            onChange={(e) => onChange({ filters: { search: e.target.value } })}
            placeholder="Search files…"
            className="mb-2 h-8"
          />
          {/* tags / attachments / existing-files have no concept-graph data yet —
              shown to mirror Obsidian; they currently filter nothing. */}
          <SwitchRow
            label="Tags"
            checked={settings.filters.tags}
            onChange={(v) => onChange({ filters: { tags: v } })}
          />
          <SwitchRow
            label="Attachments"
            checked={settings.filters.attachments}
            onChange={(v) => onChange({ filters: { attachments: v } })}
          />
          <SwitchRow
            label="Existing files only"
            checked={settings.filters.existingOnly}
            onChange={(v) => onChange({ filters: { existingOnly: v } })}
          />
          <SwitchRow
            label="Orphans"
            checked={settings.filters.orphans}
            onChange={(v) => onChange({ filters: { orphans: v } })}
          />
        </Section>

        {/* Groups — colour nodes whose name matches a search term. */}
        <Section title="Groups">
          {settings.filters.search.length === 0 && settings.groups.length === 0 && (
            <p className="px-1 pb-1 text-xs text-muted-foreground">
              Colour nodes by name. Add a group below.
            </p>
          )}
          <div className="space-y-1.5">
            {settings.groups.map((g) => (
              <div key={g.id} className="flex items-center gap-1.5">
                <Input
                  value={g.query}
                  onChange={(e) =>
                    onChange({
                      groups: settings.groups.map((x) =>
                        x.id === g.id ? { ...x, query: e.target.value } : x,
                      ),
                    })
                  }
                  placeholder="Search term"
                  className="h-7 flex-1"
                />
                <ColorSwatch
                  color={g.color}
                  onPick={(color) =>
                    onChange({
                      groups: settings.groups.map((x) =>
                        x.id === g.id ? { ...x, color } : x,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  aria-label="Remove group"
                  onClick={() =>
                    onChange({ groups: settings.groups.filter((x) => x.id !== g.id) })
                  }
                  className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onChange({ groups: [...settings.groups, newGroup()] })}
            className="mt-1.5 flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Plus className="size-3.5" />
            New group
          </button>
        </Section>

        {/* Display */}
        <Section title="Display">
          <SwitchRow
            label="Arrows"
            checked={settings.display.arrows}
            onChange={(v) => onChange({ display: { arrows: v } })}
          />
          <SliderRow
            label="Text fade threshold"
            value={settings.display.textFade}
            onChange={(v) => onChange({ display: { textFade: v } })}
          />
          <SliderRow
            label="Node size"
            value={settings.display.nodeSize}
            onChange={(v) => onChange({ display: { nodeSize: v } })}
          />
          <SliderRow
            label="Link thickness"
            value={settings.display.linkThickness}
            onChange={(v) => onChange({ display: { linkThickness: v } })}
          />
          {/* Animate replays note creation over time in Obsidian; concepts carry no
              timestamps, so it's disabled until that data exists. */}
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-muted-foreground">Animate</span>
            <button
              type="button"
              disabled
              title="Needs concept timestamps"
              className="cursor-not-allowed rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground opacity-50"
            >
              Play
            </button>
          </div>
        </Section>

        {/* Forces */}
        <Section title="Forces">
          <SliderRow
            label="Center force"
            value={settings.forces.center}
            onChange={(v) => onChange({ forces: { center: v } })}
          />
          <SliderRow
            label="Repel force"
            value={settings.forces.repel}
            onChange={(v) => onChange({ forces: { repel: v } })}
          />
          <SliderRow
            label="Link force"
            value={settings.forces.linkForce}
            onChange={(v) => onChange({ forces: { linkForce: v } })}
          />
          <SliderRow
            label="Link distance"
            value={settings.forces.linkDistance}
            onChange={(v) => onChange({ forces: { linkDistance: v } })}
          />
        </Section>
      </div>
    </div>
  )
}

// A collapsible panel section with a chevron header (Obsidian-style accordion).
function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b border-border/60 last:border-b-0">
      <CollapsibleTrigger className="flex w-full items-center gap-1 px-1 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground">
        <ChevronRight className={cn('size-3.5 transition-transform', open && 'rotate-90')} />
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent className="px-1 pb-2">{children}</CollapsibleContent>
    </Collapsible>
  )
}

function SwitchRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

// Slider over the normalised 0..1 range the settings store in.
function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="py-1.5">
      <span className="mb-1.5 block text-muted-foreground">{label}</span>
      <Slider
        min={0}
        max={1}
        step={0.01}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  )
}

// A colour square that opens a small preset palette + native picker.
function ColorSwatch({
  color,
  onPick,
}: {
  color: string
  onPick: (color: string) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Pick colour"
          className="size-6 shrink-0 rounded-md border border-border"
          style={{ background: color }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="end">
        <div className="grid grid-cols-4 gap-1.5">
          {GROUP_COLORS.map((col) => (
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
