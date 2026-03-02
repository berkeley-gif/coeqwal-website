"use client"

/**
 * DashedCircle - reusable dashed-outline circle with a label banner.
 *
 * Two interaction modes:
 *
 * Selection mode (default):
 *   Controlled entirely by the `isSelected` prop. The parent is responsible
 *   for managing hover/click state and passing the result in. This keeps the
 *   hover zone flexible (e.g. including description text that lives outside
 *   this component).
 *
 * Navigation mode (pass `href`):
 *   Wraps the whole element in a Next.js `Link`. Fill-on-hover is CSS-driven
 *   so no React state is needed. `isSelected` can still be used to show the
 *   active-route state.
 */

import Link from "next/link"
import { Box, Typography, useTheme } from "@repo/ui/mui"

interface DashedCircleProps {
  label: string
  /** Filled (selected/active) visual state */
  isSelected?: boolean
  /** Stroke, fill, and label-banner colour. Defaults to theme text.primary */
  strokeColor?: string
  /**
   * Circle diameter. Accepts a plain number or a MUI responsive object,
   * e.g. `{ xs: 64, lg: 80 }`. Defaults to `{ xs: 64, lg: 80 }`.
   */
  size?: number | Record<string, number>
  /** Navigation mode: wraps in a Next.js Link with CSS hover fill */
  href?: string
  /** Content rendered inside the circle (e.g. ScenarioDots, icons) */
  children?: React.ReactNode
}

export function DashedCircle({
  label,
  isSelected = false,
  strokeColor,
  size = { xs: 64, lg: 80 },
  href,
  children,
}: DashedCircleProps) {
  const theme = useTheme()
  const color = strokeColor ?? theme.palette.text.primary
  const isNavMode = !!href

  const inner = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.5,
        textDecoration: "none",
        // Nav mode: CSS-driven hover fill (no React state needed)
        ...(isNavMode && {
          "&:hover .dashed-circle-shape": {
            borderStyle: "solid",
            backgroundColor: color,
          },
          "&:hover .dashed-circle-label": {
            opacity: 0.85,
          },
        }),
      }}
    >
      {/* Label banner */}
      <Box
        className="dashed-circle-label"
        sx={{
          backgroundColor: theme.palette.text.primary,
          color: theme.palette.common.white,
          px: 1.5,
          py: "3px",
          borderRadius: "4px",
          lineHeight: 1.1,
          transition: "opacity 0.2s ease",
          opacity: isSelected ? 0.85 : 1,
        }}
      >
        <Typography
          variant="compactTitle"
          component="div"
          sx={{
            textAlign: "center",
            color: "inherit",
            lineHeight: "inherit",
            whiteSpace: "pre-line",
          }}
        >
          {label}
        </Typography>
      </Box>

      {/* Circle */}
      <Box
        className="dashed-circle-shape category-circle"
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: `${theme.strokeWidth.rule}px ${isSelected ? "solid" : "dashed"} ${color}`,
          backgroundColor: isSelected ? color : "transparent",
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {children}
      </Box>
    </Box>
  )

  if (isNavMode) {
    return (
      <Link href={href} style={{ textDecoration: "none", cursor: "pointer" }}>
        {inner}
      </Link>
    )
  }

  return inner
}

export default DashedCircle
