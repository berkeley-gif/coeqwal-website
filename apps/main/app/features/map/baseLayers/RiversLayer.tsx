"use client"

/**
 * RiversLayer - Sacramento and San Joaquin rivers
 *
 * Renders river lines with labels. Visibility controlled via Mapbox layout property.
 * Handles its own visualization coloring for Salmon abundance outcome.
 */

import { memo, useMemo, useEffect } from "react"

const OPACITY_TRANSITION = { duration: 300, delay: 0 }
import { Source, Layer, Marker, useMap } from "@repo/map"
import { useTheme } from "@repo/ui/mui"
import { themeValues } from "@repo/ui/themes/theme"
import { sacramentoRiverMainstem, sanJoaquinRiverMainstem } from "@repo/data"
import {
  useActiveOutcomeVisualization,
  useIsOutcomeVisualizationActive,
  useMapMode,
} from "../store"
import { useSalmonRiverColor } from "../visualizationLayers/hooks/useSalmonRiverColor"

export const SACRAMENTO_RIVER_LAYER_IDS = [
  "sacramento-river-trough",
  "sacramento-river-outline",
  "sacramento-river-body",
] as const

export const RIVER_LAYER_IDS = [
  ...SACRAMENTO_RIVER_LAYER_IDS,
  "san-joaquin-river-trough",
  "san-joaquin-river-outline",
  "san-joaquin-river-body",
] as const

const DEFAULT_RIVER_BODY_COLOR = "#042f67" // rgb(4, 47, 103)
const RIVER_TROUGH_COLOR = "#1a3a52"
const RIVER_OUTLINE_COLOR = themeValues.palette.common.white

interface RiversLayerProps {
  visible: boolean
  progress: number
  /** Explore salmon view: only Sacramento mainstem, no San Joaquin. */
  sacramentoOnly?: boolean
}

const CurvedRiverLabel = memo(function CurvedRiverLabel({
  text,
  rotation = 90,
  curvature = 20,
  sCurve = false,
  letterSpacing = 2,
  opacity = 1,
}: {
  text: string
  rotation?: number
  curvature?: number
  sCurve?: boolean
  letterSpacing?: number
  opacity?: number
}) {
  const theme = useTheme()
  const pathId = `river-curve-${text.replace(/\s/g, "-")}`
  const curvePath = sCurve
    ? `M 10,45 C 70,${45 - curvature} 150,${45 + curvature} 210,45`
    : `M 10,45 Q 110,${45 - curvature} 210,45`

  return (
    <svg
      width="220"
      height="70"
      viewBox="0 0 220 70"
      style={{
        overflow: "visible",
        transform: `rotate(${rotation}deg)`,
        opacity,
        transition: "opacity 0.3s ease-out",
      }}
    >
      <defs>
        <path id={pathId} d={curvePath} fill="none" />
      </defs>
      <text
        fontSize="15"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fill={theme.palette.common.white}
        fillOpacity="0.9"
        fontWeight="700"
        letterSpacing={letterSpacing}
      >
        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
          {text}
        </textPath>
      </text>
    </svg>
  )
})

