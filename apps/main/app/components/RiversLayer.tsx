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
  curvature = 20 
}: { 
  text: string
  rotation?: number
  curvature?: number
}) {
  const pathId = `river-curve-${text.replace(/\s/g, '-')}`
  
  // Create curved path - positive curvature curves up, negative curves down
  const curvePath = `M 10,45 Q 110,${45 - curvature} 210,45`
  
  return (
    <svg
      width="220"
      height="70"
      viewBox="0 0 220 70"
      style={{
        overflow: "visible",
        transform: `rotate(${rotation}deg)`,
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
        fontWeight="700"
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

  // Show labels when rivers are at least 30% drawn
  const showLabels = visible && clampedProgress > 0.3

  // River label positions (geolocated like the arrows)
  const sacramentoLabelPosition = {
    lon: -121.51,
    lat: 39.05, // Pushed even further north
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
          Geolocated curved text with blue background
          ═══════════════════════════════════════════════════════════════ */}
      
      {/* Sacramento River Curved Label */}
      {showLabels && (
        <Marker
          longitude={sacramentoLabelPosition.lon}
          latitude={sacramentoLabelPosition.lat}
          anchor="center"
        >
          <CurvedRiverLabel 
            text="Sacramento River" 
            rotation={82} // 8 degrees counter-clockwise from 90
            curvature={20} // Normal curve
          />
        </Marker>
      )}

      {/* San Joaquin River Curved Label */}
      {showLabels && (
        <Marker
          longitude={sanJoaquinLabelPosition.lon}
          latitude={sanJoaquinLabelPosition.lat}
          anchor="center"
        >
          <CurvedRiverLabel 
            text="San Joaquin River" 
            rotation={50}
            curvature={-35} // (negative = curves down)
          />
        </Marker>
      )}
    </>
  )
}