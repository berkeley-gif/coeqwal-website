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
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `rotate(${pos.rotation}deg)`,
              pointerEvents: "none",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
              }}
            >
              {/* Arrow shape pointing down (will be rotated by container) */}
              <path
                d="M20 5 L20 30 M20 30 L13 23 M20 30 L27 23"
                stroke="#2196F3"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Box>
        </Marker>
      ))}
    </>
  )
}

