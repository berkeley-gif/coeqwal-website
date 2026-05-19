"use client"

/**
 * useExploreShareCapture - composes per-tool share capture hooks.
 *
 * Share buttons (the ones with the share icon) live in ActiveToolPanel chart controls and ScenarioSelectionSidebar.
 * Each tool hook owns its capture refs and staging logic. See:
 *   tools/panels/radar/useRadarShareCapture.ts
 *   tools/panels/equity/useEquityShareCapture.ts
 *   tools/panels/resilience/useResilienceShareCapture.ts
 */

import { useMemo } from "react"
import { useRadarShareCapture } from "./tools/panels/radar/useRadarShareCapture"
import { useEquityShareCapture } from "./tools/panels/equity/useEquityShareCapture"
import { useResilienceShareCapture } from "./tools/panels/resilience/useResilienceShareCapture"
import type { RadarShareCapture } from "./tools/panels/radar/useRadarShareCapture"
import type { EquityShareCapture } from "./tools/panels/equity/useEquityShareCapture"
import type { ResilienceShareCapture } from "./tools/panels/resilience/useResilienceShareCapture"

export type ExploreShareCapture = {
  radar: RadarShareCapture
  equity: EquityShareCapture
  resilience: ResilienceShareCapture
}

export function useExploreShareCapture(): ExploreShareCapture {
  const radar = useRadarShareCapture()
  const equity = useEquityShareCapture()
  const resilience = useResilienceShareCapture()

  return useMemo(
    (): ExploreShareCapture => ({ radar, equity, resilience }),
    [radar, equity, resilience],
  )
}
