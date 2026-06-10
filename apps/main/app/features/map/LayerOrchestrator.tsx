"use client"

/**
 * LayerOrchestrator - orchestrates all map layer components (Base layers and Visualization layers)
 *
 * Base layers:
 * - Basins
 * - Rivers
 * - Arrows
 *
 * Visualization layers:
 * - Outcome polygons
 * - Tier markers
 * - Reservoir labels
 * - Hotspot markers
 * - Tooltips
 */

import BaseLayers from "./baseLayers"
import VisualizationLayers from "./visualizationLayers"
import {
  useMapMode,
  useRiversProgress,
  useDerivedArrowsOpacity,
  useShowBasins,
  useShowRivers,
  useShowArrows,
  useActiveOutcomeVisualization,
} from "./store"

export default function LayerOrchestrator() {
  const mapMode = useMapMode()
  const riversProgress = useRiversProgress()
  const arrowsOpacity = useDerivedArrowsOpacity()
  const showBasins = useShowBasins()
  const showRivers = useShowRivers()
  const showArrows = useShowArrows()
  const activeOutcomeVisualization = useActiveOutcomeVisualization()

  const isLearnMode = mapMode === "learn"

  const isMapVisible = mapMode !== "hidden"

  // Rivers visibility:
  // - Learn mode: controlled by scroll position
  // - Explore and Get-started: only when Winter-run salmon is the active map
  //   outcome, so the Sacramento main stem can be stroked with the tier color
  //   (RiversLayer). Salmon is a line outcome with no demand-units or polygon
  //   layer, so the tier animation's own paint path cannot show it.
  const showSalmonRiversForOutcome =
    (mapMode === "explore" || mapMode === "get-started") &&
    activeOutcomeVisualization?.outcomeCode === "WRC_SALMON_AB"
  const riversVisible =
    (isLearnMode && showRivers) || showSalmonRiversForOutcome

  // Rivers progress:
  // - Learn mode: animated via scroll (0 -> 1)
  // - Explore mode: full line (progress = 1)
  const riversProgressValue = isLearnMode ? riversProgress : 1

  // Basin labels are currently disabled. Kept at 0 for potential reintroduction.
  const riverBasinLabelsOpacity = 0

  return (
    <>
      <BaseLayers
        mapMode={mapMode}
        riversVisible={riversVisible}
        riversProgress={riversProgressValue}
        riversSacramentoOnly={showSalmonRiversForOutcome}
        basinsVisible={isLearnMode && showBasins}
        riverBasinLabelsOpacity={riverBasinLabelsOpacity}
        arrowsVisible={isLearnMode && showArrows}
        arrowsOpacity={arrowsOpacity}
      />

      <VisualizationLayers hidden={!isMapVisible} />
    </>
  )
}
