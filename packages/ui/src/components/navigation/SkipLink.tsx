"use client"

/**
 * SkipLink - Accessibility skip navigation link
 *
 * WCAG 2.4.1: Provides a mechanism to bypass blocks of content that are
 * repeated on multiple pages. This link must be the FIRST focusable element
 * in the document to be effective.
 *
 * Usage:
 * - Place as the first element in your page/layout, before any other content
 * - Ensure your main content has id="main-content" and tabIndex={-1}
 * - The link is visually hidden until focused (appears top-left on focus)
 *
 * Note: The skip link only appears when you Tab into the page from the browser
 * address bar (or when the page first loads). If you click anywhere on the page
 * first, Tab will start from that element - this is standard browser behavior.
 *
 * @example
 * // In your page.tsx or layout.tsx:
 * export default function Page() {
 *   return (
 *     <>
 *       <SkipLink />
 *       <Header />
 *       <main id="main-content" tabIndex={-1}>
 *         ...content
 *       </main>
 *     </>
 *   )
 * }
 */

import { useCallback } from "react"
import { Box, useTheme } from "@mui/material"

interface SkipLinkProps {
  /**  Translated label for the skip link */
  label: string
  /**
   * Target element ID (without #)
   * @default "main-content"
   */
  targetId?: string
  /**
   * z-index for the skip link when visible
   * Should be higher than any fixed headers
   * @default 10000
   */
  zIndex?: number
}

export function SkipLink({
  label,
  targetId = "main-content",
  zIndex = 10000,
}: SkipLinkProps) {
  const theme = useTheme()

  // Handle click to ensure focus moves to target element
  // Native anchor behavior scrolls but doesn't always move focus reliably
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      const target = document.getElementById(targetId)
      if (target) {
        // WCAG 2.3.3: Respect user's motion preferences
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches

        // Scroll to target
        target.scrollIntoView({
          behavior: prefersReducedMotion ? "instant" : "smooth",
          block: "start",
        })
        // Move focus to target (requires tabIndex={-1} on target element)
        target.focus({ preventScroll: true })
      }
    },
    [targetId],
  )

  return (
    <Box
      component="a"
      href={`#${targetId}`}
      onClick={handleClick}
      sx={{
        // Visually hidden by default
        position: "absolute",
        left: "-9999px",
        top: "auto",
        width: "1px",
        height: "1px",
        overflow: "hidden",
        zIndex,
        // Visible when focused
        "&:focus": {
          position: "fixed",
          top: 8,
          left: 8,
          width: "auto",
          height: "auto",
          padding: "12px 24px",
          backgroundColor: theme.palette.common.white,
          color: theme.palette.common.black,
          fontWeight: 600,
          borderRadius: theme.borderRadius.md,
          boxShadow: theme.shadow.lg,
          outline: "2px solid",
          outlineColor: theme.palette.blue.bright,
          textDecoration: "none",
        },
      }}
    >
      {label}
    </Box>
  )
}
