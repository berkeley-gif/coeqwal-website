"use client"

import ChartControlsBar from "../../chrome/layout/ChartControlsBar"
import ResilienceControls from "./ResilienceControls"
import type { ExploreShareCapture } from "../../../useExploreShareCapture"

type ResilienceChartControlsProps = {
  share: ExploreShareCapture["resilience"]
}

export default function ResilienceChartControls({
  share,
}: ResilienceChartControlsProps) {
  return (
    <ChartControlsBar>
      <ResilienceControls
        onSaveSnapshot={share.chartControlsProps.onSaveSnapshot}
      />
    </ChartControlsBar>
  )
}
