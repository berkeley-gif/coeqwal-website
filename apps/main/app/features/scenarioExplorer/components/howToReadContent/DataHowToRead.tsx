"use client"

import React from "react"
import { Typography } from "@repo/ui/mui"
import { Section } from "./Section"

export function DataHowToRead() {
  return (
    <Section title="Coming soon">
      <Typography variant="storyBody" component="p">
        The data view exposes the underlying tables behind each scenario and
        outcome. A dedicated &ldquo;how to read&rdquo; section for this view
        is on the way.
      </Typography>
    </Section>
  )
}

export default DataHowToRead
