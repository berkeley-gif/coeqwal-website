"use client"

/**
 * Invisible fixed marker centered on the viewport, sized to the
 * morphing headline's measured height. The About -> WaterThemes
 * crossfade is timed against this marker (not the headline ref
 * directly) so meeting events fire while the seam crosses the
 * headline at its CENTERED position rather than its default top
 * anchor. Without this marker the second crossfade window collapses
 * to zero scroll distance.
 *
 *   marker.top    = windowHeight/2 - height/2
 *   marker.bottom = windowHeight/2 + height/2
 *
 * Render once per IntroSection. The choreography hook produces the
 * `height` from the live headline measurement.
 */

import { forwardRef } from "react"

interface ViewportCenterMarkerProps {
  /** Pixel height to size the marker. Comes from the choreography hook. */
  height: number
}

export const ViewportCenterMarker = forwardRef<
  HTMLDivElement,
  ViewportCenterMarkerProps
>(function ViewportCenterMarker({ height }, ref) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: "50%",
        left: 0,
        width: 0,
        height,
        transform: "translateY(-50%)",
        pointerEvents: "none",
      }}
    />
  )
})