export default function RiversLayer({
  visible,
  progress,
  sacramentoOnly = false,
}: RiversLayerProps) {
  const theme = useTheme()
  const { mapRef } = useMap()
  const isOutcomeActive = useIsOutcomeVisualizationActive()
  const activeOutcomeViz = useActiveOutcomeVisualization()
  const mapMode = useMapMode()
  const isExploreMode = mapMode === "explore"
  const isSalmonOutcome = activeOutcomeViz?.outcomeCode === "WRC_SALMON_AB"

  // Get visualization color for Salmon abundance outcome (no camera side effects)
  const sacramentoColor = useSalmonRiverColor()

  const clampedProgress = Math.max(0, Math.min(1, progress))
  const trimOffset = useMemo<[number, number]>(
    () => [clampedProgress, 1],
    [clampedProgress],
  )
  const visibilityValue = visible ? "visible" : "none"

  // Sacramento river color - use visualization color if active, otherwise default blue
  const sacBodyColor = sacramentoColor ?? DEFAULT_RIVER_BODY_COLOR
  const hasSalmonTierColor = sacramentoColor != null
  const sacBodyWidth = 2
  const sacOutlineWidth = 4
  const sacTroughWidth = 7
  /** Softer white halo so the tier stroke reads as fully saturated. */
  const SALMON_OUTLINE_WHITE_OPACITY = 0.4

  // Fade river lines when a non-salmon outcome visualization is active.
  // Winter-run salmon uses the Sacramento main stem as the map encoding;
  // keep the line opacities up so the tier color remains visible.
  const hideRiversForOtherOutcomeViz = isOutcomeActive && !isSalmonOutcome
  const troughTargetOpacity = hideRiversForOtherOutcomeViz ? 0 : 0.6
  const lineTargetOpacity = hideRiversForOtherOutcomeViz ? 0 : 1
  // Tier body: always alpha 1 when we have a salmon result; outline white is thinned in opacity.
  const sacBodyLineOpacity = hasSalmonTierColor ? 1 : lineTargetOpacity
  const sacOutlineLineOpacity = hasSalmonTierColor
    ? SALMON_OUTLINE_WHITE_OPACITY
    : lineTargetOpacity

  // Move rivers to top when visible
  useEffect(() => {
    if (!visible) return
    const map = mapRef?.current?.getMap()
    if (!map?.isStyleLoaded()) return

    const ids = sacramentoOnly ? SACRAMENTO_RIVER_LAYER_IDS : RIVER_LAYER_IDS
    ids.forEach((id) => {
      try {
        if (map.getLayer(id)) map.moveLayer(id)
      } catch {
        // ignore
      }
    })
  }, [visible, mapRef, sacramentoOnly])

  const labelOpacity = useMemo(() => {
    if (!visible || isOutcomeActive || isExploreMode) return 0
    return Math.max(0, Math.min(1, (clampedProgress - 0.3) / 0.2))
  }, [visible, clampedProgress, isOutcomeActive, isExploreMode])

  const deltaOpacity = useMemo(() => {
    if (!visible || isExploreMode) return 0
    return Math.max(0, Math.min(1, (clampedProgress - 0.8) / 0.15))
  }, [visible, clampedProgress, isExploreMode])

  const labelPositions = useMemo(
    () => ({
      sacramento: { lon: -121.6, lat: 39.4 },
      sanJoaquin: { lon: -120.6, lat: 37.7 },
      delta: { lon: -122.2, lat: 37.9 },
    }),
    [],
  )

  const riverLayout = useMemo(
    () => ({
      "line-join": "round" as const,
      "line-cap": "round" as const,
      visibility: visibilityValue as "visible" | "none",
    }),
    [visibilityValue],
  )

  const sacTroughPaint = useMemo(
    () => ({
      "line-color": RIVER_TROUGH_COLOR,
      "line-width": sacTroughWidth,
      "line-opacity": troughTargetOpacity,
      "line-opacity-transition": OPACITY_TRANSITION,
      "line-trim-offset": trimOffset,
    }),
    [sacTroughWidth, troughTargetOpacity, trimOffset],
  )

  const sacOutlinePaint = useMemo(
    () => ({
      "line-color": RIVER_OUTLINE_COLOR,
      "line-width": sacOutlineWidth,
      "line-opacity": sacOutlineLineOpacity,
      "line-opacity-transition": OPACITY_TRANSITION,
      "line-trim-offset": trimOffset,
    }),
    [sacOutlineWidth, sacOutlineLineOpacity, trimOffset],
  )

  const sacBodyPaint = useMemo(
    () => ({
      "line-color": sacBodyColor,
      "line-width": sacBodyWidth,
      "line-opacity": sacBodyLineOpacity,
      "line-opacity-transition": OPACITY_TRANSITION,
      "line-trim-offset": trimOffset,
    }),
    [sacBodyColor, sacBodyWidth, sacBodyLineOpacity, trimOffset],
  )

  const sjTroughPaint = useMemo(
    () => ({
      "line-color": RIVER_TROUGH_COLOR,
      "line-width": 7,
      "line-opacity": troughTargetOpacity,
      "line-opacity-transition": OPACITY_TRANSITION,
      "line-trim-offset": trimOffset,
    }),
    [troughTargetOpacity, trimOffset],
  )

  const sjOutlinePaint = useMemo(
    () => ({
      "line-color": RIVER_OUTLINE_COLOR,
      "line-width": 4,
      "line-opacity": lineTargetOpacity,
      "line-opacity-transition": OPACITY_TRANSITION,
      "line-trim-offset": trimOffset,
    }),
    [lineTargetOpacity, trimOffset],
  )

  const sjBodyPaint = useMemo(
    () => ({
      "line-color": DEFAULT_RIVER_BODY_COLOR,
      "line-width": 2,
      "line-opacity": lineTargetOpacity,
      "line-opacity-transition": OPACITY_TRANSITION,
      "line-trim-offset": trimOffset,
    }),
    [lineTargetOpacity, trimOffset],
  )

  return (
    <>
      <Source
        id="sacramento-river-source"
        type="geojson"
        data={sacramentoRiverMainstem}
        lineMetrics={true}
      >
        <Layer
          id="sacramento-river-trough"
          type="line"
          paint={sacTroughPaint}
          layout={riverLayout}
        />
        <Layer
          id="sacramento-river-outline"
          type="line"
          paint={sacOutlinePaint}
          layout={riverLayout}
        />
        <Layer
          id="sacramento-river-body"
          type="line"
          paint={sacBodyPaint}
          layout={riverLayout}
        />
      </Source>

      {!sacramentoOnly && (
        <Source
          id="san-joaquin-river-source"
          type="geojson"
          data={sanJoaquinRiverMainstem}
          lineMetrics={true}
        >
          <Layer
            id="san-joaquin-river-trough"
            type="line"
            paint={sjTroughPaint}
            layout={riverLayout}
          />
          <Layer
            id="san-joaquin-river-outline"
            type="line"
            paint={sjOutlinePaint}
            layout={riverLayout}
          />
          <Layer
            id="san-joaquin-river-body"
            type="line"
            paint={sjBodyPaint}
            layout={riverLayout}
          />
        </Source>
      )}

      <Marker
        longitude={labelPositions.sacramento.lon}
        latitude={labelPositions.sacramento.lat}
        anchor="center"
      >
        <CurvedRiverLabel
          text="Sacramento River"
          rotation={50}
          curvature={88}
          sCurve={true}
          letterSpacing={5}
          opacity={labelOpacity}
        />
      </Marker>

      {!sacramentoOnly && (
        <Marker
          longitude={labelPositions.sanJoaquin.lon}
          latitude={labelPositions.sanJoaquin.lat}
          anchor="center"
        >
          <CurvedRiverLabel
            text="San Joaquin River"
            rotation={56}
            curvature={-35}
            letterSpacing={2}
            opacity={labelOpacity}
          />
        </Marker>
      )}

      <Marker
        longitude={labelPositions.delta.lon}
        latitude={labelPositions.delta.lat}
        anchor="center"
      >
        <div
          style={{ opacity: deltaOpacity, transition: "opacity 0.3s ease-out" }}
        >
          <svg width="60" height="30" xmlns="http://www.w3.org/2000/svg">
            <text
              x="30"
              y="20"
              textAnchor="middle"
              style={{
                fontFamily: "Georgia, Times New Roman, serif",
                fontSize: "15px",
                fontWeight: theme.typography.fontWeightBold,
                fontStyle: "italic",
                fill: theme.palette.common.white,
                fillOpacity: 0.9,
              }}
            >
              Delta
            </text>
          </svg>
        </div>
      </Marker>
    </>
  )
}
