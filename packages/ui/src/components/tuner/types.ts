import type * as React from "react"
import type { SxProps, Theme } from "@mui/material"

/**
 * A single step of a guided walkthrough. The walkthrough is intended to
 * teach a beginner how to read/interact with a chart. Each step can
 * describe a concept and (optionally) apply a concrete chart state via
 * `apply` so the user sees the idea in action.
 */
export interface WalkthroughStep {
  /** Short heading for this step (e.g. "What is resilience?"). */
  title: string
  /** Body content: plain text, React nodes, rich JSX, etc. */
  body: React.ReactNode
  /**
   * Optional hook run when this step is activated, for the chart to update
   * its state (set filters, highlight a region, swap the view, …).
   * Leave undefined for purely explanatory steps.
   */
  apply?: () => void
}

/**
 * A saved preset, a one-click chart configuration. Presets are surfaced
 * as buttons so users can jump straight to a meaningful view rather than
 * fiddling with individual controls.
 */
export interface TunerPreset {
  /** Unique id used for active-state matching. */
  id: string
  /** Label on the preset button. */
  label: string
  /** Optional longer description shown as tooltip / secondary text. */
  description?: string
  /**
   * Optional section grouping. Presets sharing a `group` are rendered
   * under a shared heading in the order they appear. Presets without a
   * group fall back to a single "Preset views" section for backwards
   * compatibility.
   */
  group?: string
  /** Apply the preset to the chart's state. */
  apply: () => void
}

export interface ChartTunerProps {
  /** Text on the inline trigger button (e.g. "TUNE CHART"). */
  triggerLabel: string
  /** Optional sx overrides for the trigger button. */
  triggerSx?: SxProps<Theme>
  /**
   * Optional walkthrough steps. Rendered as a "Walkthrough" section
   * with Prev/Next navigation. Omit or pass `[]` to hide the section.
   */
  walkthrough?: WalkthroughStep[]
  /**
   * Optional one-click preset views. Rendered as a grid of preset buttons.
   * Omit or pass `[]` to hide the section.
   */
  presets?: TunerPreset[]
  /**
   * Existing chart-control UI, rendered as-is in the overlay. This is how
   * developers surface the traditional controls (sliders, toggles, …) to
   * power users without building them into the tuner.
   */
  controls?: React.ReactNode
  /**
   * Optional header description shown under the title to orient the user.
   */
  description?: React.ReactNode
  /** Called when the user clicks the "Reset" footer button. */
  onReset?: () => void
  /**
   * Optional snapshot accessor used by the "Copy" footer button. Returns an
   * arbitrary JSON-serializable object representing the chart's current
   * state; the tuner copies it as pretty-printed JSON.
   */
  getSnapshot?: () => unknown
  /** Initial open state (default: false). Ignored when `open` is provided. */
  defaultOpen?: boolean
  /**
   * Controlled open state. When provided, the tuner's open/closed state is
   * fully driven by the parent; use with `onOpenChange` to react to the
   * user opening/closing the overlay. Leave undefined for the default
   * uncontrolled behavior (seeded by `defaultOpen`).
   */
  open?: boolean
  /**
   * Called whenever the tuner wants to open or close. Required when using
   * the controlled `open` prop; ignored when uncontrolled.
   */
  onOpenChange?: (next: boolean) => void
  /**
   * Optional callback ref forwarded onto the tuner's inline trigger
   * button. Lets callers anchor tour poppers, overlays, etc. directly
   * on the same element that owns the click/focus affordance, without
   * wrapping it in an extra DOM node that would displace the button
   * from its parent flex row.
   */
  triggerRef?: (el: HTMLButtonElement | null) => void
}
