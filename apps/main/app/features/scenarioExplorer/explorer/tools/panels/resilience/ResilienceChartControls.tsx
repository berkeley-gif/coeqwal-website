"use client"

import ChartControlsBar from "../../chrome/layout/ChartControlsBar"
import ResilienceControls from "./ResilienceControls"
import { useTourAnchor } from "../../tour/anchors/TourAnchorContext"
import type { ExploreShareCapture } from "../../../useExploreShareCapture"

type ResilienceChartControlsProps = {
  share: ExploreShareCapture["resilience"]
}

export default function ResilienceChartControls({
  share,
}: ResilienceChartControlsProps) {
  const chartToolbarRef = useTourAnchor("resilience.chartToolbar")
  return (
    <ChartControlsBar ref={chartToolbarRef}>
      <ResilienceControls
        onSaveSnapshot={share.chartControlsProps.onSaveSnapshot}
      />
    </ChartControlsBar>
  )
}
