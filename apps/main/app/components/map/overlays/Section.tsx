"use client"

/**
 * Section Component
 *
 * @deprecated Use react-scrollama's <Step> component instead.
 * This component is kept for backwards compatibility but should not be used
 * for new sections. The react-scrollama integration provides more robust
 * scroll detection with direction awareness and progress tracking.
 *
 * See: apps/main/app/components/map/hooks/useLearnScrollama.ts
 * See: MapOverlayPanels.tsx for usage with react-scrollama
 */

import { useRef, useEffect, ReactNode } from "react"
import { useInView } from "@repo/motion"
import { Box, type SxProps, type Theme } from "@repo/ui/mui"
import { learnMapActions, type SectionId } from "../store"

interface SectionProps {
  /** Unique section ID */
  id: SectionId
  /** Content to display (optional for trigger-only sections) */
  children?: ReactNode
  /** How much of the element must be visible to trigger (0-1) */
  amount?: number
  /** Additional styles */
  sx?: SxProps<Theme>
}

export function Section({ id, children, amount = 0.5, sx = {} }: SectionProps) {
  const ref = useRef<HTMLDivElement>(null)

  const isInView = useInView(ref, { amount })

  useEffect(() => {
    if (isInView) {
      learnMapActions.setActiveSection(id)
    }
  }, [isInView, id])

  return (
    <Box
      ref={ref}
      id={id}
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        pointerEvents: "none", // Allow map interaction in empty space
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}

/**
 * StickySection Component
 *
 * For sections that need scroll-progress-based animations (like rivers).
 * Uses useScroll to track progress within the sticky container.
 */
interface StickySectionProps extends SectionProps {
  /** Height of the sticky scroll area */
  stickyHeight?: string
  /** Callback for scroll progress (0-1) */
  onProgress?: (progress: number) => void
}

export function StickySection({
  id,
  children,
  stickyHeight = "200vh",
  sx = {},
}: StickySectionProps) {
  const ref = useRef<HTMLDivElement>(null)

  const isInView = useInView(ref, { amount: 0.1 })

  useEffect(() => {
    if (isInView) {
      learnMapActions.setActiveSection(id)
    }
  }, [isInView, id])

  // Track scroll progress within this section
  // Progress is based on scroll position WITHIN the section, not entry point
  useEffect(() => {
    if (!isInView || !ref.current) return

    const handleScroll = () => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()

      // The section is 200vh tall. Progress 0-1 represents how far we've scrolled through it.
      // When at the TOP of the section (rect.top = 0), progress = 0
      // When at the BOTTOM of the section (rect.bottom = 0), progress = 1
      // This gives consistent progress regardless of scroll direction
      const sectionHeight = ref.current.offsetHeight
      const scrolledIntoSection = Math.max(0, -rect.top)
      const scrollableDistance = sectionHeight - window.innerHeight // How much we can scroll within the section
      const progress = Math.min(
        1,
        Math.max(0, scrolledIntoSection / scrollableDistance),
      )

      // Rivers animate during first ~67% of section scroll (slowed down from 50%)
      // OLD choreography sends 0→1: Rivers grow as progress increases
      // Match that behavior: [progress, 1] goes from [0,1] (full) to [1,1] (nothing)
      // But we want GROW not SHRINK, so we invert in RiversLayer
      const riverProgress = Math.min(1, progress * 1.5)

      learnMapActions.setRiversProgress(riverProgress)
    }

    // Call immediately to set initial state when section comes into view
    handleScroll()

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isInView])

  // When leaving the rivers section, keep rivers fully drawn (progress=1)
  // so they stay visible through the rest of the scroll
  useEffect(() => {
    if (!isInView) {
      learnMapActions.setRiversProgress(1)
    }
  }, [isInView])

  return (
    <Box
      ref={ref}
      id={id}
      sx={{
        minHeight: stickyHeight,
        position: "relative",
        pointerEvents: "none", // Allow map interaction in empty space
        ...sx,
      }}
    >
      <Box
        sx={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          alignItems: "center",
          pointerEvents: "none", // Allow map interaction in empty space
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
