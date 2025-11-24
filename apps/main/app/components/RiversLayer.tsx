"use client"

import { memo, useMemo } from "react"
import { Source, Layer, Marker } from "@repo/map"
import { sacramentoRiverMainstem, sanJoaquinRiverMainstem } from "@repo/data"

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
  letterSpacing = 2,
  opacity = 1
}: { 
  text: string
  rotation?: number
  curvature?: number
  sCurve?: boolean
  letterSpacing?: number
  opacity?: number
}) {
  const pathId = `river-curve-${text.replace(/\s/g, '-')}`
  
  // Create curved path - positive curvature curves up, negative curves down
  let curvePath
  if (sCurve) {
    // Reverse S-curve using cubic Bezier (C command) with two control points
    // Goes down first, then up
    curvePath = `M 10,45 C 70,${45 + curvature} 150,${45 - curvature} 210,45`
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
        transition: "opacity 0.3s ease-in-out",
      }}
    >
      <defs>
        {/* Curved path for text to follow */}
        <path
          id={pathId}
          d={curvePath}
          fill="none"
        />
      </defs>
      
      {/* Curved italic text following the path */}
      <text
        fontSize="15"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fill="#FFFFFF"
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
  // Clamp progress to [0, 1] to avoid floating-point precision errors
  const clampedProgress = Math.max(0, Math.min(1, progress))

  // Calculate label opacity: fade in from 30% to 50% of river drawing
  const labelOpacity = useMemo(() => {
    if (!visible) return 0
    const labelFadeStart = 0.3
    const labelFadeEnd = 0.5
    return Math.max(0, Math.min(1, (clampedProgress - labelFadeStart) / (labelFadeEnd - labelFadeStart)))
  }, [visible, clampedProgress])

  // Calculate Delta marker opacity: fade in from 80% to 95% of river drawing
  const deltaOpacity = useMemo(() => {
    if (!visible) return 0
    const deltaFadeStart = 0.80
    const deltaFadeEnd = 0.95
    return Math.max(0, Math.min(1, (clampedProgress - deltaFadeStart) / (deltaFadeEnd - deltaFadeStart)))
  }, [visible, clampedProgress])

  // River label positions (memoized as they're constant)
  const labelPositions = useMemo(() => ({
    sacramento: { lon: -121.45, lat: 39 },
    sanJoaquin: { lon: -120.44, lat: 37.6 },
    delta: { lon: -121.8, lat: 37.9 },
  }), [])

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
        {/* Layer 0: Depression/trough (wide, transparent dark blue underlayer) */}
        <Layer
          id="sacramento-river-trough"
          type="line"
          paint={{
            "line-color": "#1a3a52",
            "line-width": 7.5,
            "line-opacity": 0.5,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />

        {/* Layer 1: Outer glow */}
        <Layer
          id="sacramento-river-glow"
          type="line"
          paint={{
            "line-color": "#4A90C9",
            "line-width": 4.5,
            "line-blur": 3,
            "line-opacity": 0.35,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />

        {/* Layer 2: Main river body */}
        <Layer
          id="sacramento-river-body"
          type="line"
          paint={{
            "line-color": "#5B9DD6",
            "line-width": 2.5,
            "line-opacity": 0.9,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />

        {/* Layer 3: Inner highlight */}
        <Layer
          id="sacramento-river-highlight"
          type="line"
          paint={{
            "line-color": "#8BBEE8",
            "line-width": 1,
            "line-opacity": 0.7,
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
        {/* Layer 0: Depression/trough (wide, transparent dark blue underlayer) */}
        <Layer
          id="san-joaquin-river-trough"
          type="line"
          paint={{
            "line-color": "#1a3a52",
            "line-width": 7.5,
            "line-opacity": 0.5,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />

        {/* Layer 1: Outer glow */}
        <Layer
          id="san-joaquin-river-glow"
          type="line"
          paint={{
            "line-color": "#4A90C9",
            "line-width": 4.5,
            "line-blur": 3,
            "line-opacity": 0.35,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />

        {/* Layer 2: Main river body */}
        <Layer
          id="san-joaquin-river-body"
          type="line"
          paint={{
            "line-color": "#5B9DD6",
            "line-width": 2.5,
            "line-opacity": 0.9,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />

        {/* Layer 3: Inner highlight */}
        <Layer
          id="san-joaquin-river-highlight"
          type="line"
          paint={{
            "line-color": "#8BBEE8",
            "line-width": 1,
            "line-opacity": 0.7,
            "line-trim-offset": [clampedProgress, 1],
          }}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
        />
      </Source>

      {/* ═══════════════════════════════════════════════════════════════
          RIVER LABELS - Curved SVG text markers (like the inflow arrows)
          Geolocated curved text that fades in smoothly
          ═══════════════════════════════════════════════════════════════ */}
      
      {/* Sacramento River Curved Label */}
      <Marker
        longitude={labelPositions.sacramento.lon}
        latitude={labelPositions.sacramento.lat}
        anchor="center"
      >
        <CurvedRiverLabel 
          text="Sacramento River" 
          rotation={96}
          curvature={90}
          sCurve={true}
          letterSpacing={5}
          opacity={labelOpacity}
        />
      </Marker>

      {/* San Joaquin River Curved Label */}
      <Marker
        longitude={labelPositions.sanJoaquin.lon}
        latitude={labelPositions.sanJoaquin.lat}
        anchor="center"
      >
        <CurvedRiverLabel 
          text="San Joaquin River" 
          rotation={50}
          curvature={-35}
          letterSpacing={2}
          opacity={labelOpacity}
        />
      </Marker>

      {/* Delta Marker - appears when rivers meet */}
      <Marker
        longitude={labelPositions.delta.lon}
        latitude={labelPositions.delta.lat}
        anchor="center"
      >
        <div
          style={{
            opacity: deltaOpacity,
            transition: "opacity 0.3s ease-in-out",
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
                fontWeight: 700,
                fontStyle: "italic",
                fill: "#FFFFFF",
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