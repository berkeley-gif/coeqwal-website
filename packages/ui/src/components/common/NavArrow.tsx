/**
 * NavArrow - Standardized navigational arrow icon
 *
 * Used for CTA links, "learn more" prompts, scroll cues, and link rows.
 * Direction is applied via a wrapper element so hover/transition animations
 * on the icon itself don't conflict with the static rotation.
 */

import { ArrowForwardIcon, useTheme } from "../../mui-components"
import type { SxProps, Theme } from "@mui/material/styles"

const ROTATION: Record<NavArrowDirection, string | undefined> = {
  right: undefined,
  down: "rotate(90deg)",
  left: "rotate(180deg)",
  up: "rotate(-90deg)",
}

export type NavArrowDirection = "right" | "down" | "left" | "up"

export interface NavArrowProps {
  /** Cardinal direction the arrow should point */
  direction?: NavArrowDirection
  /** CSS class for parent hover targeting (e.g. "&:hover .my-arrow") */
  className?: string
  /** Icon font-size (default "1.1rem") */
  size?: string
  /** Optional opacity applied to the icon */
  opacity?: number
  /** Add a thin stroke for extra visual weight (default true) */
  bold?: boolean
  /** Additional sx overrides on the inner icon */
  sx?: SxProps<Theme>
}

export function NavArrow({
  direction = "right",
  className,
  size = "1.1rem",
  opacity,
  bold = true,
  sx,
}: NavArrowProps) {
  const theme = useTheme()
  const rotation = ROTATION[direction]

  return (
    <span
      style={{
        display: "inline-flex",
        flexShrink: 0,
        transform: rotation,
        lineHeight: 0,
      }}
    >
      <ArrowForwardIcon
        className={className}
        sx={{
          fontSize: size,
          opacity,
          transition: "transform 0.15s ease",
          ...(bold && {
            "& path": {
              stroke: "currentColor",
              strokeWidth: `${theme.strokeWidth.accent}px`,
              paintOrder: "stroke fill",
            },
          }),
          ...sx,
        }}
      />
    </span>
  )
}

export default NavArrow
