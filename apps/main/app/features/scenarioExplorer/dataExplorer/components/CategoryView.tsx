"use client"

/**
 * CategoryView - Outcome categories accordion view
 *
 * Displays outcomes grouped by category with expandable sections.
 * Used in the Data Explorer for browsing outcomes.
 */

import React, { useMemo, useState } from "react"
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  CircularProgress,
  Button,
  Select,
  MenuItem,
} from "@repo/ui/mui"
import { InfoTooltip } from "@repo/ui"
import { ExpandMoreIcon } from "@repo/ui/mui"
import useSWR from "swr"
import { useScenarioExplorerStore } from "../../store"
import { VerticalBarChart, TierCircles } from "@repo/viz"
import {
  outcomeCategories,
  getMetricsByCategory,
  getOutcomeCategoryColor,
  type OutcomeMetric,
} from "../../config/outcomeDefinitions"
import { useMetricData } from "../hooks/useMetricData"
import ReservoirPercentilesSection from "./ReservoirPercentilesSection"
import { ScenarioHeader, GRID_LAYOUT } from "./AlignedScenarioGrid"
import { fetchTierLocationData } from "@repo/data/coeqwal"
import { useScenarios } from "@repo/data/coeqwal/hooks"

/**
 * Helper function to detect if tier data represents a single value (vs a distribution)
 * Uses the tierType metadata from the API
 */
function isSingleValueTierData(
  tierData: Array<{
    label: string
    color: string
    value: number
    tierType?: string
  }>,
): boolean {
  if (!tierData || tierData.length === 0) return false
  return tierData[0]?.tierType === "single_value"
}

/**
 * Hook to get per-reservoir tier colors for multiple scenarios
 * Fetches tier location data for RES_STOR and builds a mapping of
 * scenarioId -> reservoirId -> tier color
 */
function useReservoirTierColors(scenarios: string[]) {
  const theme = useTheme()

  // Tier level to color mapping from theme
  const tierLevelColors: Record<number, string> = {
    1: theme.palette.tiers.tier1,
    2: theme.palette.tiers.tier2,
    3: theme.palette.tiers.tier3,
    4: theme.palette.tiers.tier4,
  }

  // Fetch tier location data for each scenario
  // Using a combined SWR key for all scenarios
  const { data: allLocationData } = useSWR(
    scenarios.length > 0 ? ["reservoir-tier-locations", ...scenarios] : null,
    async () => {
      const results = await Promise.all(
        scenarios.map((scenarioId) =>
          fetchTierLocationData(scenarioId, "RES_STOR").catch(() => null),
        ),
      )
      return results
    },
    { revalidateOnFocus: false },
  )

  // Build the cell color mapping: scenarioId -> reservoirId -> color
  const cellColors = useMemo(() => {
    const colors: Record<string, Record<string, string>> = {}

    if (!allLocationData) return colors

    scenarios.forEach((scenarioId, index) => {
      const locationData = allLocationData[index]
      if (!locationData?.features) return

      const scenarioColors: Record<string, string> = {}
      locationData.features.forEach((feature) => {
        // Tier location uses "FOLSM", percentile data uses "S_FOLSM"
        // Add S_ prefix to match percentile reservoir IDs
        const locationId = feature.properties.location_id
        const reservoirId = locationId.startsWith("S_")
          ? locationId
          : `S_${locationId}`
        const tierLevel = feature.properties.tier_level
        const color = tierLevelColors[tierLevel] || theme.palette.tiers.tier3
        scenarioColors[reservoirId] = color
      })
      colors[scenarioId] = scenarioColors
    })

    return colors
  }, [allLocationData, scenarios, tierLevelColors, theme.palette.tiers.tier3])

  return cellColors
}

/**
 * StorageTierRow - Displays tier bar charts for reservoir storage without a label
 */
// Get the reservoir-storage tier metric (constant, safe to call outside component)
const RESERVOIR_TIER_METRIC = getMetricsByCategory("reservoir-storage").find(
  (m) => m.isTier,
)

