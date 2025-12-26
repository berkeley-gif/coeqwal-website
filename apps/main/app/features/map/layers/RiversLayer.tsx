"use client"

/**
 * RiversLayer - Map layer for major rivers
 *
 * Displays Sacramento and San Joaquin river lines with labels.
 * Includes the Delta region.
 */

import { memo, useMemo, useEffect } from "react"
import { Source, Layer, Marker, useMap } from "@repo/map"
import { useTheme } from "@repo/ui/mui"
import { sacramentoRiverMainstem, sanJoaquinRiverMainstem } from "@repo/data"
import { useIsOutcomeVisualizationActive } from "../store"

// River layer IDs - exported for use by other components that need to reference them
export const RIVER_LAYER_IDS = [
  "sacramento-river-trough",
  "sacramento-river-body",
  "san-joaquin-river-trough",
  "san-joaquin-river-body",
] as const

interface RiversLayerProps {
  visible: boolean
  /** Animation progress from 0 (not drawn) to 1 (fully drawn). Controlled by scroll. */
  progress: number
}

// Curved river label component with transparent background (memoized for performance)
const CurvedRiverLabel = memo(function CurvedRiverLabel({
  text,
  rotation = 90,
  curvature = 20,
  sCurve = false,
  reverseSCurve = false,
  letterSpacing = 2,
  opacity = 1,
}: {
  text: string
  rotation?: number
  curvature?: number
  /** S-curve: goes up first, then down */
  sCurve?: boolean
  /** Reverse S-curve: goes down first, then up */
  reverseSCurve?: boolean
  letterSpacing?: number
  opacity?: number
}) {
  const theme = useTheme()
  const pathId = `river-curve-${text.replace(/\s/g, "-")}`

  // Create curved path - positive curvature curves up, negative curves down
  let curvePath
  if (reverseSCurve) {
    // Reverse S-curve using cubic Bezier (C command) with two control points
    // Goes down first, then up
    curvePath = `M 10,45 C 70,${45 + curvature} 150,${45 - curvature} 210,45`
  } else if (sCurve) {
    // S-curve using cubic Bezier (C command) with two control points
    // Goes up first, then down
    curvePath = `M 10,45 C 70,${45 - curvature} 150,${45 + curvature} 210,45`
  } else {
    // Simple curve using quadratic Bezier (Q command)
    curvePath = `M 10,45 Q 110,${45 - curvature} 210,45`
  }

  return (
    <svg
      width="220"
      height="70"
      viewBox="0 0 220 70"
      style={{
        overflow: "visible",
        transform: `rotate(${rotation}deg)`,
        opacity,
        transition: "opacity 0.3s ease-out", // theme.transition.fade equivalent
      }}
    >
      <defs>
        {/* Curved path for text to follow */}
        <path id={pathId} d={curvePath} fill="none" />
      </defs>

      {/* Curved italic text following the path */}
      <text
        fontSize="15"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fill={theme.palette.utility.white}
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

export default function RiversLayer({ visible, progress }: RiversLayerProps) {
  const theme = useTheme()
  const { mapRef } = useMap()

  // Clamp progress to [0, 1] to avoid floating-point precision errors
  // Progress goes 0→1 as user scrolls (matches old choreography)
  const clampedProgress = Math.max(0, Math.min(1, progress))

  // Check if outcome visualization is active - hide labels when showing outcome data
  const isOutcomeActive = useIsOutcomeVisualizationActive()

  // Move river layers to the top of the layer stack
  // This ensures rivers are always visible above polygon visualizations
  useEffect(() => {
    if (!visible || !mapRef?.current) return

    const map = mapRef.current.getMap()

    // Small delay to ensure layers are added first
    const timeoutId = setTimeout(() => {
      // Move each river layer to the top (in order, so body ends up on top)
      RIVER_LAYER_IDS.forEach((layerId) => {
        try {
          if (map.getLayer(layerId)) {
            map.moveLayer(layerId)
          }
        } catch {
          // Layer might not exist yet, ignore
        }
      })
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [visible, mapRef])

  // Calculate label opacity: fade in from 30% to 50% of river drawing
  // Labels are hidden when outcome visualization is active
  const labelOpacity = useMemo(() => {
    if (!visible || isOutcomeActive) return 0
    const labelFadeStart = 0.3
    const labelFadeEnd = 0.5
    return Math.max(
      0,
      Math.min(
        1,
        (clampedProgress - labelFadeStart) / (labelFadeEnd - labelFadeStart),
      ),
    )
  }, [visible, clampedProgress, isOutcomeActive])

  // Calculate Delta marker opacity: fade in from 80% to 95% of river drawing
  const deltaOpacity = useMemo(() => {
    if (!visible) return 0
    const deltaFadeStart = 0.8
    const deltaFadeEnd = 0.95
    return Math.max(
      0,
      Math.min(
        1,
        (clampedProgress - deltaFadeStart) / (deltaFadeEnd - deltaFadeStart),
      ),
    )
  }, [visible, clampedProgress])

  // River label positions (memoized bc they're constant)
  const labelPositions = useMemo(
    () => ({
      sacramento: { lon: -121.6, lat: 39.4 },
      sanJoaquin: { lon: -120.6, lat: 37.7 },
      delta: { lon: -122.2, lat: 37.9 },
    }),
    [],
  )

  if (!visible) return null

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          SACRAMENTO RIVER - Animated layers
          ═══════════════════════════════════════════════════════════════ */}
      <Source
        id="sacramento-river-source"
        type="geojson"
        data={sacramentoRiverMainstem}
        lineMetrics={true}
      >
        {/* Layer 0: Trough (semi-transparent dark blue outline) */}
        <Layer
          id="sacramento-river-trough"
          type="line"
          paint={{
            "line-color": "#1a3a52",
            "line-width": 7,
            "line-opacity": 0.5,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />

        {/* Layer 1: Main river body */}
        <Layer
          id="sacramento-river-body"
          type="line"
          paint={{
            "line-color": "#116bb0",
            "line-width": 3,
            "line-opacity": 1,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />
      </Source>

      {/* ═══════════════════════════════════════════════════════════════
          SAN JOAQUIN RIVER - Animated layers
          ═══════════════════════════════════════════════════════════════ */}
      <Source
        id="san-joaquin-river-source"
        type="geojson"
        data={sanJoaquinRiverMainstem}
        lineMetrics={true}
      >
        {/* Layer 0: Trough (semi-transparent dark blue outline) */}
        <Layer
          id="san-joaquin-river-trough"
          type="line"
          paint={{
            "line-color": "#1a3a52",
            "line-width": 7,
            "line-opacity": 0.5,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />

        {/* Layer 1: Main river body */}
        <Layer
          id="san-joaquin-river-body"
          type="line"
          paint={{
            "line-color": "#116bb0",
            "line-width": 3,
            "line-opacity": 1,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />
      </Source>

      {/* ═══════════════════════════════════════════════════════════════
          RIVER LABELS
          ═══════════════════════════════════════════════════════════════ */}

      {/* Sacramento River curved label */}
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

      {/* San Joaquin River curved label */}
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

      {/* Delta marker - appears when rivers meet */}
      <Marker
        longitude={labelPositions.delta.lon}
        latitude={labelPositions.delta.lat}
        anchor="center"
      >
        <div
          style={{
            opacity: deltaOpacity,
            transition: "opacity 0.3s ease-out", // theme.transition.fade equivalent
          }}
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
                fill: theme.palette.utility.white,
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
