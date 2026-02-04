"use client"

/**
 * AgSection - Agricultural Water section for the Data Explorer
 *
 * Displays agricultural delivery and productivity data:
 * - Revenue tier distribution (AG_REV)
 * - Monthly delivery percentile charts (placeholder until API ready)
 *
 * Uses the same CSS Grid layout patterns as CwsSection and ReservoirStorageSection.
 */

import React, { useState } from "react"
import { Box, Typography, useTheme, CircularProgress } from "@repo/ui/mui"
import { MobileModal } from "@repo/ui"
import { TierGlyphWithTooltip } from "../../../tooltips/TierGlyphWithTooltip"
import type { ChartDataPoint } from "../../../scenarios/components/shared"
import { GridScenarioHeader } from "./AlignedScenarioGrid"
import { ChartGridProvider } from "./ChartGridContext"
import {
  outcomeCategories,
  getOutcomeCategoryColor,
  getMetricsByCategory,
  type OutcomeMetric,
} from "../../config/outcomeDefinitions"
import { useMetricData } from "../hooks/useMetricData"

// ============================================================================
// Constants
// ============================================================================

/** Compact chart size for tier distribution (1.5x scenario-explorer size) */
const TIER_CHART_SIZE = 90

// Get the agricultural tier metric (constant, safe to call outside component)
const AG_TIER_METRIC = getMetricsByCategory("agricultural-water").find(
  (m) => m.isTier,
)

// ============================================================================
// Section Header Component
// ============================================================================

interface SectionHeaderProps {
  title: string
  titleAdornment?: React.ReactNode
  description?: React.ReactNode
}

function SectionHeader({
  title,
  titleAdornment,
  description,
}: SectionHeaderProps) {
  const theme = useTheme()

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: theme.space.gap.sm,
        }}
      >
        <Typography
          variant="overline"
          sx={{
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </Typography>
        {titleAdornment}
      </Box>

      {description && (
        <Box
          sx={{
            color: theme.palette.grey[600],
            mt: 0.5,
            ...theme.typography.dashboard,
          }}
        >
          {description}
        </Box>
      )}
    </Box>
  )
}

// ============================================================================
// Ag Tier Row Component
// ============================================================================

interface AgTierChartsProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
  /** Whether this is inside a modal (affects tooltip z-index) */
  isModal?: boolean
}

