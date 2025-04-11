"use client"

import React, { useState } from "react"
import {
  Box,
  Typography,
  useTheme,
  Divider,
  Checkbox,
  FormControlLabel,
  IconButton,
  SwapHorizIcon,
  Grid,
} from "@repo/ui/mui"
import { BasePanel, Card } from "@repo/ui"
import { QuestionBuilderProvider } from "../questionBuilder/context/QuestionBuilderContext"
import { ScenarioCard } from "../scenarioResults/components"
import {
  QuestionSummary,
  OperationsSelector,
  OutcomesSelector,
  ClimateSelector,
} from "../questionBuilder/components"
import { useQuestionBuilderHelpers } from "../questionBuilder/hooks/useQuestionBuilderHelpers"
import { KeyboardArrowDownIcon } from "@repo/ui/mui"

// Content component that uses the context
const CombinedPanelContent = () => {
  const theme = useTheme()
  const {
    state: { includeClimate, swapped },
    toggleClimate,
    toggleSwap,
  } = useQuestionBuilderHelpers()

  // Track if the scroll button has been clicked
  const [hasClickedScroll, setHasClickedScroll] = useState(false)

  // Create demo scenario data
  const scenarios = Array.from({ length: 9 }, (_, index) => ({
    id: index + 1,
    title: `Scenario ${index + 1}`,
  }))

  // Function to handle scrolling to content
  const scrollToContent = () => {
    setHasClickedScroll(true)

    const contentElement = document.getElementById("question-builder-content")
    if (contentElement) {
      contentElement.scrollIntoView({ behavior: "smooth" })
    }
  }

  // Handle swap icon click
  const handleSwapClick = () => {
    toggleSwap()
  }

  return (
    <Box
      sx={(theme) => ({
        width: "100%",
        backgroundColor: theme.palette.background.default,
      })}
    >
      {/* Sticky header that will hold QuestionSummary */}
      <Box
        sx={{
          position: "sticky",
          top: theme.layout.headerHeight,
          zIndex: 1000,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: theme.spacing(2),
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "1200px",
            transform: hasClickedScroll ? "scale(0.7)" : "scale(1)",
            transformOrigin: "center top",
            transition: "transform 0.3s ease",
          }}
        >
          <QuestionSummary wasScrolled={hasClickedScroll} />
        </Box>
      </Box>

      {/* Initial spacer to create the centering effect */}
      <Box
        sx={(theme) => ({
          height: "calc(50vh - 100px)",
          backgroundColor: theme.palette.background.default,
        })}
      />

      {/* Hero message */}
      <Box
        sx={(theme) => ({
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: theme.spacing(4),
          marginBottom: theme.spacing(8),
          backgroundColor: theme.palette.background.default,
        })}
      >
        <Typography
          variant="h5"
          sx={{
            color: "rgba(0, 0, 0, 0.8)",
            marginBottom: theme.spacing(6),
            maxWidth: "600px",
            textShadow: "0px 0px 10px rgba(255, 255, 255, 0.5)",
          }}
        >
          Californians share water through one of the largest and most complex
          conveyance systems in the world.
        </Typography>

        {/* Scroll button */}
        <Box
          onClick={scrollToContent}
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.palette.common.white,
            cursor: "pointer",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.3)",
            },
          }}
        >
          <KeyboardArrowDownIcon
            fontSize="large"
            sx={{
              color: theme.palette.common.white,
            }}
          />
        </Box>
      </Box>

      {/* Main content */}
      <BasePanel
        id="question-builder-content"
        fullHeight={false}
        background="light"
        paddingVariant="narrow"
        sx={{
          width: "100%",
          maxWidth: "100%",
          position: "relative",
        }}
      >
        {/* Climate checkbox - Removed as it's now in OutcomesSelector */}

        {/* Question builder operation & outcome interface */}
        <Grid
          container
          spacing={2}
          sx={{
            width: "100%",
            display: "flex",
          }}
        >
          {/* Column 1: Operations or outcome text */}
          <Grid sx={{ flex: 1, alignSelf: "flex-start" }}>
            {swapped ? <OutcomesSelector /> : <OperationsSelector />}
          </Grid>

          {/* Column 2: Action verb & switch - aligned to top */}
          <Grid
            sx={{
              flex: "0 0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              paddingTop: theme.spacing(2.5),
            }}
          >
            <Typography variant="h5" sx={{ mt: 0.5, mb: 2 }}>
              {swapped ? "which" : "affect"}
            </Typography>
            <IconButton onClick={handleSwapClick}>
              <SwapHorizIcon />
            </IconButton>
            <Typography
              variant="caption"
              onClick={handleSwapClick}
              sx={{ cursor: "pointer" }}
            >
              switch
            </Typography>
          </Grid>

          {/* Column 3: Outcomes or operations text */}
          <Grid sx={{ flex: 1, alignSelf: "flex-start" }}>
            {swapped ? <OperationsSelector /> : <OutcomesSelector />}
          </Grid>

          {/* Column 4: "with" label */}
          <Grid
            sx={{
              flex: "0 0 auto",
              alignSelf: "flex-start",
              display: includeClimate ? "block" : "none",
            }}
          >
            <Typography variant="h5" sx={{ mt: 3 }}>
              with
            </Typography>
          </Grid>

          {/* Column 5: "climate" label */}
          <Grid
            sx={{
              flex: 1,
              alignSelf: "flex-start",
              display: includeClimate ? "block" : "none",
            }}
          >
            {includeClimate && <ClimateSelector />}
          </Grid>
        </Grid>

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
              View and compare results from different water management
              scenarios.
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
    </Box>
  )
}

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
