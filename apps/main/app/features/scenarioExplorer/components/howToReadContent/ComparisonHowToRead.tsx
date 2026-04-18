"use client"

import React from "react"
import { Typography } from "@repo/ui/mui"
import { Section } from "./Section"

export function ComparisonHowToRead() {
  return (
    <Section title="Coming soon">
      <Typography variant="storyBody" component="p">
        The comparison view lets you line up two or more scenarios on the
        same outcomes. A dedicated &ldquo;how to read&rdquo; section for
        this view is on the way.
      </Typography>
    </Section>
  )
}

export default ComparisonHowToRead
