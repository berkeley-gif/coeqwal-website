"use client"

/**
 * TruncatedText - Reusable text truncation with "show more" / "show less" toggle
 *
 * Truncates text to a configurable number of lines with an inline "show more"
 * link. Expanding reveals the full text with a "show less" link. Uses Framer
 * Motion for smooth cross-fade transitions between states.
 *
 * ## Design decision: `variant` prop
 *
 * Behold: This component accepts a MUI Typography `variant` prop!
 * For one-off style overrides (color, maxWidth, etc.), use the `sx` prop.
 *
 * ## Accessibility (WCAG 2.0 AA)
 *
 * - Toggle rendered as `<button>` for keyboard/screen reader access
 * - `aria-expanded` communicates state
 * - `aria-label` provides context for screen readers
 * - `focus-visible` outline for keyboard navigation (WCAG 2.4.7)
 * - Enter and Space key support
 *
 * @example
 * ```tsx
 * <TruncatedText variant="compactSubtitle" lines={2} sx={{ color: "grey.600" }}>
 *   A long description that will be truncated to two lines with a "show more"
 *   link at the end of the second line...
 * </TruncatedText>
 * ```
 */

import React, { useState } from "react"
import { Box, Typography, useTheme } from "../../mui-components"
import { motion } from "@repo/motion"
import { Truncate } from "@re-dev/react-truncate"
import type { SxProps } from "@mui/system"
import type { Theme } from "@mui/material/styles"

export interface TruncatedTextProps {
  /** The text content to truncate (plain text or inline elements) */
  children: React.ReactNode
  /** MUI Typography variant (default: "body2"). Accepts standard and custom variants. */
  variant?: string
  /** Maximum lines before truncation (default: 2) */
  lines?: number
  /** Label for the expand trigger (default: "show more") */
  showMoreLabel?: string
  /** Label for the collapse trigger (default: "show less") */
  showLessLabel?: string
  /** Style overrides for the root Typography container */
  sx?: SxProps<Theme>
}

export function TruncatedText({
  children,
  variant = "body2",
  lines = 2,
  showMoreLabel = "show more",
  showLessLabel = "show less",
  sx,
}: TruncatedTextProps) {
  const theme = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleButtonStyles = {
    color: theme.palette.blue?.medium ?? theme.palette.primary.main,
    fontStyle: "italic",
    cursor: "pointer",
    userSelect: "none" as const,
    background: "none",
    border: "none",
    padding: 0,
    font: "inherit",
    "&:hover": {
      textDecoration: "underline",
    },
    "&:focus-visible": {
      outline: `2px solid ${theme.palette.blue?.bright ?? theme.palette.primary.light}`,
      outlineOffset: "2px",
      borderRadius: "2px",
    },
  }

  const showMoreEllipsis = (
    <Box component="span">
      ...{" "}
      <Box
        component="button"
        type="button"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
          setIsExpanded(true)
        }}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            e.stopPropagation()
            setIsExpanded(true)
          }
        }}
        aria-expanded={false}
        aria-label={`${showMoreLabel} description text`}
        sx={toggleButtonStyles}
      >
        {showMoreLabel}
      </Box>
    </Box>
  )

  return (
    <Typography
      component="div"
      variant={variant as any}
      sx={{
        position: "relative",
        ...sx,
      }}
    >
      {/* Expanded view */}
      <motion.div
        initial={false}
        animate={{
          opacity: isExpanded ? 1 : 0,
          position: isExpanded ? "relative" : "absolute",
          pointerEvents: isExpanded ? "auto" : "none",
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        style={{ top: 0, left: 0, right: 0 }}
      >
        {children}{" "}
        <Box
          component="button"
          type="button"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            setIsExpanded(false)
          }}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              e.stopPropagation()
              setIsExpanded(false)
            }
          }}
          aria-expanded={true}
          aria-label={`${showLessLabel} description text`}
          sx={toggleButtonStyles}
        >
          {showLessLabel}
        </Box>
      </motion.div>

      {/* Truncated view */}
      <motion.div
        initial={false}
        animate={{
          opacity: isExpanded ? 0 : 1,
          position: isExpanded ? "absolute" : "relative",
          pointerEvents: isExpanded ? "none" : "auto",
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        style={{ top: 0, left: 0, right: 0 }}
      >
        <Truncate lines={lines} ellipsis={showMoreEllipsis}>
          <span>{children}</span>
        </Truncate>
      </motion.div>
    </Typography>
  )
}
