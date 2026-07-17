"use client"

/**
 * useTourAnchorElement - Resolves the current step's anchor id to the live
 * DOM element registered under it. Returns null when the step has no
 * anchor (a centered bookend step) or when nothing is registered for the
 * id, which the runner treats as "show a centered card."
 *
 * It re-resolves whenever the step changes or the anchor registry
 * changes (`version`), so a target that mounts after the runner is
 * picked up on the next render with no polling. The lookup runs in a
 * layout effect (before paint) so an already-registered anchor shows its
 * popper on the first frame instead of flashing the centered card.
 *
 * Side effect: while an anchor is resolved, it is scrolled into view and
 * tagged with `data-tour-highlight` (an optional CSS hook).
 */

import { useEffect, useLayoutEffect, useState } from "react"
import type { AnchorResolver } from "../types"

const HIGHLIGHT_DATA_ATTR = "data-tour-highlight"

interface UseTourAnchorElementParams {
  stepId: string | undefined
  anchorId: string | undefined
  resolve: AnchorResolver
  /** Ticks whenever the anchor registry changes, so we re-resolve. */
  version: number
}

export function useTourAnchorElement({
  stepId,
  anchorId,
  resolve,
  version,
}: UseTourAnchorElementParams): Element | null {
  const [anchorEl, setAnchorEl] = useState<Element | null>(null)

  useLayoutEffect(() => {
    // Bookend step (no anchor) or nothing registered yet: null, which the
    // runner renders as a centered card. A late mount bumps `version` and
    // re-runs this effect, so the element is found on the next render.
    setAnchorEl(stepId && anchorId ? resolve(anchorId) : null)
  }, [stepId, anchorId, version, resolve])

  useEffect(() => {
    if (!anchorEl) return
    anchorEl.scrollIntoView({ behavior: "smooth", block: "nearest" })
    anchorEl.setAttribute(HIGHLIGHT_DATA_ATTR, "true")
    return () => {
      anchorEl.removeAttribute(HIGHLIGHT_DATA_ATTR)
    }
  }, [anchorEl])

  return anchorEl
}
