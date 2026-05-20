"use client"

/**
 * useRadarInfoIconSync - Tour-driven sync for the radar outcome info popover.
 *
 * The popover is a `useState<string | null>` inside `RadarPanel`, so a
 * top-level effects component cannot drive it. This small hook lives
 * next to the rest of the radar tour code but is called from
 * `RadarPanel` directly.
 *
 * When the radar tour reaches the "Outcome summary" step, it opens the
 * first axis's info popover. It closes the popover when the step ends or
 * the tour is dismissed so the popper and the live popover move in
 * lockstep. Mirrors the list tour's outcome-info pattern.
 */

import { useEffect, useRef } from "react"
import { useWorkspaceSlice } from "../../../../store"
import { RADAR_TOUR } from "./steps"

const RADAR_INFO_STEP_ID = "radar.step2.infoIcon"

export function useRadarInfoIconSync(
  axisPositions: { axis: string }[],
  openInfoAxis: string | null,
  setOpenInfoAxis: (axis: string | null) => void,
) {
  const radarTourStepId = useWorkspaceSlice((s) => {
    if (s.tour.tool !== "radar") return null
    return RADAR_TOUR[s.tour.step]?.id ?? null
  })
  const openedByTourRef = useRef(false)

  useEffect(() => {
    const isInfoStep = radarTourStepId === RADAR_INFO_STEP_ID
    if (isInfoStep) {
      const firstAxis = axisPositions[0]?.axis
      if (firstAxis && openInfoAxis !== firstAxis) {
        setOpenInfoAxis(firstAxis)
        openedByTourRef.current = true
      }
      return
    }
    if (openedByTourRef.current) {
      openedByTourRef.current = false
      setOpenInfoAxis(null)
    }
  }, [radarTourStepId, axisPositions, openInfoAxis, setOpenInfoAxis])
}
