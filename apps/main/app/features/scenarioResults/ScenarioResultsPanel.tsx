"use client"

import React from "react"
import { Typography, Box, useTheme } from "@repo/ui/mui"
import { BasePanel } from "@repo/ui"
import { ScenarioCard } from "./components"

// Content component for the scenario results
const ScenarioResultsContent = () => {
  const theme = useTheme()

  // Scenarios grid
  const scenarios = Array.from({ length: 9 }, (_, index) => ({
    id: index + 1,
    title: `Scenario ${index + 1}`,
  }))

  return (
    <BasePanel fullHeight={true} background="light" paddingVariant="narrow">
      {/* Header row */}
      <Box sx={{ p: theme.spacing(2) }}>
        <Typography variant="h4" gutterBottom>
          Scenario Results
        </Typography>
        <Typography variant="body1">
          View and compare results from different water management scenarios.
        </Typography>
      </Box>

      {/* 3x3 Grid of Cards using CSS Grid */}
      <Box
        sx={{
          p: theme.spacing(2),
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr", // 1 column on mobile
            sm: "repeat(2, 1fr)", // 2 columns on tablet
            md: "repeat(3, 1fr)", // 3 columns on desktop (3x3 grid)
          },
          gap: theme.spacing(3),
        }}
      >
        {scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenarioNumber={scenario.id}
            title={scenario.title}
          />
        ))}
      </Box>
    </BasePanel>
  )
}

export function ScenarioResultsPanel() {
  return <ScenarioResultsContent />
}

export default ScenarioResultsPanel
