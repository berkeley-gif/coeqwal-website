/**
 * ScrollSection - Wrapper for standard scroll sections
 *
 * Provides the common Box wrapper with minHeight and pointer events
 * used by most scroll sections in MapOverlayPanels.
 */

import { Box } from "@repo/ui/mui"
import type { ReactNode } from "react"

interface ScrollSectionProps {
  /** Children to render in the section */
  children: ReactNode
  /** Alignment of content (default: center) */
  alignItems?: "center" | "flex-start" | "flex-end"
  /** Margin top (e.g., "50vh") */
  mt?: string
  /** Additional sx props */
  sx?: Record<string, unknown>
}

export function ScrollSection({
  children,
  alignItems = "center",
  mt,
  sx,
}: ScrollSectionProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems,
        pointerEvents: "none",
        ...(mt && { mt }),
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}

export default ScrollSection
