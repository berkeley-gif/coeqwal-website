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
} from "./store"

export default function LayerOrchestrator() {
  const mapMode = useMapMode()
  const riversProgress = useRiversProgress()
  const arrowsOpacity = useDerivedArrowsOpacity()
  const showBasins = useShowBasins()
  const showRivers = useShowRivers()
  const showArrows = useShowArrows()

  const isLearnMode = mapMode === "learn"
  const isMapVisible = mapMode !== "hidden"

  // Rivers visibility:
  // - Learn mode: controlled by scroll position
  // - Explore mode: always visible
  const riversVisible = isLearnMode ? showRivers : isMapVisible

  // Rivers progress:
  // - Learn mode: animated via scroll (0 -> 1)
  // - Explore mode: full line (progress = 1)
  const riversProgressValue = isLearnMode ? riversProgress : 1

  // Basin labels fade out as rivers animate
  const riverBasinLabelsOpacity = isLearnMode
    ? showRivers
      ? Math.max(0, 1 - riversProgress / 0.3)
      : 1
    : 0

  return (
    <>
      <BaseLayers
        mapMode={mapMode}
        riversVisible={riversVisible}
        riversProgress={riversProgressValue}
        basinsVisible={isLearnMode && showBasins}
        riverBasinLabelsOpacity={riverBasinLabelsOpacity}
        arrowsVisible={isLearnMode && showArrows}
        arrowsOpacity={arrowsOpacity}
      />

      {isMapVisible && <VisualizationLayers />}
    </>
  )
}
