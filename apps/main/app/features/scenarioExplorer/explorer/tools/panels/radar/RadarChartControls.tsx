"use client"

import ChartControlsBar from "../../chrome/layout/ChartControlsBar"
import { InlineToggleChip } from "../../chrome/chips/InlineToggleChip"
import { SaveSnapshotButton } from "../../chrome/actions/SaveSnapshotButton"
import { RadarTourAnchor } from "../../chrome/tour/RadarTourAnchor"
import { useTourAnchor } from "../../tour/TourAnchorContext"
import { useWorkspaceSlice, useRadarSlice } from "../../../store"
import type { ExploreShareCapture } from "../../../useExploreShareCapture"

type RadarChartControlsProps = {
  share: ExploreShareCapture["radar"]
}

export default function RadarChartControls({ share }: RadarChartControlsProps) {
  const radarChartToolbarRef = useTourAnchor("radar.chartToolbar")
  const {
    showAxisSelector,
    setShowAxisSelector,
    showDotsOnly,
    setShowDotsOnly,
    showRadarRange,
    setShowRadarRange,
    radarShowAll,
    setRadarShowAll,
  } = useRadarSlice()
  const { highlightBaseline, setHighlightBaseline } = useWorkspaceSlice()

  const { canCapture, onSaveSnapshot } = share.chartControlsProps

  return (
    <ChartControlsBar ref={radarChartToolbarRef}>
      <RadarTourAnchor anchorId="radar.axisChooser">
        <InlineToggleChip
          label="choose outcome axes"
          active={showAxisSelector}
          onClick={() => setShowAxisSelector(!showAxisSelector)}
        />
      </RadarTourAnchor>
      <RadarTourAnchor anchorId="radar.showAll">
        <InlineToggleChip
          label="show all scenarios"
          active={radarShowAll}
          onClick={() => setRadarShowAll(!radarShowAll)}
        />
      </RadarTourAnchor>
      <InlineToggleChip
        label="dots only"
        active={showDotsOnly}
        onClick={() => setShowDotsOnly(!showDotsOnly)}
      />
      <RadarTourAnchor anchorId="radar.highlightBaseline">
        <InlineToggleChip
          label="highlight current operations"
          active={highlightBaseline}
          onClick={() => setHighlightBaseline(!highlightBaseline)}
        />
      </RadarTourAnchor>
      <RadarTourAnchor anchorId="radar.libraryRange">
        <InlineToggleChip
          label="show range"
          active={showRadarRange}
          onClick={() => setShowRadarRange(!showRadarRange)}
        />
      </RadarTourAnchor>
      <RadarTourAnchor anchorId="radar.capture">
        <SaveSnapshotButton disabled={!canCapture} onClick={onSaveSnapshot} />
      </RadarTourAnchor>
    </ChartControlsBar>
  )
}
