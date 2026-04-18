"use client"

import React from "react"
import { Typography } from "@repo/ui/mui"
import { Section } from "./Section"

export function ListHowToRead() {
  return (
    <Section title="Coming soon">
      <Typography variant="storyBody" component="p">
        The list view is the baseline table of scenarios. Use the sidebar to
        pin or hide scenarios, and use the toolbar chips above to filter
        outcomes and climates. A dedicated &ldquo;how to read&rdquo; section
        for this view is on the way.
      </Typography>
    </Section>
  )
}

export default ListHowToRead
