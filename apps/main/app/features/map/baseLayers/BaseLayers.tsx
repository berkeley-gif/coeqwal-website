"use client"

/**
 * BaseLayers - groups the base geography layers: rivers, basins, and arrows
 */

import RiversLayer from "./RiversLayer"
import BasinsLayer from "./BasinsLayer"
import BasinInflowArrows from "./BasinInflowArrows"
import type { MapMode } from "../store"

interface BaseLayersProps {
  mapMode: MapMode
  riversVisible: boolean
  riversProgress: number
  basinsVisible: boolean
  riverBasinLabelsOpacity: number
  arrowsVisible: boolean
  arrowsOpacity: number
}

export default function BaseLayers({
  riversVisible,
  riversProgress,
  basinsVisible,
  riverBasinLabelsOpacity,
  arrowsVisible,
  arrowsOpacity,
}: BaseLayersProps) {
  return (
    <>
      <BasinsLayer
        visible={basinsVisible}
        riverBasinLabelsOpacity={riverBasinLabelsOpacity}
      />

      <BasinInflowArrows visible={arrowsVisible} opacity={arrowsOpacity} />

      <RiversLayer visible={riversVisible} progress={riversProgress} />
    </>
  )
}
