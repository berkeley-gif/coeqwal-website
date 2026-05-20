/**
 * Shared types for the per-tool anchored tour system.
 *
 * Each tool that has a tour exports a `TourModule` from its own
 * `panels/<tool>/tour/` folder. `tour/registry.ts` is the single place
 * that names tour-enabled tools. Everything else (the runner, the
 * "Take the tour" button, the workspace store's `TourTool` type) is
 * derived from that registry.
 *
 * Step semantics:
 *   - Steps with `anchorId` resolve to a DOM element registered through
 *     `TourAnchorContext` and render as a Popper next to that element.
 *   - Steps without an `anchorId` render as a centered card
 *     (hero intro, journey wrap-up).
 *   - Steps may include an `illustration` key that resolves
 *     through the active tool's `TourModule.illustrations` map. The
 *     runner does not know which illustrations exist. Each tool registers
 *     its own.
 *
 * See `tour/README.md` for the full layout and the how-to for adding a
 * tour to a new tool.
 */

import type { ComponentType, ReactNode } from "react"
import type { PopperProps } from "@repo/ui/mui"

export type TourPlacement = NonNullable<PopperProps["placement"]>

export interface TourStep {
  id: string
  /** Anchor id registered via `useTourAnchor`. Omit for centered
   *  bookend steps (hero, journey wrap-up). */
  anchorId?: string
  /** Small uppercase eyebrow rendered above the title. */
  eyebrow?: string
  title: string
  /** Main copy. Omit, or use empty or whitespace-only, to show title only
   *  with no body block. May include `{{infoIcon}}` to render the outlined
   *  info glyph inline (see `TourBodyContent`). */
  body?: string
  /** Preferred Popper placement relative to the anchor. Popper will flip
   *  automatically if it does not fit. */
  placement?: TourPlacement
  /** When true, disable Popper's automatic flip modifier so the step
   *  stays on the preferred side even if space is tight. Useful for
   *  steps that programmatically reveal chart content the popper must
   *  not cover. */
  disableFlip?: boolean
  /** Cross-axis skid expressed as a multiple of the anchor's size along
   *  that axis. For bottom/top placements this is a multiple of the
   *  anchor's width; for left/right, a multiple of its height. */
  anchorSkidMultiplier?: number
  /** Optional icon shown before the title in the popper. */
  titleIcon?: "pin" | "share"
  /** Optional in-popper figure key. Resolved through the active tool's
   *  `TourModule.illustrations` map. */
  illustration?: string
}

/** Element lookup callback exposed by `useTourAnchorResolver`. */
export type AnchorResolver = (id: string) => Element | null

/** Props that `TourModule.EffectsComponent` receives from the runner. */
export interface TourEffectsProps {
  step: TourStep | null
  resolve: AnchorResolver
  /** Monotonic counter that ticks whenever the anchor registry changes,
   *  so effects that need to re-resolve an anchor can list it as a dep. */
  version: number
}

/**
 * Each tour-enabled tool exports one of these from its own
 * `panels/<tool>/tour/index.ts` and registers it in `tour/registry.ts`.
 *
 *   - `steps`: ordered list of steps the runner walks through.
 *   - `EffectsComponent` (optional): mounted by the runner only while
 *     this tool's tour is active. Use it to drive store-side demo
 *     effects (e.g. open a panel, flip a chip). Mount-on-active means
 *     hooks order is stable per tool, so each module can use its own
 *     `useEffect`s freely.
 *   - `illustrations` (optional): keyed renderers referenced from
 *     `TourStep.illustration`.
 */
export interface TourModule {
  steps: TourStep[]
  EffectsComponent?: ComponentType<TourEffectsProps>
  illustrations?: Record<string, () => ReactNode>
}
