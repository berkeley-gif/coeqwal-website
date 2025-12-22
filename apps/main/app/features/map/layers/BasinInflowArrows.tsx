"use client"

import { useState, useEffect } from "react"
import { Marker } from "@repo/map"
import { Box } from "@repo/ui/mui"

interface BasinInflowArrowsProps {
  visible?: boolean
  opacity?: number // 0 to 1, controlled by scroll progress
}

/**
 * Arrow markers positioned around the Central Valley basin perimeter
 * pointing inward to represent water flowing from mountain rims into the valley
 */
export default function BasinInflowArrows({
  visible = true,
  opacity = 1,
}: BasinInflowArrowsProps) {
  // Debug flag: set to true to show arrow numbers for positioning
  const SHOW_DEBUG_NUMBERS = false

  // Keyboard toggle: press 'A' to toggle visibility
  const [keyboardVisible, setKeyboardVisible] = useState(true)

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "a" || event.key === "A") {
        setKeyboardVisible((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => {
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [])

  // Always render, but control opacity for smooth transitions
  // (returning null would unmount, preventing CSS transitions)
  const effectiveOpacity = visible && keyboardVisible ? opacity : 0

  /**
   * Arrow positions around the Central Valley basin perimeter
   *
   * To adjust positioning:
   * - Can use debug per arrow number labels (toggle with SHOW_DEBUG_NUMBERS flag)
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
    { lon: -122.05, lat: 40.75, rotation: 65, label: "N - Central north" },
    { lon: -121.85, lat: 40, rotation: 65, label: "NE - Lassen area" },

    // ===== EASTERN RIM (Sierra Nevada - water flows west) =====
    { lon: -121.05, lat: 39.0, rotation: 65, label: "E - Central Sierra" },
    { lon: -120.8, lat: 38.1, rotation: 65, label: "E - Mid Sierra" },
    { lon: -119.9, lat: 37.1, rotation: 65, label: "E - South Central Sierra" },

    // ===== WESTERN RIM (Coast Ranges - water flows east) =====
    { lon: -121.2, lat: 37.4, rotation: 240, label: "W - Central Coast Range" },
    { lon: -122.5, lat: 39.3, rotation: 240, label: "W - North Coast Range" },
    { lon: -122.6, lat: 40.3125, rotation: 240, label: "NW - Northwestern rim",
    },
  ]

  const arrowColor = "#2196F3" // TODO: Map components theme, once Meli finishes design system

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
              opacity: effectiveOpacity,
              transition: "opacity 0.8s ease-out",
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
                <linearGradient
                  id={`arrow-gradient-${index}`}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={arrowColor} stopOpacity="0" />
                  <stop offset="25%" stopColor={arrowColor} stopOpacity="0.3" />
                  <stop offset="60%" stopColor={arrowColor} stopOpacity="0.7" />
                  <stop offset="100%" stopColor={arrowColor} stopOpacity="1" />
                </linearGradient>
              </defs>

              {/* Fading tail - straight for all arrows (curved tail saved for later) */}
              <rect
                x="29"
                y="18"
                width="12"
                height="29"
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
              {/* Debug number label (toggle with SHOW_DEBUG_NUMBERS flag) */}
              {SHOW_DEBUG_NUMBERS && (
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
              )}
            </svg>
          </Box>
        </Marker>
      ))}
    </>
  )
}
