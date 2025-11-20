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

  /**
   * Arrow positions around the Central Valley basin perimeter
   * 
   * To adjust positioning:
   * - lon/lat: Geographic coordinates where the arrow appears
   * - rotation: Angle in degrees (0 = down/south, 90 = left/west, 180 = up/north, 270 = right/east)
   * 
   * The Central Valley boundaries (approximate):
   * - North: 40.5° lat (Cascade Range)
   * - South: 35.5° lat (Tehachapi Mountains)
   * - East: -119.5° lon (Sierra Nevada)
   * - West: -123° lon (Coast Ranges)
   */
  const arrowPositions = [
    // ===== NORTHERN RIM (Cascade Range - water flows south) =====
    // { lon: -122.5, lat: 40.4, rotation: 0, label: "NW - Shasta area" }, // Arrow 1 - commented out
    // KEEP THIS ONE - Arrow 2 with curved tail:
    { lon: -121.8, lat: 40.65, rotation: 60, label: "N - Central north" },
    // { lon: -121.2, lat: 39.9, rotation: 90, label: "NE - Lassen area" }, // Arrow 3 - commented out
    
    // ===== EASTERN RIM (Sierra Nevada - water flows west) =====
    // { lon: -120.5, lat: 39.8, rotation: 90, label: "E - North Sierra" }, // Arrow 4 - commented out
    // { lon: -120.8, lat: 39.0, rotation: 90, label: "E - Central Sierra" }, // Arrow 5 - commented out
    // { lon: -120.0, lat: 38.0, rotation: 90, label: "E - Mid Sierra" }, // Arrow 6 - commented out
    // { lon: -119.8, lat: 37.0, rotation: 90, label: "E - South Central Sierra" }, // Arrow 7 - commented out
    
    // ===== WESTERN RIM (Coast Ranges - water flows east) =====
    // { lon: -121.0, lat: 36.8, rotation: 270, label: "W - Central Coast Range" }, // Arrow 8 - commented out
    // { lon: -122.7, lat: 38.8, rotation: 270, label: "W - North Coast Range" }, // Arrow 9 - commented out
    // { lon: -122.8, lat: 39.8, rotation: 280, label: "NW - Northwestern rim" }, // Arrow 10 - commented out
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
              width={index === 0 ? "100" : "70"}
              height={index === 0 ? "150" : "70"}
              viewBox={index === 0 ? "0 -70 70 150" : "0 0 70 70"}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.25))",
              }}
            >
              <defs>
                {/* Gradient that fades from solid to transparent along the tail */}
                {index === 0 ? (
                  // Longer gradient for arrow 2's longer tail - uses actual coordinates
                  <linearGradient 
                    id={`arrow-gradient-${index}`} 
                    x1="35" 
                    y1="-67" 
                    x2="35" 
                    y2="47"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor={arrowColor} stopOpacity="0" />
                    <stop offset="15%" stopColor={arrowColor} stopOpacity="0.2" />
                    <stop offset="40%" stopColor={arrowColor} stopOpacity="0.5" />
                    <stop offset="70%" stopColor={arrowColor} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={arrowColor} stopOpacity="1" />
                  </linearGradient>
                ) : (
                  // Standard gradient for other arrows
                  <linearGradient id={`arrow-gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={arrowColor} stopOpacity="0" />
                    <stop offset="25%" stopColor={arrowColor} stopOpacity="0.3" />
                    <stop offset="60%" stopColor={arrowColor} stopOpacity="0.7" />
                    <stop offset="100%" stopColor={arrowColor} stopOpacity="1" />
                  </linearGradient>
                )}
              </defs>
              
              {/* Wider and longer fading tail - curved for arrow 2, straight for others */}
              {index === 0 ? (
                // Curved tail with constant width for arrow 2 (twice as long)
                <path
                  d="M 29 -67
                     C 24 -20, 24 20, 29 47
                     L 41 47
                     C 36 20, 36 -20, 41 -67
                     Z"
                  fill={`url(#arrow-gradient-${index})`}
                />
              ) : (
                // Straight rectangular tail for other arrows
                <rect
                  x="29"
                  y="-10"
                  width="12"
                  height="57"
                  fill={`url(#arrow-gradient-${index})`}
                />
              )}
              
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

