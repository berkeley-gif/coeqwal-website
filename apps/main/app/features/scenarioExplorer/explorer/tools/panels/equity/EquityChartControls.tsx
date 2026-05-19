"use client"

import ChartControlsBar from "../../chrome/layout/ChartControlsBar"
import { InlineToggleChip } from "../../chrome/chips/InlineToggleChip"
import { SaveSnapshotButton } from "../../chrome/SaveSnapshotButton"
import { SimpleButton } from "../../chrome/SimpleButton"
import { mapActions } from "../../../../../map/store"
import { useExplorerStore } from "../../../store"
import type { ExploreShareCapture } from "../../../useExploreShareCapture"

type EquityChartControlsProps = {
  share: ExploreShareCapture["equity"]
}

export default function EquityChartControls({ share }: EquityChartControlsProps) {
  const {
    showEquityComparison,
    setShowEquityComparison,
    equityFocusScenario,
  } = useExplorerStore()

  const canSnapshot = equityFocusScenario !== null
  const { onSaveSnapshot } = share.chartControlsProps

  return (
    <ChartControlsBar>
      <InlineToggleChip
        label="Compare to Baseline"
        active={showEquityComparison}
        onClick={() => setShowEquityComparison(!showEquityComparison)}
      />
      <SimpleButton
        label="Clear Map Selection"
        onClick={() => mapActions.clearLocationHighlights()}
      />
      <SaveSnapshotButton
        disabled={!canSnapshot}
        onClick={onSaveSnapshot}
      />
    </ChartControlsBar>
  )
}
