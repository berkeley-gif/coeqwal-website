"use client"

/**
 * CategoryView - Outcome categories accordion view
 *
 * Displays outcomes grouped by category with expandable sections.
 * Used in the Data Explorer for browsing outcomes.
 */

import React from "react"
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  Chip,
  CircularProgress,
  Button,
} from "@repo/ui/mui"
import { ExpandMoreIcon } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../../../store"
import { VerticalBarChart, TierCircles } from "@repo/viz"
import {
  outcomeCategories,
  getMetricsByCategory,
  getOutcomeCategoryColor,
  type OutcomeMetric,
} from "../outcomeDefinitions"
import { useMetricData } from "../hooks/useMetricData"

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
  // Check the tierType metadata from the first data point (all points in a tier have the same type)
  return tierData[0]?.tierType === "single_value"
}

/**
 * CategoryView: Outcomes organized by category with collapsible sections
 */
export default function CategoryView() {
  const theme = useTheme()
  const { selectedScenarios, setActiveView } = useScenarioExplorerStore()
  const [expanded, setExpanded] = React.useState<string[]>([])

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
          p: theme.spacing(theme.cards.spacing.standard),
          textAlign: "center",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.grey[600],
            mb: theme.spacing(2),
          }}
        >
          No scenarios selected
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.grey[500],
            mb: theme.spacing(3),
            maxWidth: theme.layout.maxWidth.md,
          }}
        >
          Select scenarios in List View to see side-by-side comparisons of
          outcome metrics.
        </Typography>
        <Button
          variant="contained"
          onClick={() => setActiveView("list")}
          sx={{
            backgroundColor: theme.palette.blue.darkest,
            color: theme.palette.common.white,
            textTransform: "none",
            "&:hover": {
              backgroundColor: theme.palette.blue.bright,
            },
          }}
        >
          Go to list view
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
              backgroundColor: theme.palette.common.white,
              boxShadow: "none",
              border: theme.border.light,
              mb: theme.spacing(2),
              "&:before": {
                display: "none",
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: theme.palette.grey[50],
                borderBottom: expanded.includes(category.id)
                  ? theme.border.medium
                  : "none",
                "&:hover": {
                  backgroundColor: theme.palette.grey[100],
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: theme.spacing(2),
                  width: "100%",
                }}
              >
                <Typography variant="h5">{category.icon}</Typography>
                <Typography variant="h6" sx={{ flex: 1 }}>
                  {category.name}
                </Typography>
                <Chip
                  label={`${metrics.length} metric${metrics.length !== 1 ? "s" : ""}`}
                  size="small"
                  sx={{
                    backgroundColor: getOutcomeCategoryColor(theme, category.id),
                    color: theme.palette.common.white,
                    fontWeight: theme.typography.fontWeightMedium,
                  }}
                />
              </Box>
            </AccordionSummary>

            <AccordionDetails
              sx={{
                p: theme.spacing(theme.cards.spacing.standard),
              }}
            >
              {/* Tier Metrics First */}
              {tierMetrics.length > 0 && (
                <Box sx={{ mb: theme.spacing(3) }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: theme.spacing(2),
                      color: theme.palette.blue.dark,
                      fontWeight: theme.typography.fontWeightMedium,
                    }}
                  >
                    Outcome tiers
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

              {/* Other metrics */}
              {nonTierMetrics.length > 0 && (
                <Box>
                  {tierMetrics.length > 0 && (
                    <Typography
                      variant="subtitle2"
                      sx={{
                        mb: theme.spacing(2),
                        color: theme.palette.blue.dark,
                        fontWeight: theme.typography.fontWeightMedium,
                      }}
                    >
                      Additional metrics
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
 * MetricCard: Individual metric display with real data
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
        p: theme.spacing(2),
        mb: theme.spacing(2),
        backgroundColor: theme.palette.grey[50],
        borderRadius: theme.borderRadius.md,
        border: theme.border.light,
        "&:hover": {
          backgroundColor: theme.palette.grey[100],
          border: theme.border.medium,
        },
      }}
    >
      {/* Metric name and unit */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: theme.spacing(1),
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: theme.typography.fontWeightMedium,
            color: theme.palette.text.primary,
          }}
        >
          {metric.name}
        </Typography>
        <Chip
          label={metric.unit}
          size="small"
          sx={{
            ...theme.typography.compact.caption,
            backgroundColor: theme.palette.blue.light,
            color: theme.palette.common.white,
          }}
        />
      </Box>

      {/* Description */}
      <Typography
        variant="body2"
        sx={{
          color: theme.palette.grey[600],
          mb: theme.spacing(1.5),
        }}
      >
        {metric.description}
      </Typography>

      {/* Metadata row */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: theme.spacing(1),
          mb: theme.spacing(1.5),
        }}
      >
        {/* Temporal */}
        <Chip
          label={`Temporal: ${metric.temporal.join(", ")}`}
          size="small"
          variant="outlined"
          sx={{ ...theme.typography.compact.caption }}
        />

        {/* Spatial type */}
        <Chip
          label={`Location: ${metric.spatialType}`}
          size="small"
          variant="outlined"
          sx={{ ...theme.typography.compact.caption }}
        />

        {/* Map indicator */}
        {metric.showOnMap && (
          <Chip
            label="📍 Map"
            size="small"
            sx={{
              ...theme.typography.compact.caption,
              backgroundColor: theme.palette.nature.earth,
              color: theme.palette.common.white,
            }}
          />
        )}
      </Box>

      {/* Aggregations */}
      {metric.aggregations.length > 0 && (
        <Typography
          variant="compactSubtitle"
          sx={{ color: theme.palette.grey[500] }}
        >
          <strong>Aggregations:</strong> {metric.aggregations.join(", ")}
        </Typography>
      )}

      {/* Notes */}
      {metric.notes && (
        <Typography
          variant="compactSubtitle"
          sx={{
            mt: theme.spacing(1),
            p: theme.spacing(1),
            backgroundColor: theme.palette.accent.gold,
            borderRadius: theme.borderRadius.md,
            color: theme.palette.text.primary,
          }}
        >
          ⚠️ {metric.notes}
        </Typography>
      )}

      {/* Scenario comparison data visualization */}
      {scenarios.length > 0 && (
        <Box
          sx={{
            mt: theme.spacing(2),
            p: theme.spacing(2),
            backgroundColor: theme.palette.common.white,
            borderRadius: theme.borderRadius.md,
            border: theme.border.medium,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              mb: theme.spacing(1.5),
              fontWeight: theme.typography.fontWeightMedium,
              color: theme.palette.text.primary,
            }}
          >
            Scenario Comparison
          </Typography>

          {isLoading && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: theme.spacing(3),
              }}
            >
              <CircularProgress size={24} />
              <Typography
                variant="body2"
                sx={{ ml: theme.spacing(2), color: theme.palette.grey[600] }}
              >
                Loading data...
              </Typography>
            </Box>
          )}

          {error && (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.accent.alert,
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
                gap: theme.spacing(3),
                flexWrap: "wrap",
              }}
            >
              {data.map((scenario) => (
                <Box
                  key={scenario.scenarioId}
                  sx={{
                    flex: "1 1 200px",
                    minWidth: theme.spacing(25),
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="compactSubtitle"
                    sx={{
                      mb: theme.spacing(1),
                      fontWeight: theme.typography.fontWeightMedium,
                      textAlign: "center",
                    }}
                  >
                    {scenario.scenarioName}
                  </Typography>
                  {isSingleValueTierData(scenario.tierData) ? (
                    <TierCircles tiers={scenario.tierData} size={150} />
                  ) : (
                    <VerticalBarChart tiers={scenario.tierData} size={150} />
                  )}
                </Box>
              ))}
            </Box>
          )}

          {!isLoading && !error && !metric.isTier && (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.grey[600],
                fontStyle: "italic",
                textAlign: "center",
                py: theme.spacing(2),
              }}
            >
              Detailed metric visualizations coming soon
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}
