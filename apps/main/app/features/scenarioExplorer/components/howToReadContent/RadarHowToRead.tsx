"use client"

import React from "react"
import { Typography } from "@repo/ui/mui"
import { Section } from "./Section"

export function RadarHowToRead() {
  return (
    <Section title="Coming soon">
      <Typography variant="storyBody" component="p">
        The radar view plots each selected scenario as a polygon across the
        COEQWAL outcomes. Use <strong>choose outcome axes</strong> in the chart
        controls to pick which outcomes are shown, and the hydroclimate chip to
        switch climates. A dedicated &ldquo;how to read&rdquo; section for this
        view is on the way.
      </Typography>
    </Section>
  )
}

export default RadarHowToRead
