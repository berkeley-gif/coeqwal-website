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

// Type for scenario data
interface ScenarioDataItem {
  id: string
  title: string
  data: string | null
}

// Operation to scenario ID mapping
const operationToScenarioId: Record<string, string> = {
  "removing-flow-reqs": "s0011",
  "sjr-flow-reqs": "s0012",
  "sac-flow-reqs": "s0013",
  "delta-conveyance": "s0014",
  "dct-3000cfs": "s0015",
  "dct-6000cfs": "s0016",
  "storage-expansion": "s0017",
  "new-storage": "s0018",
  "groundwater-recharge": "s0019",
}

// Content component that uses the context
const CombinedPanelContent = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const {
    state: { includeClimate, swapped, selectedOperations },
    toggleSwap,
    toggleClimate,
    setExploratoryMode,
  } = useQuestionBuilderHelpers()

  // Track if the scroll button has been clicked or if the user has scrolled manually
  const [hasClickedScroll, setHasClickedScroll] = useState(false)
  // State to store the loaded scenario data for each operation
  const [scenarioDataItems, setScenarioDataItems] = useState<
    ScenarioDataItem[]
  >([])
  // Loading state
  const [isLoading, setIsLoading] = useState(false)

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

  // Handle swap icon click
  const handleSwapClick = () => {
    toggleSwap()
  }

  // Get operation title from its ID
  const getOperationTitle = (operationId: string): string => {
    // Create a mapping of operation IDs to human-readable titles
    const operationTitles: Record<string, string> = {
      "removing-flow-reqs": "Removing Flow Requirements",
      "sjr-flow-reqs": "San Joaquin River Flow Requirements",
      "sac-flow-reqs": "Sacramento River Flow Requirements",
      "delta-conveyance": "Delta Conveyance Tunnel",
      "dct-3000cfs": "Delta Conveyance (3000 CFS)",
      "dct-6000cfs": "Delta Conveyance (6000 CFS)",
      "storage-expansion": "Storage Expansion",
      "new-storage": "New Storage",
      "groundwater-recharge": "Groundwater Recharge",
    }

    return operationTitles[operationId] || `Operation ${operationId}`
  }

  // Function to fetch the scenario data for a specific operation
  const fetchScenarioDataForOperation = async (
    operationId: string,
  ): Promise<ScenarioDataItem | null> => {
    // Get the scenario ID for this operation
    const scenarioId = operationToScenarioId[operationId] || "s0011" // Default to s0011 if no mapping exists

    try {
      const response = await fetch(
        `/scenario_data/categorized_deciles/coeqwal_${scenarioId}_adjBL_wTUCP_DV_v0.0_DELTA_OUTFLOW.json`,
      )

      if (!response.ok) {
        console.error(`Failed to fetch data for operation ${operationId}`)
        return null
      }

      const data = await response.json()

      return {
        id: operationId,
        title: getOperationTitle(operationId),
        data: JSON.stringify(data, null, 2),
      }
    } catch (error) {
      console.error(`Error fetching data for operation ${operationId}:`, error)
      return null
    }
  }

  // Function to fetch all scenario data
  const fetchAllScenarioData = async () => {
    setIsLoading(true)

    try {
      // For now, if no operations are selected, fetch the default scenario
      if (selectedOperations.length === 0) {
        const defaultData =
          await fetchScenarioDataForOperation("removing-flow-reqs")
        setScenarioDataItems(defaultData ? [defaultData] : [])
        return
      }

      // Fetch data for each selected operation
      const dataPromises = selectedOperations.map(fetchScenarioDataForOperation)
      const results = await Promise.all(dataPromises)

      // Filter out null results and update state
      setScenarioDataItems(results.filter(Boolean) as ScenarioDataItem[])
    } catch (error) {
      console.error("Error fetching scenario data:", error)
      setScenarioDataItems([])
    } finally {
      setIsLoading(false)
    }
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

              // Fetch the scenario data for all selected operations
              fetchAllScenarioData()

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

          {/* Loading indicator */}
          {isLoading && (
            <Box sx={{ p: theme.spacing(2), textAlign: "center" }}>
              <Typography>Loading scenario data...</Typography>
            </Box>
          )}

          {/* Scenario Cards Grid */}
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
            {/* Display a card for each operation with data */}
            {scenarioDataItems.map((item, index) => (
              <ScenarioCard
                key={`scenario-${item.id}`}
                scenarioNumber={index + 1}
                title={item.title}
                data={item.data}
              />
            ))}

            {/* If no data yet, show placeholder cards */}
            {scenarioDataItems.length === 0 && !isLoading && (
              <>
                <ScenarioCard
                  key="scenario-placeholder-1"
                  scenarioNumber={1}
                  title="Scenario 1"
                />
                <ScenarioCard
                  key="scenario-placeholder-2"
                  scenarioNumber={2}
                  title="Scenario 2"
                />
                <ScenarioCard
                  key="scenario-placeholder-3"
                  scenarioNumber={3}
                  title="Scenario 3"
                />
              </>
            )}
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
