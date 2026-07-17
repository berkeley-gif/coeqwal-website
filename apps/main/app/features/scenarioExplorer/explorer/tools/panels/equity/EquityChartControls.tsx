"use client"

import ChartControlsBar from "../../chrome/layout/ChartControlsBar"
import { InlineToggleChip } from "../../chrome/chips/InlineToggleChip"
import { SaveSnapshotButton } from "../../chrome/actions/SaveSnapshotButton"
import { SimpleButton } from "../../chrome/actions/SimpleButton"
import { mapActions } from "../../../../../map/store"
import { useMap } from "@repo/map"
import { useWorkspaceSlice, useEquitySlice } from "../../../store"
import type { ExploreShareCapture } from "../../../useExploreShareCapture"

type EquityChartControlsProps = {
  share: ExploreShareCapture["equity"]
}

export default function EquityChartControls({
  share,
}: EquityChartControlsProps) {
  const {
    showEquityComparison,
    setShowEquityComparison,
    yAxisMode,
    setYAxisMode,
  } = useEquitySlice()
  const { equityFocusScenario } = useWorkspaceSlice()
  const { setMotionChildren } = useMap()

  const canSnapshot = equityFocusScenario !== null
  const { onSaveSnapshot } = share.chartControlsProps

  const handleClearSelection = () => {
    mapActions.clearLocationHighlights()
    setMotionChildren?.(null)
  }

  return (
    <ChartControlsBar>
      <InlineToggleChip
        label="Compare to Baseline"
        active={showEquityComparison}
        onClick={() => setShowEquityComparison(!showEquityComparison)}
      />
      <InlineToggleChip
        label="Continuous Tiers"
        active={yAxisMode === "continuous"}
        onClick={() =>
          setYAxisMode(yAxisMode === "continuous" ? "discrete" : "continuous")
        }
      />
      <SimpleButton
        label="Clear Map Selection"
        onClick={handleClearSelection}
      />
      <SaveSnapshotButton disabled={!canSnapshot} onClick={onSaveSnapshot} />
    </ChartControlsBar>
  )
}
