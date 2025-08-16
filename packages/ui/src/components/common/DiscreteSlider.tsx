"use client"

import React, { useRef, useState, useCallback } from "react"
import { Box, Typography } from "../.."
import { styled } from "@mui/material/styles"

export interface DiscreteSliderProps {
  /** Array of stop labels */
  stops: string[]
  /** Currently selected stop index */
  value: number
  /** Callback when value changes */
  onChange: (value: number) => void
  /** Optional disabled state */
  disabled?: boolean
  /** Position labels on top or bottom of slider */
  labelPosition?: "top" | "bottom"
  /** Optional custom styling */
  sx?: object
}

const SliderContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "labelPosition",
})<{ labelPosition: "top" | "bottom" }>(({ theme, labelPosition }) => ({
  position: "relative",
  width: "100%",
  padding: theme.spacing(1, 0),
  paddingTop: labelPosition === "top" ? theme.spacing(3) : theme.spacing(1),
  paddingBottom:
    labelPosition === "bottom" ? theme.spacing(4) : theme.spacing(1),
  // Add horizontal padding to account for label widths at the edges
  paddingLeft: "40px", // Half of maxWidth (80px) to prevent left label overflow
  paddingRight: "40px", // Half of maxWidth (80px) to prevent right label overflow
}))

const SliderTrack = styled(Box)(({ theme }) => ({
  position: "relative",
  height: "4px",
  backgroundColor: theme.palette.grey[300],
  borderRadius: "2px",
  margin: theme.spacing(3, 0, 2, 0),
  cursor: "pointer",
}))

const SliderStop = styled(Box, {
  shouldForwardProp: (prop) => prop !== "active",
})<{ active: boolean }>(({ theme, active }) => ({
  position: "absolute",
  top: "50%",
  transform: "translate(-50%, -50%)",
  width: "20px",
  height: "20px",
  borderRadius: "50%",
  backgroundColor: active ? theme.palette.blue.bright : theme.palette.grey[400],
  border: "2px solid white",
  transition: "all 0.2s ease",
  zIndex: 1,
  boxShadow: active ? theme.shadows[1] : "none",
}))

const SliderPointer = styled(Box)<{ disabled?: boolean }>(
  ({ theme, disabled }) => ({
    position: "absolute",
    top: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "24px",
    height: "24px",
    cursor: disabled ? "not-allowed" : "grab",
    transition: "all 0.2s ease",
    zIndex: 3,
    marginTop: "8px", // Space between track and pointer
    color: theme.palette.blue.bright, // Color for the SVG
    // Drop-shadow equivalent of MUI elevation 1 TODO: figure out how to use MUI elevation correctly
    filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.12))",
    "&:hover": disabled
      ? {}
      : {
          transform: "translateX(-50%) scale(1.1)",
          // Drop-shadow equivalent of MUI elevation 2
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.16))",
        },
    "&:active": disabled
      ? {}
      : {
          cursor: "grabbing",
          transform: "translateX(-50%) scale(1.05)",
          // Elevation 1
          filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.12))",
        },
    // SVG triangle
    "& svg": {
      width: "100%",
      height: "100%",
      display: "block",
    },
  }),
)

const SliderLabel = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "active" && prop !== "labelPosition",
})<{ active: boolean; labelPosition: "top" | "bottom" }>(
  ({ theme, active, labelPosition }) => ({
    position: "absolute",
    top: labelPosition === "top" ? "auto" : "100%",
    bottom: labelPosition === "top" ? "100%" : "auto",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "0.75rem",
    fontWeight: active ? 500 : 400,
    color: active ? theme.palette.blue.bright : theme.palette.text.secondary,
    marginTop: labelPosition === "bottom" ? theme.spacing(2.5) : 0,
    marginBottom: labelPosition === "top" ? theme.spacing(2) : 0,
    textAlign: "center",
    minWidth: "50px",
    maxWidth: "80px", // Constrain width to encourage wrapping
    transition: "all 0.2s ease",
    lineHeight: 1.2, // Tighter line height for wrapped text
  }),
)

/**
 * Custom draggable discrete slider component with labeled stops.
 *
 * Features:
 * - Horizontal draggable slider with evenly spaced stops
 * - Blue rounded rectangle pointer that snaps to stops
 * - Hover effects and smooth transitions
 * - Active state styling for current stop
 * - Custom labels for each stop
 * - Disabled state support
 * - Foreshadows brushing interactions in parallel plots
 */
export function DiscreteSlider({
  stops,
  value,
  onChange,
  disabled = false,
  labelPosition = "bottom",
  sx = {},
}: DiscreteSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const getStopPosition = (index: number) => {
    return stops.length > 1 ? (index / (stops.length - 1)) * 100 : 50
  }

  const getClosestStopIndex = useCallback(
    (percentage: number) => {
      if (stops.length <= 1) return 0

      const stopIndex = Math.round((percentage / 100) * (stops.length - 1))
      return Math.max(0, Math.min(stops.length - 1, stopIndex))
    },
    [stops.length],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return
      setIsDragging(true)
      e.preventDefault()
    },
    [disabled],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !trackRef.current || disabled) return

      const rect = trackRef.current.getBoundingClientRect()
      const percentage = Math.max(
        0,
        Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
      )
      const newIndex = getClosestStopIndex(percentage)

      if (newIndex !== value) {
        onChange(newIndex)
      }
    },
    [isDragging, disabled, value, onChange, getClosestStopIndex],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || isDragging) return

      const rect = e.currentTarget.getBoundingClientRect()
      const percentage = ((e.clientX - rect.left) / rect.width) * 100
      const newIndex = getClosestStopIndex(percentage)
      onChange(newIndex)
    },
    [disabled, isDragging, onChange, getClosestStopIndex],
  )

  // Add global mouse event listeners for dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <SliderContainer labelPosition={labelPosition} sx={sx}>
      <SliderTrack ref={trackRef} onClick={handleTrackClick}>
        {/* Render stop indicators and pointer */}
        {stops.map((stop, index) => {
          const position = getStopPosition(index)
          const isActive = index === value

          return (
            <Box
              key={`stop-${index}`}
              sx={{
                position: "absolute",
                left: `${position}%`,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            >
              <SliderStop active={isActive} />
              <SliderLabel active={isActive} labelPosition={labelPosition}>
                {stop}
              </SliderLabel>
              {/* Show pointer only for active stop */}
              {isActive && (
                <SliderPointer
                  disabled={disabled}
                  onMouseDown={handleMouseDown}
                >
                  <svg viewBox="0 0 16 12" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M3 12 Q2 12 2 11 Q2 10.5 2.5 10 L7 3 Q8 2 8 2 Q8 2 9 3 L13.5 10 Q14 10.5 14 11 Q14 12 13 12 Z"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>
                </SliderPointer>
              )}
            </Box>
          )
        })}
      </SliderTrack>
    </SliderContainer>
  )
}

export default DiscreteSlider
