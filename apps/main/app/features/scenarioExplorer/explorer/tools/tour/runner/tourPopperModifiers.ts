"use client"

/**
 * buildTourPopperModifiers - Popper.js modifier config for an anchored
 * tour card, pulled out of `ToolTour` so the render path stays
 * scannable. Pure function of the step. No React.
 *
 *  - offset: a fixed gap from the anchor on the main axis. On the cross
 *    axis the card can "skid" past the anchor by a multiple of the
 *    anchor's own size (`step.anchorSkidMultiplier`), so a card can sit
 *    beside a control without covering live chart content.
 *  - preventOverflow: keep the card within the viewport.
 *  - flip: allow flipping to the opposite side when space is tight,
 *    unless the step sets `disableFlip` (used when a demo effect reveals
 *    chart content the card must not jump over).
 */

import type { TourStep } from "../types"

/** Gap between the anchor and the card on the placement (main) axis. */
const ANCHOR_MAIN_AXIS_GAP_PX = 12

export function buildTourPopperModifiers(step: TourStep) {
  return [
    {
      name: "offset",
      options: {
        offset: ({
          placement,
          reference,
        }: {
          placement: string
          reference: { width: number; height: number }
        }) => {
          const skidMultiplier = step.anchorSkidMultiplier ?? 0
          const isVertical =
            placement.startsWith("top") || placement.startsWith("bottom")
          const skid = isVertical
            ? reference.width * skidMultiplier
            : reference.height * skidMultiplier
          return [skid, ANCHOR_MAIN_AXIS_GAP_PX]
        },
      },
    },
    {
      name: "preventOverflow",
      options: { padding: 12, altAxis: true, tether: false },
    },
    step.disableFlip
      ? { name: "flip", enabled: false }
      : { name: "flip", options: { padding: 12 } },
  ]
}
