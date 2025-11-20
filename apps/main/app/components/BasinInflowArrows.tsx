"use client"

import { Marker } from "@repo/map"
import { Box } from "@repo/ui/mui"

interface BasinInflowArrowsProps {
  visible?: boolean
}

/**
 * Arrow markers positioned around the Central Valley basin perimeter
 * pointing inward to represent water flowing from mountain rims into the valley
 */
export default function BasinInflowArrows({ visible = true }: BasinInflowArrowsProps) {
  if (!visible) return null

  // Arrow positions around the basin perimeter with rotation angles pointing toward center
  const arrowPositions = [
    // Northern rim (pointing south inward)
    { lon: -122.3, lat: 40.3, rotation: 330 },
    { lon: -121.5, lat: 40.5, rotation: 0 },
    { lon: -120.7, lat: 40.3, rotation: 30 },
    
    // Eastern rim (pointing west inward)
    { lon: -120.0, lat: 39.5, rotation: 60 },
    { lon: -119.7, lat: 38.5, rotation: 80 },
    { lon: -119.9, lat: 37.5, rotation: 80 },
    { lon: -120.2, lat: 36.5, rotation: 100 },
    
    // Southern rim (pointing north inward)
    { lon: -120.8, lat: 35.8, rotation: 160 },
    { lon: -121.5, lat: 35.6, rotation: 180 },
    { lon: -122.2, lat: 35.9, rotation: 200 },
    
    // Western rim (pointing east inward)
    { lon: -122.8, lat: 36.8, rotation: 270 },
    { lon: -122.9, lat: 37.8, rotation: 280 },
    { lon: -122.7, lat: 38.8, rotation: 290 },
    { lon: -122.5, lat: 39.6, rotation: 300 },
  ]

  const arrowColor = "#2196F3"

  return (
    <>
      {arrowPositions.map((pos, index) => (
        <Marker
          key={`inflow-arrow-${index}`}
          longitude={pos.lon}
          latitude={pos.lat}
          anchor="center"
        >
          <Box
            sx={{
              width: 60,
              height: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `rotate(${pos.rotation}deg)`,
              pointerEvents: "none",
            }}
          >
            <svg
              width="70"
              height="70"
              viewBox="0 0 70 70"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.25))",
              }}
            >
              <defs>
                {/* Gradient that fades from solid to transparent along the tail */}
                <linearGradient id={`arrow-gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={arrowColor} stopOpacity="0" />
                  <stop offset="25%" stopColor={arrowColor} stopOpacity="0.3" />
                  <stop offset="60%" stopColor={arrowColor} stopOpacity="0.7" />
                  <stop offset="100%" stopColor={arrowColor} stopOpacity="1" />
                </linearGradient>
              </defs>
              
              {/* Wider and longer fading tail - straight rectangle */}
              <rect
                x="29"
                y="5"
                width="12"
                height="42"
                fill={`url(#arrow-gradient-${index})`}
              />
              
              {/* Rounded triangle arrowhead connected to tail */}
              <path
                d="M 35 65
                   Q 33 63 30 59
                   Q 26 54 23 49
                   Q 22 47 26 47
                   Q 30 47 33 47
                   L 37 47
                   Q 40 47 44 47
                   Q 48 47 47 49
                   Q 44 54 40 59
                   Q 37 63 35 65 Z"
                fill={arrowColor}
              />
            </svg>
          </Box>
        </Marker>
      ))}
    </>
  )
}

