"use client"

/**
 * MetricCard - generic per-metric comparison card.
 *
 * Fallback renderer for outcome categories that do not have a bespoke
 * section (currently groundwater storage and salmon abundance). Tier
 * metrics render as TierCircles or VerticalBarChart. Non-tier metrics show a
 * "Visualization coming soon" placeholder until detailed data is wired up.
 */

import React from "react"
import { Box, Typography, useTheme, CircularProgress } from "@repo/ui/mui"
import { VerticalBarChart, TierCircles } from "@repo/viz"
import { isSingleValueTier } from "../../../../../../../scenarios/components/shared"
import type { OutcomeMetric } from "../../config/outcomeDefinitions"
import { useMetricData } from "../../hooks/useMetricData"
import { TIER_CHART_SIZE } from "../shared/chartConstants"

export function MetricCard({
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
        boxShadow: theme.shadow.subtle,
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
                  {isSingleValueTier(scenario.tierData) ? (
                    <TierCircles tiers={scenario.tierData} size={TIER_CHART_SIZE} />
                  ) : (
                    <VerticalBarChart
                      tiers={scenario.tierData}
                      size={TIER_CHART_SIZE}
                    />
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
