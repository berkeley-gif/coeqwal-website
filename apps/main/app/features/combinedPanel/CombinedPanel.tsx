"use client"

import React, { memo } from "react"
import { Box, Typography, useTheme, Divider } from "@repo/ui/mui"
import { BasePanel } from "@repo/ui"
import { QuestionBuilderPanel } from "../questionBuilder/QuestionBuilderPanel"
import { QuestionBuilderProvider } from "../questionBuilder/context/QuestionBuilderContext"
import { ScenarioCard } from "../scenarioResults/components"

// Content component that uses the context
const CombinedPanelContent = memo(() => {
  const theme = useTheme()

  // Create demo scenario data
  const scenarios = Array.from({ length: 9 }, (_, index) => ({
    id: index + 1,
    title: `Scenario ${index + 1}`,
  }))

  return (
    <BasePanel
      fullHeight={false}
      background="light"
      paddingVariant="narrow"
      sx={{
        width: "100%",
        maxWidth: "100%",
      }}
    >
      {/* Question Builder Panel */}
      <QuestionBuilderPanel showSummary={true} />

      {/* Divider between question builder and results */}
      <Divider sx={{ my: 4 }} />

      {/* Scenario Results Section */}
      <Box
        sx={{ width: "100%" }}
        data-section="scenario-results"
        id="scenario-results"
      >
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
      </Box>
    </BasePanel>
  )
})

// For debugging in React DevTools
CombinedPanelContent.displayName = "CombinedPanelContent"

export function CombinedPanel() {
  return (
    <QuestionBuilderProvider>
      <CombinedPanelContent />
    </QuestionBuilderProvider>
  )
}

export default CombinedPanel
