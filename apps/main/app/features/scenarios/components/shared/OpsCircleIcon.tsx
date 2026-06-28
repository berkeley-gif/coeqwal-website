/**
 * OpsCircleIcon: generic reusable circle-with-text SVG component
 *
 * Renders centered text lines inside a colored circle, auto-sizing the font to
 * fit, with optional custom SVG children and a diagonal strikethrough.
 * 
 * The icon work throughout is provisional, until someone has time to make real 
 * icons.
 */

import React from "react"
import { themeValues } from "@repo/ui/themes/theme"
import { getAutoFontSize } from "./circleTextFit"

const white = themeValues.palette.common.white

export interface OpsCircleIconProps {
  /** Text lines to render centered in the circle */
  lines: string[]
  /** Circle fill color */
  color: string
  /** Render a diagonal prohibition line over the text */
  strikethrough?: boolean
  /** Font size override (auto-sized based on line count if omitted) */
  fontSize?: number
  /** Font weight (default: 600) */
  fontWeight?: number
  /** Size of the rendered icon (CSS value) */
  size?: number | string
  /** Optional custom SVG elements to render inside the circle */
  children?: React.ReactNode
}

export function OpsCircleIcon({
  lines,
  color,
  strikethrough = false,
  fontSize: fontSizeOverride,
  fontWeight = 600,
  size = "100%",
  children,
}: OpsCircleIconProps) {
  const fontSize = fontSizeOverride ?? getAutoFontSize(lines)
  const lineHeight = fontSize * 1.25

  // Center text block vertically
  const totalTextHeight = lines.length * lineHeight
  const startY = 60 - totalTextHeight / 2 + fontSize * 0.85

  return (
    <svg
      viewBox="0 0 120 120"
      style={{
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
        display: "block",
      }}
    >
      <circle cx="60" cy="60" r="60" fill={color} />

      {/* Text lines */}
      {lines.map((line, i) => (
        <text
          key={i}
          x="60"
          y={startY + i * lineHeight}
          textAnchor="middle"
          fill={white}
          fontSize={fontSize}
          fontWeight={fontWeight}
          fontFamily="'Arial Rounded MT Bold', 'Arial', sans-serif"
        >
          {line}
        </text>
      ))}

      {/* Custom SVG children (e.g., salmon silhouette) */}
      {children}

      {/* Prohibition strikethrough */}
      {strikethrough && (
        <>
          {/* Diagonal line from top-left to bottom-right */}
          <line
            x1="22"
            y1="22"
            x2="98"
            y2="98"
            stroke={white}
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Ring border to define the prohibition circle */}
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={white}
            strokeWidth="8"
          />
        </>
      )}
    </svg>
  )
}
