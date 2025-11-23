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
export default function BasinInflowArrows({
  visible = true,
}: BasinInflowArrowsProps) {
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
    { lon: -122.65, lat: 40.2, rotation: 270, label: "NW - Shasta area" },
    { lon: -122.05, lat: 40.55, rotation: 60, label: "N - Central north" }, // Curved tail
    { lon: -121.75, lat: 40.1, rotation: 90, label: "NE - Lassen area" },

    // ===== EASTERN RIM (Sierra Nevada - water flows west) =====
    { lon: -121.2, lat: 39.3, rotation: 90, label: "E - North Sierra" },
    { lon: -121.05, lat: 39.0, rotation: 90, label: "E - Central Sierra" },
    { lon: -120.0, lat: 38.0, rotation: 90, label: "E - Mid Sierra" },
    { lon: -119.8, lat: 37.0, rotation: 90, label: "E - South Central Sierra" },

    // ===== WESTERN RIM (Coast Ranges - water flows east) =====
    { lon: -121.0, lat: 36.8, rotation: 270, label: "W - Central Coast Range" },
    { lon: -122.7, lat: 38.8, rotation: 270, label: "W - North Coast Range" },
    { lon: -122.5, lat: 39.9, rotation: 270, label: "NW - Northwestern rim" },
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
                {index === 1 ? (
                  // Gradient for curved arrow - uses actual coordinates
                  <linearGradient
                    id={`arrow-gradient-${index}`}
                    x1="35"
                    y1="18"
                    x2="35"
                    y2="47"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor={arrowColor} stopOpacity="0" />
                    <stop
                      offset="25%"
                      stopColor={arrowColor}
                      stopOpacity="0.3"
                    />
                    <stop
                      offset="60%"
                      stopColor={arrowColor}
                      stopOpacity="0.7"
                    />
                    <stop
                      offset="100%"
                      stopColor={arrowColor}
                      stopOpacity="1"
                    />
                  </linearGradient>
                ) : (
                  // Standard gradient for other arrows
                  <linearGradient
                    id={`arrow-gradient-${index}`}
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor={arrowColor} stopOpacity="0" />
                    <stop
                      offset="25%"
                      stopColor={arrowColor}
                      stopOpacity="0.3"
                    />
                    <stop
                      offset="60%"
                      stopColor={arrowColor}
                      stopOpacity="0.7"
                    />
                    <stop
                      offset="100%"
                      stopColor={arrowColor}
                      stopOpacity="1"
                    />
                  </linearGradient>
                )}
              </defs>

              {/* Fading tail - curved for arrow 2, straight for others */}
              {index === 1 ? (
                // Curved tail with constant width for arrow 2
                <path
                  d="M 29 18
                     C 26 28, 26 37, 29 47
                     L 41 47
                     C 38 37, 38 28, 41 18
                     Z"
                  fill={`url(#arrow-gradient-${index})`}
                />
              ) : (
                // Straight rectangular tail for other arrows
                <rect
                  x="29"
                  y="18"
                  width="12"
                  height="29"
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
              {/* Temporary number label */}
              <text
                x="35"
                y="35"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="16"
                fontWeight="bold"
                style={{ pointerEvents: "none" }}
              >
                {index}
              </text>
            </svg>
          </Box>
        </Marker>
      ))}
    </>
  )
}
