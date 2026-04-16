/**
 * WaterDroplet — Two-tone water droplet icon with thin stroke outline
 * and a partial fill at the bottom (waterline effect).
 */

import type { SVGProps } from "react"
import { useTheme } from "../../mui-components"

export interface WaterDropletProps extends SVGProps<SVGSVGElement> {
  /** Icon size as CSS value. Defaults to "1.1em". */
  size?: number | string
  /** Stroke and fill color. Defaults to "currentColor". */
  color?: string
  /** Outline stroke width. Defaults to theme.strokeWidth.accent. */
  strokeWidth?: number
  /** Y position (0–24) where the waterline fill begins. Higher = less fill. Defaults to 14. */
  waterlineY?: number
  /** Opacity of the waterline fill (0–1). Defaults to 0.3. */
  fillOpacity?: number
}

let nextId = 0

export function WaterDroplet({
  size = "1.1em",
  color = "currentColor",
  strokeWidth,
  waterlineY = 14,
  fillOpacity = 0.3,
  ...svgProps
}: WaterDropletProps) {
  const theme = useTheme()
  const resolvedStrokeWidth = strokeWidth ?? theme.strokeWidth.accent
  const clipId = `water-droplet-clip-${nextId++}`
  const dropletPath = "M12 2.69l-5.66 5.66a8 8 0 1 0 11.32 0L12 2.69z"

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
      style={{ color }}
      {...svgProps}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={dropletPath} />
        </clipPath>
      </defs>
      <rect
        clipPath={`url(#${clipId})`}
        x="0"
        y={waterlineY}
        width="24"
        height={24 - waterlineY}
        fill="currentColor"
        opacity={fillOpacity}
      />
      <path
        d={dropletPath}
        fill="none"
        stroke="currentColor"
        strokeWidth={resolvedStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default WaterDroplet