function StorageTierRow({ scenarios }: { scenarios: string[] }) {
  const theme = useTheme()
  const { data, isLoading } = useMetricData(
    scenarios,
    RESERVOIR_TIER_METRIC as OutcomeMetric,
  )

  if (!RESERVOIR_TIER_METRIC) return null

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `${GRID_LAYOUT.labelColumnWidth}px repeat(${scenarios.length}, 1fr)`,
        gap: 0,
        alignItems: "center",
        mb: theme.space.component.lg,
        minHeight: 80,
        py: theme.space.component.sm,
        borderBottom: `1px solid ${theme.palette.grey[100]}`,
      }}
    >
      {/* Empty label column for alignment */}
      <Box />

      {/* Scenario cells */}
      {scenarios.map((scenarioId) => {
        if (isLoading) {
          return (
            <Box
              key={scenarioId}
              sx={{ display: "flex", justifyContent: "center", py: 2 }}
            >
              <CircularProgress size={20} />
            </Box>
          )
        }
        const scenarioData = data?.find((d) => d.scenarioId === scenarioId)
        if (!scenarioData?.tierData) {
          return (
            <Box
              key={scenarioId}
              sx={{ display: "flex", justifyContent: "center", py: 2 }}
            >
              <Typography
                variant="caption"
                sx={{ color: theme.palette.grey[400] }}
              >
                —
              </Typography>
            </Box>
          )
        }
        return (
          <Box
            key={scenarioId}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            {isSingleValueTierData(scenarioData.tierData) ? (
              <TierCircles tiers={scenarioData.tierData} size={80} />
            ) : (
              <VerticalBarChart tiers={scenarioData.tierData} size={80} />
            )}
          </Box>
        )
      })}
    </Box>
  )
}

type StorageDisplayMode = "percentage" | "volume"

/**
 * MonthlyStorageSection - Section header with display mode dropdown
 * Wraps ReservoirPercentilesSection with a toggle for percentage vs volume display
 */
function MonthlyStorageSection({
  scenarios,
  cellColors,
}: {
  scenarios: string[]
  cellColors?: Record<string, Record<string, string>>
}) {
  const theme = useTheme()
  const [displayMode, setDisplayMode] =
    useState<StorageDisplayMode>("percentage")

  return (
    <Box sx={{ mt: theme.space.section.sm }}>
      {/* Header with label and dropdown */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: theme.space.gap.md,
          mb: theme.space.component.lg,
        }}
      >
        <Typography
          variant="smallSectionLabel"
          sx={{
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Monthly storage
        </Typography>
        <Select
          value={displayMode}
          onChange={(e) => setDisplayMode(e.target.value as StorageDisplayMode)}
          size="small"
          sx={{
            ...theme.typography.compactCaption,
            minWidth: 180,
            "& .MuiSelect-select": {
              py: 0.5,
              px: 1.5,
            },
          }}
        >
          <MenuItem value="percentage">as percentage of capacity</MenuItem>
          <MenuItem value="volume">by volume</MenuItem>
        </Select>
      </Box>

      {/* The percentile charts */}
      <ReservoirPercentilesSection
        scenarios={scenarios}
        showScenarioHeaders={false}
        cellColors={cellColors}
      />
    </Box>
  )
}

/**
 * ReservoirStorageSection - Special section for reservoir storage category
 * Fetches per-reservoir tier colors and passes them to the percentile charts
 */
function ReservoirStorageSection({
  scenarios,
  scenarioNames,
}: {
  scenarios: string[]
  scenarioNames: Record<string, string>
}) {
  const theme = useTheme()
  const cellColors = useReservoirTierColors(scenarios)

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.borderRadius.md,
        border: theme.border.light,
        p: theme.space.component.lg,
      }}
    >
      <ScenarioHeader scenarios={scenarios} scenarioNames={scenarioNames} />

      {/* Storage distribution header */}
      <Typography
        variant="smallSectionLabel"
        sx={{
          display: "block",
          mb: theme.space.component.lg,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Storage distribution (
        <InfoTooltip
          description={
            <>
              Shasta · Oroville · Folsom · Trinity
              <br />
              New Melones · Millerton · San Luis (CVP & SWP)
            </>
          }
          placement="bottom"
        >
          <span
            style={{
              textDecoration: "underline",
              textDecorationStyle: "dotted",
              cursor: "help",
            }}
          >
            major reservoirs
          </span>
        </InfoTooltip>
        )
      </Typography>

      {/* Tier outcome visualization */}
      <StorageTierRow scenarios={scenarios} />

      {/* Percentile distribution section */}
      <MonthlyStorageSection scenarios={scenarios} cellColors={cellColors} />
    </Box>
  )
}

/**
 * CategoryView: Outcomes organized by category with collapsible sections
 */
