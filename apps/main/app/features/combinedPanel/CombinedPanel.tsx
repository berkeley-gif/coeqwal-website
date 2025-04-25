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
import { SortableScenarioCard } from "../scenarioResults/components"
import {
  QuestionSummary,
  OperationsSelector,
  OutcomesSelector,
  ClimateSelector,
} from "../questionBuilder/components"
import { useQuestionBuilderHelpers } from "../questionBuilder/hooks/useQuestionBuilderHelpers"
import { useTranslation } from "@repo/i18n"
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable"

// Type for scenario data
interface ScenarioDataItem {
  id: string
  title: string
  data: string | null
  metricType?: string
}

// Operation to scenario ID mapping
const operationToScenarioId: Record<string, string> = {
  "current-operations": "baseline",
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

// Available metrics for visualization
const AVAILABLE_METRICS = [
  "DELTA_OUTFLOW",
  "EXPORTS",
  "SOD_URBAN",
  "NOD_URBAN",
  "SOD_AG",
  "NOD_AG",
  "SJR_FLOW",
  "SAC_FLOW",
  "STORAGE",
  "TOTAL",
  "INFLOW",
  "CHANNEL",
  "PUMPING",
  "ELEVATION",
  "REFUGE",
  "SHORTAGE",
  "X2",
]

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
  // State for controlling the order of scenario cards
  const [scenarioOrder, setScenarioOrder] = useState<string[]>([])
  // State to track which cards are expanded (multiple can be expanded at once)
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set())

  // Currently selected metric type to display
  const [selectedMetric, setSelectedMetric] = useState<string>("DELTA_OUTFLOW")
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

    // Log which operation and file pattern we're looking for
    console.log(
      `Looking for data for operation: ${operationId} (scenario ID: ${scenarioId}) with metric: ${selectedMetric}`,
    )

    try {
      // Special case for current-operations/baseline
      if (operationId === "current-operations") {
        // Try multiple baseline naming patterns
        const baselinePatterns = [
          `/scenario_data/categorized_deciles/baseline_${selectedMetric}.json`,
          `/scenario_data/categorized_deciles/baseline_DV_v0.0_${selectedMetric}.json`,
          `/scenario_data/categorized_deciles/coeqwal_baseline_DV_v0.0_${selectedMetric}.json`,
          `/scenario_data/categorized_deciles/current_${selectedMetric}.json`,
          `/scenario_data/categorized_deciles/existing_${selectedMetric}.json`,
          // Add more patterns that match the naming conventions in your data
          `/scenario_data/categorized_deciles/coeqwal_baseline_adjBL_wTUCP_DV_v0.0_${selectedMetric}.json`,
          `/scenario_data/categorized_deciles/coeqwal_baseline_DV_v0.0_${selectedMetric}.json`,
          `/scenario_data/categorized_deciles/baseline_adjBL_wTUCP_DV_v0.0_${selectedMetric}.json`,
        ]

        // Try each pattern
        for (const pattern of baselinePatterns) {
          try {
            const response = await fetch(pattern)
            if (response.ok) {
              const data = await response.json()
              return {
                id: operationId,
                title: "Current Operations",
                data: JSON.stringify(data, null, 2),
                metricType: selectedMetric,
              }
            }
          } catch {
            // Silently continue to next pattern
          }
        }

        // If no baseline file found, try using s0011 as a substitute for current operations
        // This is a common convention where s0011 represents the baseline or near-baseline scenario
        console.warn(
          `No baseline file found, using s0011 as substitute for current operations`,
        )

        try {
          const response = await fetch(
            `/scenario_data/categorized_deciles/coeqwal_s0011_adjBL_wTUCP_DV_v0.0_${selectedMetric}.json`,
          )

          if (response.ok) {
            const data = await response.json()
            return {
              id: operationId,
              title: "Current Operations (s0011)",
              data: JSON.stringify(data, null, 2),
              metricType: selectedMetric,
            }
          }
        } catch {
          // Silently handle errors
        }

        // If we reach here, none of the patterns worked
        console.error(
          `No data file found for current operations with metric ${selectedMetric}`,
        )
        return null
      }

      // Regular operation scenario handling
      // Try to fetch the data for the selected metric
      let response = await fetch(
        `/scenario_data/categorized_deciles/coeqwal_${scenarioId}_adjBL_wTUCP_DV_v0.0_${selectedMetric}.json`,
      )

      // If file doesn't exist, try different file naming patterns
      if (!response.ok) {
        // List of common patterns to try
        const patterns = [
          `/scenario_data/categorized_deciles/${scenarioId}_adj_SGMApump_DV_v0.0_${selectedMetric}.json`,
          `/scenario_data/categorized_deciles/coeqwal_${scenarioId}_DV_v0.0_${selectedMetric}.json`,
          `/scenario_data/categorized_deciles/${scenarioId}_DV_v0.0_${selectedMetric}.json`,
          `/scenario_data/categorized_deciles/coeqwal_${scenarioId}_${selectedMetric}.json`,
          `/scenario_data/categorized_deciles/${scenarioId}_${selectedMetric}.json`,
        ]

        // Try each pattern
        let patternFound = false
        for (const pattern of patterns) {
          try {
            const patternResponse = await fetch(pattern)
            if (patternResponse.ok) {
              response = patternResponse
              patternFound = true
              break
            }
          } catch {
            // Silently continue to next pattern
          }
        }

        if (!patternFound) {
          console.error(
            `No data file found for operation ${operationId} with metric ${selectedMetric}`,
          )
          return null
        }
      }

      const data = await response.json()

      return {
        id: operationId,
        title: getOperationTitle(operationId),
        data: JSON.stringify(data, null, 2),
        metricType: selectedMetric,
      }
    } catch (error) {
      console.error(`Error fetching data for operation ${operationId}:`, error)
      return null
    }
  }

  // Function to fetch all scenario data
  const fetchAllScenarioData = async () => {
    setIsLoading(true)

    console.log("Checking available metrics for operations...")

    // Check if s0011 file exists for different metrics as a test
    const testMetrics = ["DELTA_OUTFLOW", "SOD_URBAN", "EXPORTS"]
    for (const metric of testMetrics) {
      const testUrl = `/scenario_data/categorized_deciles/coeqwal_s0011_adjBL_wTUCP_DV_v0.0_${metric}.json`
      try {
        const response = await fetch(testUrl, { method: "HEAD" })
        console.log(
          `File check: ${testUrl} - ${response.ok ? "EXISTS" : "NOT FOUND"}`,
        )
      } catch {
        console.log(`File check error: ${testUrl}`)
      }
    }

    try {
      // If no operations are selected, fetch the default scenario
      if (selectedOperations.length === 0) {
        const defaultData =
          await fetchScenarioDataForOperation("removing-flow-reqs")
        if (defaultData) {
          setScenarioDataItems([defaultData])
          setScenarioOrder([defaultData.id])
        } else {
          setScenarioDataItems([])
          setScenarioOrder([])
        }
        return
      }

      // Fetch data for each selected operation
      const dataPromises = selectedOperations.map(fetchScenarioDataForOperation)
      const results = await Promise.all(dataPromises)

      // Filter out null results and update state
      const filteredResults = results.filter(Boolean) as ScenarioDataItem[]
      setScenarioDataItems(filteredResults)
      setScenarioOrder(filteredResults.map((item) => item.id))
    } catch (error) {
      console.error("Error fetching scenario data:", error)
      setScenarioDataItems([])
      setScenarioOrder([])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle drag end event for reordering scenario cards
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setScenarioOrder((items) => {
        const oldIndex = items.indexOf(active.id.toString())
        const newIndex = items.indexOf(over.id.toString())
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Handle card expansion toggle
  const handleCardExpand = (cardId: string) => {
    // Toggle the expansion state of the clicked card
    setExpandedCardIds((prevIds) => {
      const newIds = new Set(prevIds)
      if (newIds.has(cardId)) {
        newIds.delete(cardId)
      } else {
        newIds.add(cardId)
      }
      return newIds
    })
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
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h4">{t("scenarioResults.title")}</Typography>

              {/* Metric selector */}
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body1" sx={{ mr: 2 }}>
                  Metric:
                </Typography>
                <select
                  value={selectedMetric}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setSelectedMetric(e.target.value)
                    // Refetch data with the new metric when changed
                    if (scenarioDataItems.length > 0) {
                      fetchAllScenarioData()
                    }
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    fontSize: "1rem",
                    minWidth: "180px",
                  }}
                >
                  {AVAILABLE_METRICS.map((metric) => (
                    <option key={metric} value={metric}>
                      {metric.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </Box>
            </Box>
            <Typography variant="body1" gutterBottom>
              {t("scenarioResults.description")}
            </Typography>
            {scenarioDataItems.length > 1 && (
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  fontStyle: "italic",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span style={{ marginRight: "5px", fontSize: "16px" }}>💡</span>
                Tip: You can drag and drop cards using the handle (⋮⋮) to
                reorder them. Click the expand button (↔) to view cards in full
                width for better visualization. Multiple cards can be expanded
                at once.
              </Typography>
            )}
          </Box>

          {/* Loading indicator */}
          {isLoading && (
            <Box sx={{ p: theme.spacing(2), textAlign: "center" }}>
              <Typography>Loading scenario data...</Typography>
            </Box>
          )}

          {/* Scenario Cards Grid with Drag and Drop */}
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Box
              sx={{
                p: theme.spacing(2),
                pb: theme.spacing(6),
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr", // 1 column on mobile
                  sm: "repeat(2, 1fr)", // Always 2 columns on tablet
                  md: "repeat(3, 1fr)", // Always 3 columns on desktop
                },
                gap: theme.spacing(4),
                // Add rule for expanded items to take up full width
                "& > div[data-expanded='true']": {
                  gridColumn: "1 / -1",
                  order: -1,
                },
              }}
            >
              {scenarioDataItems.length > 0 && !isLoading ? (
                <SortableContext
                  items={scenarioOrder}
                  strategy={rectSortingStrategy}
                >
                  {scenarioOrder.map((itemId) => {
                    const item = scenarioDataItems.find(
                      (item) => item.id === itemId,
                    )
                    if (!item) return null

                    const isExpanded = expandedCardIds.has(item.id)

                    return (
                      <SortableScenarioCard
                        key={`sortable-scenario-${item.id}`}
                        id={item.id}
                        scenarioNumber={scenarioOrder.indexOf(item.id) + 1}
                        title={item.title}
                        data={item.data}
                        metricType={item.metricType}
                        isExpanded={isExpanded}
                        onExpand={() => handleCardExpand(item.id)}
                      />
                    )
                  })}
                </SortableContext>
              ) : (
                !isLoading && (
                  <Box
                    sx={{
                      gridColumn: "1 / -1",
                      p: theme.spacing(4),
                      textAlign: "center",
                      border: "1px dashed #ccc",
                      borderRadius: "8px",
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      No scenario data available
                    </Typography>
                    <Typography variant="body1">
                      {selectedOperations.length === 0
                        ? "Please select at least one operation and click Search"
                        : `No data found for the selected operations with metric: ${selectedMetric}`}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ mt: 2, color: "text.secondary" }}
                    >
                      Try selecting different operations or another metric
                    </Typography>
                  </Box>
                )
              )}
            </Box>
          </DndContext>
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
