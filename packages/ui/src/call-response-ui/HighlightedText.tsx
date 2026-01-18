"use client"

/**
 * HighlightedText - Text with animated highlight background
 *
 * Displays text with a configurable highlight effect that can animate in.
 * Used in scrollytelling panels for emphasis.
 */

import { ReactNode, useRef, useEffect, useState, useCallback } from "react"
import { Box } from "../mui-components"

interface HighlightedTextProps {
  children: ReactNode
  /** Background color for highlight */
  highlightColor?: string
  /** Opacity of the highlight (0-1) */
  opacity?: number
  /** How much to shrink each line's height (0-1). Higher = bigger gaps */
  gapSize?: number
  /** Border radius for highlight rectangles */
  borderRadius?: string
  /** Typography component to wrap (h1, h2, p, span, etc) */
  component?: React.ElementType
  /** Additional styles for the text wrapper */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sx?: any
}

interface HighlightRect {
  left: number
  top: number
  width: number
  height: number
}

/**
 * HighlightedText - Creates per-line highlight rectangles behind text
 *
 * Uses Range.getClientRects() to get individual line boxes and draws
 * slightly shorter rectangles for each line, creating visible gaps
 * between lines - mimicking browser text selection appearance.
 */
export function HighlightedText({
  children,
  highlightColor = "rgba(255, 255, 255, 0.95)",
  opacity = 0.8,
  gapSize = 0.25,
  borderRadius = "0",
  component: Component = "span",
  sx = {},
}: HighlightedTextProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLElement>(null)
  const [highlights, setHighlights] = useState<HighlightRect[]>([])

  const calculateHighlights = useCallback(() => {
    if (!wrapperRef.current || !textRef.current) return

    const wrapperRect = wrapperRef.current.getBoundingClientRect()
    const newHighlights: HighlightRect[] = []

    // Walk through all text nodes to get their individual rects
    const walker = document.createTreeWalker(
      textRef.current,
      NodeFilter.SHOW_TEXT,
      null,
    )

    let node = walker.nextNode()
    while (node) {
      const textNode = node as Text
      // Skip whitespace-only text nodes
      if (textNode.textContent && textNode.textContent.trim().length > 0) {
        const range = document.createRange()
        range.selectNodeContents(textNode)
        const rects = Array.from(range.getClientRects())

        for (const rect of rects) {
          // Skip invalid/empty rectangles
          if (rect.width === 0 || rect.height === 0) continue

          // Skip very small rects (likely whitespace/line breaks)
          if (rect.height < 10) continue

          const lineHeight = rect.height
          const shrink = gapSize // How much to shrink height (controls gap)
          const effectiveHeight = lineHeight * (1 - shrink)
          const verticalOffset = (lineHeight - effectiveHeight) / 2

          // Add padding to cover descenders and give breathing room
          const horizontalPadding = 8
          const verticalPadding = 4

          newHighlights.push({
            left: rect.left - wrapperRect.left - horizontalPadding,
            top: rect.top - wrapperRect.top + verticalOffset - verticalPadding,
            width: rect.width + horizontalPadding * 2,
            height: effectiveHeight + verticalPadding * 2,
          })
        }
      }
      node = walker.nextNode()
    }

    setHighlights(newHighlights)
  }, [gapSize])

  // Calculate highlights on mount and when content changes
  useEffect(() => {
    // Delay to ensure layout is complete and animations have settled
    const timeoutId = setTimeout(calculateHighlights, 100)
    return () => clearTimeout(timeoutId)
  }, [children, gapSize, calculateHighlights])

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      calculateHighlights()
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [calculateHighlights])

  return (
    <Box
      ref={wrapperRef}
      sx={{
        position: "relative",
        display: "block", // Use block to avoid extra spacing issues
        ...sx,
      }}
    >
      {/* Highlight rectangles (behind text) */}
      {highlights.map((rect, index) => (
        <Box
          key={index}
          sx={{
            position: "absolute",
            backgroundColor: highlightColor,
            opacity: opacity,
            borderRadius: borderRadius,
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Text content (above highlights) */}
      <Box
        ref={textRef}
        component={Component}
        sx={{
          position: "relative",
          zIndex: 1,
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