export default function CategoryView() {
  const theme = useTheme()
  const { selectedScenarios, setActiveView } = useScenarioExplorerStore()
  const [expanded, setExpanded] = React.useState<string[]>([])
  // Scenario list is cached by SWR - multiple components share the same data
  const { scenarios: scenarioList } = useScenarios()

  // Pre-build a lookup map from the scenario list (O(n) once)
  const scenarioLookup = useMemo(() => {
    const lookup = new Map<string, string>()
    scenarioList?.forEach((s) => {
      lookup.set(s.scenario_id, s.short_title)
    })
    return lookup
  }, [scenarioList])

  // Build scenario ID -> display name mapping for selected scenarios
  const scenarioNames = useMemo(() => {
    const names: Record<string, string> = {}
    selectedScenarios.forEach((id) => {
      names[id] = scenarioLookup.get(id) || id
    })
    return names
  }, [selectedScenarios, scenarioLookup])

  const handleAccordionChange = (categoryId: string) => {
    setExpanded((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    )
  }

  // Empty state when no scenarios selected
  if (selectedScenarios.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          p: theme.space.section.md,
          textAlign: "center",
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: theme.palette.grey[700],
            mb: theme.space.component.md,
          }}
        >
          No scenarios selected
        </Typography>
        <Typography
          variant="dashboard"
          sx={{
            display: "block",
            color: theme.palette.grey[500],
            mb: theme.space.section.xs,
            maxWidth: 320,
          }}
        >
          Select scenarios to compare outcome metrics side by side.
        </Typography>
        <Button
          variant="text"
          onClick={() => setActiveView("list")}
          sx={{
            ...theme.typography.dashboard,
            textTransform: "none",
            fontWeight: 500,
            color: theme.palette.blue.dark,
            "&:hover": {
              backgroundColor: theme.palette.blue.pale,
            },
          }}
        >
          Choose scenarios →
        </Button>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        height: "100%",
        overflowY: "auto",
      }}
    >
      {outcomeCategories.map((category) => {
        const metrics = getMetricsByCategory(category.id)
        const tierMetrics = metrics.filter((m) => m.isTier)
        const nonTierMetrics = metrics.filter((m) => !m.isTier)

        return (
          <Accordion
            key={category.id}
            expanded={expanded.includes(category.id)}
            onChange={() => handleAccordionChange(category.id)}
            sx={{
              backgroundColor: theme.palette.background.paper,
              boxShadow: "none",
              border: theme.border.light,
              mb: theme.space.component.lg,
              "&:before": { display: "none" },
            }}
          >
            <AccordionSummary
              expandIcon={
                <ExpandMoreIcon sx={{ color: theme.palette.grey[400] }} />
              }
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderBottom: expanded.includes(category.id)
                  ? theme.border.light
                  : "none",
                minHeight: 64,
                "&:hover": {
                  backgroundColor: theme.palette.grey[50],
                },
                "& .MuiAccordionSummary-content": {
                  my: 1.5,
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: theme.space.gap.lg,
                  width: "100%",
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: theme.borderRadius.sm,
                    backgroundColor: `${getOutcomeCategoryColor(theme, category.id)}15`,
                    color: getOutcomeCategoryColor(theme, category.id),
                    fontSize: 20,
                  }}
                >
                  {category.icon}
                </Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    flex: 1,
                    color: theme.palette.text.primary,
                  }}
                >
                  {category.name}
                </Typography>
                <Typography
                  variant="compactCaption"
                  sx={{
                    color: theme.palette.grey[400],
                  }}
                >
                  {metrics.length} metric{metrics.length !== 1 ? "s" : ""}
                </Typography>
              </Box>
            </AccordionSummary>

            <AccordionDetails
              sx={{
                p: theme.space.component.xl,
              }}
            >
              {/* Special aligned layout for reservoir-storage category */}
              {category.id === "reservoir-storage" &&
              selectedScenarios.length > 0 ? (
                <ReservoirStorageSection
                  scenarios={selectedScenarios}
                  scenarioNames={scenarioNames}
                />
              ) : (
                <>
                  {/* Standard tier metrics for non-reservoir categories */}
                  {tierMetrics.length > 0 && (
                    <Box sx={{ mb: theme.space.section.sm }}>
                      <Typography
                        variant="smallSectionLabel"
                        sx={{
                          display: "block",
                          mb: theme.space.component.lg,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Outcome Tiers
                      </Typography>
                      {tierMetrics.map((metric) => (
                        <MetricCard
                          key={metric.id}
                          metric={metric}
                          scenarios={selectedScenarios}
                        />
                      ))}
                    </Box>
                  )}
                </>
              )}

              {/* Other metrics */}
              {nonTierMetrics.length > 0 && (
                <Box>
                  {tierMetrics.length > 0 && (
                    <Typography
                      variant="smallSectionLabel"
                      sx={{
                        display: "block",
                        mb: theme.space.component.lg,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Additional Metrics
                    </Typography>
                  )}
                  {nonTierMetrics.map((metric) => (
                    <MetricCard
                      key={metric.id}
                      metric={metric}
                      scenarios={selectedScenarios}
                    />
                  ))}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        )
      })}
    </Box>
  )
}

/**
 * MetricCard: Individual metric display
 */
function MetricCard({
  metric,
  scenarios,
}: {
  metric: OutcomeMetric
  scenarios: string[]
}) {
  const theme = useTheme()
  const { data, isLoading, error } = useMetricData(scenarios, metric)

  return (
    <Box
      sx={{
        p: theme.space.component.xl,
        mb: theme.space.component.lg,
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.borderRadius.md,
        border: theme.border.light,
        transition: theme.transition.default,
        "&:hover": {
          borderColor: theme.palette.grey[300],
        },
      }}
    >
      {/* Metric name and unit */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          mb: theme.space.component.md,
          gap: theme.space.gap.lg,
        }}
      >
        <Typography
          variant="compactTitle"
          sx={{
            color: theme.palette.text.primary,
          }}
        >
          {metric.name}
        </Typography>
        <Typography
          variant="compactMicro"
          sx={{
            color: theme.palette.grey[400],
            textTransform: "lowercase",
            flexShrink: 0,
          }}
        >
          {metric.unit}
        </Typography>
      </Box>

      {/* Description */}
      <Typography
        variant="dashboard"
        sx={{
          display: "block",
          color: theme.palette.grey[600],
          mb: theme.space.component.lg,
        }}
      >
        {metric.description}
      </Typography>

      {/* Metadata - simplified inline display */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: theme.space.gap.lg,
          mb: metric.notes ? theme.space.component.md : 0,
        }}
      >
        <Typography
          variant="compactMicro"
          sx={{ color: theme.palette.grey[400] }}
        >
          {metric.temporal.join(" · ")}
        </Typography>
        <Typography
          variant="compactMicro"
          sx={{ color: theme.palette.grey[400] }}
        >
          {metric.spatialType.replace(/-/g, " ")}
        </Typography>
        {metric.aggregations.length > 0 && (
          <Typography
            variant="compactMicro"
            sx={{ color: theme.palette.grey[400] }}
          >
            {metric.aggregations.join(" · ")}
          </Typography>
        )}
      </Box>

      {/* Notes */}
      {metric.notes && (
        <Box
          sx={{
            mt: theme.space.component.md,
            py: theme.space.component.sm,
            px: theme.space.component.md,
            backgroundColor: theme.palette.grey[50],
            borderRadius: theme.borderRadius.sm,
            borderLeft: `2px solid ${theme.palette.grey[300]}`,
          }}
        >
          <Typography
            variant="compactCaption"
            sx={{
              display: "block",
              color: theme.palette.grey[600],
            }}
          >
            {metric.notes}
          </Typography>
        </Box>
      )}

      {/* Scenario comparison data visualization */}
      {scenarios.length > 0 && (
        <Box
          sx={{
            mt: theme.space.section.xs,
            pt: theme.space.component.lg,
            borderTop: theme.border.light,
          }}
        >
          {isLoading && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: theme.space.section.sm,
              }}
            >
              <CircularProgress
                size={20}
                sx={{ color: theme.palette.grey[300] }}
              />
              <Typography
                variant="compactCaption"
                sx={{
                  ml: theme.space.component.md,
                  color: theme.palette.grey[400],
                }}
              >
                Loading...
              </Typography>
            </Box>
          )}

          {error && (
            <Typography
              variant="compactCaption"
              sx={{
                color: theme.palette.grey[500],
                fontStyle: "italic",
              }}
            >
              {error}
            </Typography>
          )}

          {!isLoading && !error && data && metric.isTier && (
            <Box
              sx={{
                display: "flex",
                gap: theme.space.gap.xl,
                flexWrap: "wrap",
              }}
            >
              {data.map((scenario) => (
                <Box
                  key={scenario.scenarioId}
                  sx={{
                    flex: "1 1 180px",
                    minWidth: theme.spacing(22),
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="compactCaption"
                    sx={{
                      mb: theme.space.component.md,
                      fontWeight: 500,
                      color: theme.palette.grey[500],
                      textAlign: "center",
                      fontFeatureSettings: "'tnum' 1",
                    }}
                  >
                    {scenario.scenarioName}
                  </Typography>
                  {isSingleValueTierData(scenario.tierData) ? (
                    <TierCircles tiers={scenario.tierData} size={140} />
                  ) : (
                    <VerticalBarChart tiers={scenario.tierData} size={140} />
                  )}
                </Box>
              ))}
            </Box>
          )}

          {!isLoading && !error && !metric.isTier && (
            <Typography
              variant="compactCaption"
              sx={{
                display: "block",
                color: theme.palette.grey[400],
                fontStyle: "italic",
                textAlign: "center",
                py: theme.space.component.lg,
              }}
            >
              Visualization coming soon
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}
