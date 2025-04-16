"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Box,
  Typography,
  useTheme,
  Divider,
  IconButton,
  SwapHorizIcon,
  Grid,
  Button,
  SearchIcon,
  FormControlLabel,
  Checkbox,
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
import { useTranslation } from "@repo/i18n"

// Content component that uses the context
const CombinedPanelContent = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const {
    state: { includeClimate, swapped },
    toggleSwap,
    toggleClimate,
    setExploratoryMode,
  } = useQuestionBuilderHelpers()

  // Track if the scroll button has been clicked or if the user has scrolled manually
  const [hasClickedScroll, setHasClickedScroll] = useState(false)

  // Reference to the element we want to observe
  const questionBuilderRef = useRef(null)
  const stickyHeaderRef = useRef(null)

  // Set up the IntersectionObserver to detect when the operation/outcome selectors are visible
  useEffect(() => {
    // Skip if we've already triggered the transition
    if (hasClickedScroll) return

    const options = {
      rootMargin: "-100px 0px", // Trigger a bit before the element comes into view
      threshold: 0.1, // Trigger when at least 10% of the target is visible
    }

    const observer = new IntersectionObserver((entries) => {
      // If the question builder content is intersecting with the viewport
      if (entries[0]?.isIntersecting) {
        setHasClickedScroll(true)
        observer.disconnect() // Only need to trigger once
      }
    }, options)

    // Start observing the question builder content
    if (questionBuilderRef.current) {
      observer.observe(questionBuilderRef.current)
    }

    // Cleanup
    return () => observer.disconnect()
  }, [hasClickedScroll])

  // Create demo scenario data
  const scenarios = Array.from({ length: 9 }, (_, index) => ({
    id: index + 1,
    title: `Scenario ${index + 1}`,
  }))

  // Function to handle scrolling to content
  const scrollToContent = () => {
    setHasClickedScroll(true)

    // Use a more precise approach with anchors and offsets
    const contentElement = document.getElementById("feature-content-anchor")
    if (contentElement) {
      const yOffset = -100 // Add an offset to see more content
      const y =
        contentElement.getBoundingClientRect().top +
        window.pageYOffset +
        yOffset
      window.scrollTo({ top: y, behavior: "smooth" })
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
        ref={stickyHeaderRef}
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          width: "100%",
          maxWidth: "none !important",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: `${theme.layout.headerHeight}px`,
          backgroundColor: "#FFFFFF",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          overflow: "visible",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "none !important",
            position: "relative",
            zIndex: 995,
          }}
        >
          <QuestionSummary wasScrolled={hasClickedScroll} />
        </Box>

        {/* Climate checkbox in a small card - only visible after scroll */}
        <Box
          sx={{
            position: "absolute",
            bottom: -28,
            right: `calc(${theme.spacing(4)} + 180px + 32px)`, // Position 32px to the left of search button
            opacity: hasClickedScroll ? 1 : 0,
            visibility: hasClickedScroll ? "visible" : "hidden",
            transform: hasClickedScroll ? "translateY(0)" : "translateY(-10px)",
            transition: "all 0.5s ease",
            transitionDelay: "0.2s",
            zIndex: 2500,
          }}
        >
          <Card
            sx={{
              padding: theme.spacing(0.5, 2),
              borderRadius: "999px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeClimate}
                  onChange={() => toggleClimate()}
                  color="primary"
                  size="small"
                  sx={{
                    color: theme.palette.text.primary,
                    "&.Mui-checked": {
                      color: theme.palette.text.primary,
                    },
                  }}
                />
              }
              label={t("questionBuilder.outcomesSelector.includeClimate")}
              sx={{
                margin: 0,
                "& .MuiTypography-root": {
                  fontSize: "1rem",
                  fontWeight: 500,
                },
              }}
            />
          </Card>
        </Box>

        {/* Search button - only visible after scroll */}
        <Box
          sx={{
            position: "absolute",
            bottom: -28,
            right: theme.spacing(4),
            opacity: hasClickedScroll ? 1 : 0,
            visibility: hasClickedScroll ? "visible" : "hidden",
            transform: hasClickedScroll ? "translateY(0)" : "translateY(-10px)",
            transition: "all 0.5s ease",
            transitionDelay: "0.2s",
            zIndex: 2500,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            disableElevation
            onClick={() => {
              // Enter exploratory mode - shrink the question summary
              setExploratoryMode(true)

              // Scroll to scenario results
              const element = document.getElementById("scenario-results")
              if (element) {
                const headerOffset = 100
                const elementPosition = element.getBoundingClientRect().top
                const offsetPosition =
                  elementPosition + window.scrollY - headerOffset
                window.scrollTo({
                  top: offsetPosition,
                  behavior: "smooth",
                })
              }
            }}
            startIcon={<SearchIcon />}
            sx={{
              borderRadius: "999px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              padding: theme.spacing(1, 2),
              bgcolor: "black",
              color: "white",
              "&:hover": {
                bgcolor: "#333",
              },
            }}
          >
            {t("scenarioResults.search")}
          </Button>
        </Box>
      </Box>

      {/* Initial spacer to create the centering effect */}
      <Box
        sx={(theme) => ({
          height: "65px",
          backgroundColor: theme.palette.background.default,
        })}
      />

      {/* Main content */}
      <BasePanel
        id="question-builder-content"
        fullHeight={false}
        background="light"
        paddingVariant="narrow"
        includeHeaderSpacing={false}
        sx={{
          width: "100%",
          position: "relative",
        }}
      >
        {/* Anchor point for scrolling (placed at the top) */}
        <div
          id="feature-content-anchor"
          style={{ position: "relative", top: "-50px" }}
        ></div>

        {/* Question builder operation & outcome interface - add ref for observation */}
        <Grid
          ref={questionBuilderRef}
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
              paddingTop: theme.spacing(0),
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mt: 3,
              }}
            >
              <IconButton
                onClick={handleSwapClick}
                sx={{
                  bgcolor: "black",
                  color: "white",
                  width: 64,
                  height: 64,
                  "&:hover": {
                    bgcolor: "#333",
                  },
                }}
              >
                <SwapHorizIcon fontSize="large" />
              </IconButton>
              <Typography
                variant="button"
                onClick={handleSwapClick}
                sx={{
                  cursor: "pointer",
                  mt: 1,
                  fontWeight: "medium",
                  fontSize: "1rem",
                  textTransform: "none",
                }}
              >
                {t("questionBuilder.ui.switch")}
              </Typography>
            </Box>
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
              {t("questionBuilder.connectors.with")}
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
              {t("scenarioResults.title")}
            </Typography>
            <Typography variant="body1">
              {t("scenarioResults.description")}
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
