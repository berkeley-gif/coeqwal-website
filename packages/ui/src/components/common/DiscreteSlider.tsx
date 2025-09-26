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
  /** Colors for styling */
  colors?: {
    track?: string
    activeStop?: string
    inactiveStop?: string
    activeLabel?: string
    inactiveLabel?: string
    pointer?: string
  }
  /** Spacing values in pixels */
  spacing?: {
    container?: number
    track?: number
    labels?: number
  }
  /** Optional custom styling */
  sx?: object
  /** Callback when hovering over a stop */
  onStopHover?: (index: number) => void
  /** Callback when leaving the slider */
  onSliderLeave?: () => void
}

const SliderContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "labelPosition" && prop !== "spacing",
})<{
  labelPosition: "top" | "bottom"
  spacing: { container?: number; track?: number; labels?: number }
}>(({ labelPosition, spacing }) => ({
  position: "relative",
  width: "100%",
  padding: `${spacing.container || 8}px 0`,
  paddingTop:
    labelPosition === "top"
      ? `${spacing.labels || 24}px`
      : `${spacing.container || 8}px`,
  paddingBottom:
    labelPosition === "bottom"
      ? `${spacing.labels || 32}px`
      : `${spacing.container || 8}px`,
  paddingLeft: "40px",
  paddingRight: "40px",
}))

const SliderTrack = styled(Box, {
  shouldForwardProp: (prop) => prop !== "trackColor" && prop !== "spacing",
})<{ trackColor: string; spacing: { track?: number } }>(
  ({ trackColor, spacing }) => ({
    position: "relative",
    height: "4px",
    backgroundColor: trackColor,
    borderRadius: "2px",
    margin: `${spacing.track || 24}px 0 ${spacing.track || 16}px 0`,
    cursor: "pointer",
  }),
)

const SliderStop = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== "active" && prop !== "activeColor" && prop !== "inactiveColor",
})<{ active: boolean; activeColor: string; inactiveColor: string }>(
  ({ active, activeColor, inactiveColor }) => ({
    position: "absolute",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    backgroundColor: active ? activeColor : inactiveColor,
    border: "2px solid white",
    transition: "all 0.2s ease",
    zIndex: 1,
    boxShadow: "none",
  }),
)

const SliderPointer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "disabled" && prop !== "pointerColor",
})<{ disabled?: boolean; pointerColor: string }>(
  ({ disabled, pointerColor }) => ({
    position: "absolute",
    top: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "24px",
    height: "24px",
    cursor: disabled ? "not-allowed" : "grab",
    transition: "all 0.2s ease",
    zIndex: 3,
    marginTop: "12px",
    color: pointerColor,
    filter: "none",
    "&:hover": disabled
      ? {}
      : {
          transform: "translateX(-50%) scale(1.1)",
          filter: "none",
        },
    "&:active": disabled
      ? {}
      : {
          cursor: "grabbing",
          transform: "translateX(-50%) scale(1.05)",
          filter: "none",
        },
    "& svg": {
      width: "70%",
      height: "70%",
      display: "block",
      margin: "auto",
    },
  }),
)

const SliderLabel = styled(Typography, {
  shouldForwardProp: (prop) =>
    prop !== "active" &&
    prop !== "labelPosition" &&
    prop !== "activeColor" &&
    prop !== "inactiveColor" &&
    prop !== "spacing",
})<{
  active: boolean
  labelPosition: "top" | "bottom"
  activeColor: string
  inactiveColor: string
  spacing: { labels?: number }
}>(({ active, labelPosition, activeColor, inactiveColor, spacing }) => ({
  position: "absolute",
  top: labelPosition === "top" ? "auto" : "100%",
  bottom: labelPosition === "top" ? "100%" : "auto",
  left: "50%",
  transform: "translateX(-50%)",
  fontSize: "0.75rem",
  fontWeight: active ? 500 : 400,
  color: active ? activeColor : inactiveColor,
  marginTop: labelPosition === "bottom" ? `${spacing.labels || 20}px` : 0,
  marginBottom: labelPosition === "top" ? `${spacing.labels || 16}px` : 0,
  textAlign: "center",
  minWidth: "50px",
  maxWidth: "80px",
  transition: "all 0.2s ease",
  lineHeight: 1.3,
}))

export function DiscreteSlider({
  stops,
  value,
  onChange,
  disabled = false,
  labelPosition = "bottom",
  colors = {
    track: "#cbd5e0",
    activeStop: "#449cd9",
    inactiveStop: "#a0aec0",
    activeLabel: "#449cd9",
    inactiveLabel: "#4a5568",
    pointer: "#449cd9",
  },
  spacing = {
    container: 8,
    track: 24,
    labels: 20,
  },
  sx = {},
  onStopHover,
  onSliderLeave,
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
    <SliderContainer
      labelPosition={labelPosition}
      spacing={spacing}
      sx={sx}
      onMouseLeave={onSliderLeave}
    >
      <SliderTrack
        ref={trackRef}
        onClick={handleTrackClick}
        trackColor={colors.track || "#cbd5e0"}
        spacing={spacing}
      >
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
              onMouseEnter={() => onStopHover?.(index)}
            >
              <SliderStop
                active={isActive}
                activeColor={colors.activeStop || "#449cd9"}
                inactiveColor={colors.inactiveStop || "#a0aec0"}
              />
              <SliderLabel
                active={isActive}
                labelPosition={labelPosition}
                activeColor={colors.activeLabel || "#449cd9"}
                inactiveColor={colors.inactiveLabel || "#4a5568"}
                spacing={spacing}
              >
                {stop}
              </SliderLabel>
              {/* Show pointer only for active stop */}
              {isActive && (
                <SliderPointer
                  disabled={disabled}
                  pointerColor={colors.pointer || "#449cd9"}
                  onMouseDown={handleMouseDown}
                >
                  <svg viewBox="0 0 16 12" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M3 10 Q2 10 2 9 Q2 8.5 2.5 8 L7 2 Q8 1 8 1 Q8 1 9 2 L13.5 8 Q14 8.5 14 9 Q14 10 13 10 Z"
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
