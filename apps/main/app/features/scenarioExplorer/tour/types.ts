/**
 * Shared types for the per-tool anchored tour system. Each tool (List,
 * Radar, Resilience) owns an ordered list of TourStep entries. Steps
 * with an `anchorId` resolve to a DOM element registered through
 * TourAnchorContext; steps without an anchor render as centered
 * "bookend" dialogs (hero intro, journey wrap-up).
 */

import type { PopperProps } from "@repo/ui/mui"

export type TourTool = "list" | "radar" | "resilience"

export type TourPlacement = NonNullable<PopperProps["placement"]>

export interface TourStep {
  id: string
  /** Anchor id registered via `useTourAnchor`. Omit for centered
   *  bookend steps (hero, journey wrap-up). */
  anchorId?: string
  /** Small uppercase eyebrow rendered above the title. */
  eyebrow?: string
  title: string
  body: string
  /** Preferred Popper placement relative to the anchor. Popper will
   *  flip automatically if it does not fit. */
  placement?: TourPlacement
  /** Optional icon shown before the title in the popper. */
  titleIcon?: "pin" | "share"
}

export interface TourState {
  tool: TourTool | null
  step: number
}
