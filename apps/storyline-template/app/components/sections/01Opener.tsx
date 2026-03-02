"use client"

/**
 * 01Opener - Simplest scrollytelling pattern: viewport-triggered reveals
 *
 * Uses ScrollReveal for fire-and-forget animations when content
 * enters the viewport. No scroll progress tracking needed.
 */

import { ScrollReveal } from "@repo/scrollytelling"
import { Box, Typography } from "@repo/ui/mui"
import useActiveSection from "../../hooks/useActiveSection"

export default function Opener() {
  const { sectionRef } = useActiveSection("opener", { amount: 0.3 })

  return (
    <Box
      ref={sectionRef}
      id="opener"
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "0 10%",
        pointerEvents: "auto",
      }}
    >
      <ScrollReveal animation="fadeUp">
        <Typography variant="h1" gutterBottom>
          @repo/scrollytelling
        </Typography>
      </ScrollReveal>

      <ScrollReveal animation="fadeUp" delay={0.2}>
        <Typography variant="body1" sx={{ maxWidth: 600 }}>
          A shared package for scroll-driven storytelling. Wraps Framer Motion
          with reusable components and hooks — so every storyline app starts
          from the same tested foundation.
        </Typography>
      </ScrollReveal>

      <ScrollReveal animation="stagger" staggerDelay={0.15} delay={0.4}>
        <Typography variant="body2" sx={{ mt: 4, opacity: 0.7 }}>
          Scroll down to see it in action
        </Typography>
      </ScrollReveal>
    </Box>
  )
}
