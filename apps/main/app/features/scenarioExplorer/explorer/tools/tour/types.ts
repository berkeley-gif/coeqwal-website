/**
 * Shared types for the per-tool anchored tour system. Each tool (List,
 * Radar) owns an ordered list of TourStep entries. Steps
 * with an `anchorId` resolve to a DOM element registered through
 * TourAnchorContext. Steps without an anchor render as centered
 * "bookend" dialogs (hero intro, journey wrap-up).
 */

import type { PopperProps } from "@repo/ui/mui"

export type TourTool = "list" | "radar"

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
   *  info glyph inline (see ToolTour). */
  body?: string
  /** Preferred Popper placement relative to the anchor. Popper will
   *  flip automatically if it does not fit. */
  placement?: TourPlacement
  /** When true, disable Popper's automatic flip modifier so the step
   *  stays on the preferred side even if space is tight. Useful for
   *  steps that programmatically reveal chart content the popper
   *  must not cover (e.g. a chip above the chart whose popper must
   *  not fall back onto the chart below). */
  disableFlip?: boolean
  /** Cross-axis skid expressed as a multiple of the anchor's size
   *  along that axis. For bottom/top placements this is a multiple
   *  of the anchor's width. For left/right placements a multiple of
   *  its height. Useful to push the popper past the anchor on the
   *  cross axis. Example: with placement "bottom-end" and
   *  `anchorSkidMultiplier: -1`, the popper's right edge aligns
   *  with the anchor's left edge (popper sits below and to the
   *  left of the anchor). */
  anchorSkidMultiplier?: number
  /** Optional icon shown before the title in the popper. */
  titleIcon?: "pin" | "share"
  /**
   * Optional in-popper figure (data-driven SVG). Keeps the tour free of
   * raw binary assets where possible. Extend the switch in ToolTour when
   * adding new keys.
   */
  illustration?:
    | "listBarTiers"
    | "listMapLegend"
    | "listSearch"
    | "listChips"
    | "listSortButton"
    | "listCheckbox"
    | "listHydroclimate"
}

export interface TourState {
  tool: TourTool | null
  step: number
}
