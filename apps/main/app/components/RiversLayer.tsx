"use client"

import { Source, Layer, Marker } from "@repo/map"
import { sacramentoRiverMainstem, sanJoaquinRiverMainstem } from "@repo/data"

interface RiversLayerProps {
  visible: boolean
  /** Animation progress from 0 (not drawn) to 1 (fully drawn). Controlled by scroll. */
  progress: number
}

// Curved river label component with transparent background
function CurvedRiverLabel({ 
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
}

export default function RiversLayer({ visible, progress }: RiversLayerProps) {
  // Clamp progress to [0, 1] to avoid floating-point precision errors
  const clampedProgress = Math.max(0, Math.min(1, progress))

  // Calculate label opacity: fade in from 30% to 50% of river drawing
  const labelFadeStart = 0.3
  const labelFadeEnd = 0.5
  const labelOpacity = visible 
    ? Math.max(0, Math.min(1, (clampedProgress - labelFadeStart) / (labelFadeEnd - labelFadeStart)))
    : 0

  // River label positions (geolocated like the arrows)
  const sacramentoLabelPosition = {
    lon: -121.45,
    lat: 39,
  }

  const sanJoaquinLabelPosition = {
    lon: -120.44,
    lat: 37.6,
  }

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
        {/* Layer 1: Outer glow */}
        <Layer
          id="sacramento-river-glow"
          type="line"
          paint={{
            "line-color": "#4A90C9",
            "line-width": 7,
            "line-blur": 6,
            "line-opacity": 0.3,
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
            "line-width": 3.5,
            "line-opacity": 0.85,
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
            "line-width": 1.5,
            "line-opacity": 0.6,
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
        {/* Layer 1: Outer glow */}
        <Layer
          id="san-joaquin-river-glow"
          type="line"
          paint={{
            "line-color": "#4A90C9",
            "line-width": 7,
            "line-blur": 6,
            "line-opacity": 0.3,
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
            "line-width": 3.5,
            "line-opacity": 0.85,
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
            "line-width": 1.5,
            "line-opacity": 0.6,
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
        longitude={sacramentoLabelPosition.lon}
        latitude={sacramentoLabelPosition.lat}
        anchor="center"
      >
        <CurvedRiverLabel 
          text="Sacramento River" 
          rotation={96} // 8 degrees counter-clockwise from 90
          curvature={90} // Emphasized reverse S-curve
          sCurve={true} // Enable reverse S-curve
          letterSpacing={5} // Letter spacing
          opacity={labelOpacity}
        />
      </Marker>

      {/* San Joaquin River Curved Label */}
      <Marker
        longitude={sanJoaquinLabelPosition.lon}
        latitude={sanJoaquinLabelPosition.lat}
        anchor="center"
      >
        <CurvedRiverLabel 
          text="San Joaquin River" 
          rotation={50}
          curvature={-35} // (negative = curves down)
          letterSpacing={2} // Letter spacing
          opacity={labelOpacity}
        />
      </Marker>
    </>
  )
}