"use client"

/**
 * RiversLayer - Sacramento and San Joaquin rivers
 *
 * Renders river lines with labels. Visibility controlled via Mapbox layout property.
 * Handles its own visualization coloring for Salmon abundance outcome.
 */

import { memo, useMemo, useEffect } from "react"
import { Source, Layer, Marker, useMap } from "@repo/map"
import { useTheme } from "@repo/ui/mui"
import { sacramentoRiverMainstem, sanJoaquinRiverMainstem } from "@repo/data"
import { useIsOutcomeVisualizationActive, useMapMode } from "../store"
import { useSalmonRiverColor } from "../visualizationLayers/hooks/useSalmonRiverColor"

export const RIVER_LAYER_IDS = [
  "sacramento-river-trough",
  "sacramento-river-outline",
  "sacramento-river-body",
  "san-joaquin-river-trough",
  "san-joaquin-river-outline",
  "san-joaquin-river-body",
] as const

const DEFAULT_RIVER_BODY_COLOR = "#116bb0"
const RIVER_TROUGH_COLOR = "#1a3a52"
const RIVER_OUTLINE_COLOR = "#ffffff"

interface RiversLayerProps {
  visible: boolean
  progress: number
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

export default function RiversLayer({ visible, progress }: RiversLayerProps) {
  const theme = useTheme()
  const { mapRef } = useMap()
  const isOutcomeActive = useIsOutcomeVisualizationActive()
  const mapMode = useMapMode()
  const isExploreMode = mapMode === "explore"

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
  const sacBodyWidth = 2
  const sacOutlineWidth = 3
  const sacTroughWidth = 6

  // Update layer properties when visibility, progress, or color changes
  useEffect(() => {
    const map = mapRef?.current?.getMap()
    if (!map?.isStyleLoaded()) return

    // Sacramento layers
    if (map.getLayer("sacramento-river-trough")) {
      map.setLayoutProperty(
        "sacramento-river-trough",
        "visibility",
        visibilityValue,
      )
      map.setPaintProperty(
        "sacramento-river-trough",
        "line-width",
        sacTroughWidth,
      )
      map.setPaintProperty(
        "sacramento-river-trough",
        "line-trim-offset",
        trimOffset,
      )
    }
    if (map.getLayer("sacramento-river-outline")) {
      map.setLayoutProperty(
        "sacramento-river-outline",
        "visibility",
        visibilityValue,
      )
      map.setPaintProperty(
        "sacramento-river-outline",
        "line-width",
        sacOutlineWidth,
      )
      map.setPaintProperty(
        "sacramento-river-outline",
        "line-trim-offset",
        trimOffset,
      )
    }
    if (map.getLayer("sacramento-river-body")) {
      map.setLayoutProperty(
        "sacramento-river-body",
        "visibility",
        visibilityValue,
      )
      map.setPaintProperty("sacramento-river-body", "line-color", sacBodyColor)
      map.setPaintProperty("sacramento-river-body", "line-width", sacBodyWidth)
      map.setPaintProperty(
        "sacramento-river-body",
        "line-trim-offset",
        trimOffset,
      )
    }

    // San Joaquin layers
    if (map.getLayer("san-joaquin-river-trough")) {
      map.setLayoutProperty(
        "san-joaquin-river-trough",
        "visibility",
        visibilityValue,
      )
      map.setPaintProperty(
        "san-joaquin-river-trough",
        "line-trim-offset",
        trimOffset,
      )
    }
    if (map.getLayer("san-joaquin-river-outline")) {
      map.setLayoutProperty(
        "san-joaquin-river-outline",
        "visibility",
        visibilityValue,
      )
      map.setPaintProperty(
        "san-joaquin-river-outline",
        "line-trim-offset",
        trimOffset,
      )
    }
    if (map.getLayer("san-joaquin-river-body")) {
      map.setLayoutProperty(
        "san-joaquin-river-body",
        "visibility",
        visibilityValue,
      )
      map.setPaintProperty(
        "san-joaquin-river-body",
        "line-trim-offset",
        trimOffset,
      )
    }
  }, [
    visible,
    visibilityValue,
    trimOffset,
    sacBodyColor,
    sacBodyWidth,
    sacOutlineWidth,
    sacTroughWidth,
    mapRef,
  ])

  // Move rivers to top when visible
  useEffect(() => {
    if (!visible) return
    const map = mapRef?.current?.getMap()
    if (!map?.isStyleLoaded()) return

    RIVER_LAYER_IDS.forEach((id) => {
      try {
        if (map.getLayer(id)) map.moveLayer(id)
      } catch {
        // ignore
      }
    })
  }, [visible, mapRef])

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
          paint={{
            "line-color": RIVER_TROUGH_COLOR,
            "line-width": sacTroughWidth,
            "line-opacity": 0.6,
            "line-trim-offset": trimOffset,
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
            visibility: visibilityValue,
          }}
        />
        <Layer
          id="sacramento-river-outline"
          type="line"
          paint={{
            "line-color": RIVER_OUTLINE_COLOR,
            "line-width": sacOutlineWidth,
            "line-opacity": 0.9,
            "line-trim-offset": trimOffset,
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
            visibility: visibilityValue,
          }}
        />
        <Layer
          id="sacramento-river-body"
          type="line"
          paint={{
            "line-color": sacBodyColor,
            "line-width": sacBodyWidth,
            "line-opacity": 1,
            "line-trim-offset": trimOffset,
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
            visibility: visibilityValue,
          }}
        />
      </Source>

      <Source
        id="san-joaquin-river-source"
        type="geojson"
        data={sanJoaquinRiverMainstem}
        lineMetrics={true}
      >
        <Layer
          id="san-joaquin-river-trough"
          type="line"
          paint={{
            "line-color": RIVER_TROUGH_COLOR,
            "line-width": 6,
            "line-opacity": 0.6,
            "line-trim-offset": trimOffset,
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
            visibility: visibilityValue,
          }}
        />
        <Layer
          id="san-joaquin-river-outline"
          type="line"
          paint={{
            "line-color": RIVER_OUTLINE_COLOR,
            "line-width": 3,
            "line-opacity": 0.9,
            "line-trim-offset": trimOffset,
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
            visibility: visibilityValue,
          }}
        />
        <Layer
          id="san-joaquin-river-body"
          type="line"
          paint={{
            "line-color": DEFAULT_RIVER_BODY_COLOR,
            "line-width": 2,
            "line-opacity": 1,
            "line-trim-offset": trimOffset,
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
            visibility: visibilityValue,
          }}
        />
      </Source>

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
