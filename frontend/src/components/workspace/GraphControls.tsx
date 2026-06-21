'use client'

import { type GraphSettings, type GraphSettingsPatch } from '@/lib/graph-settings'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

// The graph settings, rendered as the contents of the sidebar's ⚙ popover (the
// trigger lives in NavSidebar). Three always-expanded sections — Display, Forces,
// Local graph — since a popover is opened on demand, there's nothing to collapse.
// All state lives in `settings`; edits flow back through `onChange`.
//
// Topic colour + show/hide are NOT here: a topic is its own colour group, owned by
// the sidebar Topics section. Node search is gone too — ⌘K is the one finder.
export function GraphControls({
  settings,
  onChange,
}: {
  settings: GraphSettings
  onChange: (patch: GraphSettingsPatch) => void
}) {
  return (
    <div className="space-y-3">
      <Section title="Display">
        <SwitchRow
          label="Arrows"
          checked={settings.display.arrows}
          onChange={(v) => onChange({ display: { arrows: v } })}
        />
        {/* Orphans is a display filter (hide unconnected nodes); it lives here now
            that the Filters section is gone. */}
        <SwitchRow
          label="Orphans"
          checked={settings.filters.orphans}
          onChange={(v) => onChange({ filters: { orphans: v } })}
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
          <span className="text-xs text-muted-foreground">Animate</span>
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

      <Section title="Local graph">
        <SwitchRow
          label="Enabled"
          checked={settings.local.enabled}
          onChange={(v) => onChange({ local: { enabled: v } })}
        />
        {settings.local.enabled && (
          <div className="py-1.5">
            <span className="mb-1.5 block text-xs text-muted-foreground">
              Depth: {settings.local.depth}
            </span>
            <Slider
              min={1}
              max={3}
              step={1}
              value={[settings.local.depth]}
              onValueChange={([v]) => onChange({ local: { depth: v } })}
            />
          </div>
        )}
      </Section>
    </div>
  )
}

// A labelled settings block: a small uppercase header over its controls.
function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-1 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="px-1">{children}</div>
    </div>
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
      <span className="text-xs text-muted-foreground">{label}</span>
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
      <span className="mb-1.5 block text-xs text-muted-foreground">{label}</span>
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