function AgTierCharts({
  scenarios,
  scenarioNames,
  isModal = false,
}: AgTierChartsProps) {
  const theme = useTheme()
  const { data, isLoading } = useMetricData(
    scenarios,
    AG_TIER_METRIC as OutcomeMetric,
  )

  if (!AG_TIER_METRIC) return null

  return (
    <>
      {scenarios.map((scenarioId, index) => {
        if (isLoading) {
          return (
            <Box
              key={scenarioId}
              sx={{
                gridColumn: index + 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CircularProgress size={20} />
            </Box>
          )
        }

        // Special case: s0011 is the baseline scenario
        if (scenarioId === "s0011") {
          return (
            <Box
              key={scenarioId}
              sx={{
                gridColumn: index + 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.palette.grey[100],
                  borderRadius: theme.borderRadius.sm,
                  border: theme.border.medium,
                  width: TIER_CHART_SIZE,
                  height: TIER_CHART_SIZE,
                  px: theme.space.component.xs,
                }}
              >
                <Typography
                  variant="compactMicro"
                  sx={{
                    color: theme.palette.grey[500],
                    textAlign: "center",
                    lineHeight: 1.3,
                  }}
                >
                  Baseline
                </Typography>
              </Box>
            </Box>
          )
        }

        const scenarioData = data?.find((d) => d.scenarioId === scenarioId)
        if (!scenarioData?.tierData) {
          return (
            <Box
              key={scenarioId}
              sx={{
                gridColumn: index + 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
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

        // Convert tier data to ChartDataPoint format
        const chartData: ChartDataPoint[] = scenarioData.tierData.map(
          (tier) => ({
            label: tier.label,
            color: tier.color,
            value: tier.value,
            tierType: tier.tierType,
          }),
        )

        return (
          <Box
            key={scenarioId}
            sx={{
              gridColumn: index + 2,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <TierGlyphWithTooltip
              outcomeCode="AG_REV"
              chartData={chartData}
              scenarioLabel={scenarioNames[scenarioId] || scenarioId}
              size={TIER_CHART_SIZE}
              zIndex={isModal ? theme.zIndex.tooltipAboveModal : undefined}
            />
          </Box>
        )
      })}
    </>
  )
}

// ============================================================================
// Monthly Ag Section Component (Placeholder)
// ============================================================================

interface MonthlyAgSectionProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
  isModal?: boolean
}

function MonthlyAgSection({
  scenarios,
  scenarioNames,
  isModal = false,
}: MonthlyAgSectionProps) {
  const theme = useTheme()

  return (
    <>
      {/* Header row */}
      <Box
        sx={{
          gridColumn: "1 / -1",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: theme.space.component.sm,
        }}
      >
        <SectionHeader
          title="Monthly deliveries"
          description={
            <>
              Water year (Oct–Sep) · {scenarios.length} scenario
              {scenarios.length !== 1 ? "s" : ""}
            </>
          }
        />
      </Box>

      {/* Placeholder for monthly data */}
      <Box
        sx={{
          gridColumn: "1 / -1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 200,
          backgroundColor: theme.palette.grey[50],
          borderRadius: theme.borderRadius.sm,
          border: `1px dashed ${theme.palette.grey[300]}`,
        }}
      >
        <Typography
          variant="compactCaption"
          sx={{ color: theme.palette.grey[400] }}
        >
          Agricultural demand data coming soon
        </Typography>
      </Box>
    </>
  )
}

// ============================================================================
// Main Ag Section Export
// ============================================================================

interface AgSectionProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
}

export default function AgSection({
  scenarios,
  scenarioNames,
}: AgSectionProps) {
  const theme = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      {/* Sticky scenario header row */}
      <Box
        sx={{
          position: "sticky",
          top: 64,
          zIndex: 9,
          backgroundColor: theme.palette.background.default,
          py: theme.space.component.sm,
          mx: -theme.space.component.xl,
          px: theme.space.component.xl,
        }}
      >
        <ChartGridProvider scenarios={scenarios}>
          <GridScenarioHeader
            scenarios={scenarios}
            scenarioNames={scenarioNames}
            onExpand={() => setIsExpanded(true)}
          />
        </ChartGridProvider>
      </Box>

      {/* Revenue tier section */}
      <Box sx={{ mt: theme.space.component.md }}>
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.borderRadius.md,
            border: theme.border.light,
            p: theme.space.component.lg,
            mb: theme.space.component.lg,
          }}
        >
          <ChartGridProvider scenarios={scenarios}>
            {/* Title in column 1, charts in scenario columns - all on same row */}
            <Box sx={{ gridColumn: 1, display: "flex", alignItems: "center" }}>
              <SectionHeader
                title="Revenue distribution"
                description="134 agricultural demand units"
              />
            </Box>
            <AgTierCharts
              scenarios={scenarios}
              scenarioNames={scenarioNames}
            />
          </ChartGridProvider>
        </Box>

        {/* Monthly delivery section */}
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.borderRadius.md,
            border: theme.border.light,
            p: theme.space.component.lg,
          }}
        >
          <ChartGridProvider scenarios={scenarios}>
            <MonthlyAgSection
              scenarios={scenarios}
              scenarioNames={scenarioNames}
            />
          </ChartGridProvider>
        </Box>
      </Box>

      {/* Expanded modal view */}
      <MobileModal
        open={isExpanded}
        onClose={() => setIsExpanded(false)}
        title={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: theme.space.gap.lg,
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
                backgroundColor: `${getOutcomeCategoryColor(theme, "agricultural-water")}15`,
                color: getOutcomeCategoryColor(theme, "agricultural-water"),
                fontSize: 20,
              }}
            >
              {
                outcomeCategories.find((c) => c.id === "agricultural-water")
                  ?.icon
              }
            </Box>
            <Typography
              variant="subtitle2"
              sx={{ color: theme.palette.text.primary }}
            >
              Agricultural water
            </Typography>
          </Box>
        }
        maxWidth="90vw"
        maxHeight="90vh"
        contentAriaLabel="Agricultural water data visualization"
        stickyHeader={
          <ChartGridProvider scenarios={scenarios}>
            <GridScenarioHeader
              scenarios={scenarios}
              scenarioNames={scenarioNames}
            />
          </ChartGridProvider>
        }
      >
        <Box sx={{ p: theme.space.component.lg }}>
          {/* Revenue tier section */}
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.borderRadius.md,
              border: theme.border.light,
              p: theme.space.component.lg,
              mb: theme.space.component.lg,
            }}
          >
            <ChartGridProvider scenarios={scenarios}>
              {/* Title in column 1, charts in scenario columns - all on same row */}
              <Box
                sx={{ gridColumn: 1, display: "flex", alignItems: "center" }}
              >
                <SectionHeader
                  title="Revenue distribution"
                  description="134 agricultural demand units"
                />
              </Box>
              <AgTierCharts
                scenarios={scenarios}
                scenarioNames={scenarioNames}
                isModal
              />
            </ChartGridProvider>
          </Box>

          {/* Monthly delivery section */}
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.borderRadius.md,
              border: theme.border.light,
              p: theme.space.component.lg,
            }}
          >
            <ChartGridProvider scenarios={scenarios}>
              <MonthlyAgSection
                scenarios={scenarios}
                scenarioNames={scenarioNames}
                isModal
              />
            </ChartGridProvider>
          </Box>
        </Box>
      </MobileModal>
    </>
  )
}
