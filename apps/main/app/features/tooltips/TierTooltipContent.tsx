"use client"

/**
 * TierTooltipContent - Shared tier tooltip content
 *
 * Displays outcome tier descriptions in a consistent format.
 * Used by TierLegend, ClickTooltip, and HybridTooltip.
 *
 * WCAG 4.1.2: When scenarioScore is provided, displays the scenario's actual
 * tier level with a visual indicator, making glyph data accessible to
 * screen reader users as text.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useOutcomeDefinitions, type OutcomeScoreData } from "../scenarios/hooks"
import { outcomeTierValues } from "../../content/outcomes"
import type { TooltipChartDataPoint } from "./useTierTooltipState"

interface TierTooltipContentProps {
  outcome: string
  showTitle?: boolean
  /** Optional: Current scenario's score data for this outcome */
  scenarioScore?: OutcomeScoreData | null
  /** Optional: Scenario label for context */
  scenarioLabel?: string
  /** Optional: Chart data showing tier distribution or level */
  chartData?: TooltipChartDataPoint[]
}

// Format description text with bold markdown (**text**)
const formatDescription = (text: string, fontWeightMedium: number = 500) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const content = part.slice(2, -2)
      return (
        <span key={index} style={{ fontWeight: fontWeightMedium }}>
          {content}
        </span>
      )
    }
    return <span key={index}>{part}</span>
  })
}

// Format tier text with emphasized keywords, numbers, and markdown
const formatTierText = (text: string, fontWeightMedium: number = 500) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const content = part.slice(2, -2)
      return (
        <span key={index} style={{ fontWeight: fontWeightMedium }}>
          {content}
        </span>
      )
    }

    const subParts = part.split(
      /(Optimal:|Sub-optimal:|At-risk:|Critical:|Compromised:|\d+%)/g,
    )

    return subParts.map((subPart, subIndex) => {
      const key = `${index}-${subIndex}`

      if (
        subPart.match(
          /^(Optimal:|Sub-optimal:|At-risk:|Critical:|Compromised:)$/,
        )
      ) {
        return (
          <span key={key} style={{ fontWeight: fontWeightMedium }}>
            {subPart}
          </span>
        )
      }
      if (subPart.match(/^\d+%$/)) {
        return (
          <span key={key} style={{ fontWeight: fontWeightMedium }}>
            {subPart}
          </span>
        )
      }
      return <span key={key}>{subPart}</span>
    })
  })
}

/**
 * Determine tier type and current tier from chart data
 * - single_value: Returns the tier that has value === 1 (the selected tier)
 * - multi_value: Returns null (no single tier - it's a distribution)
 */
const getTierFromChartData = (
  chartData?: TooltipChartDataPoint[],
): { tierType: "single_value" | "multi_value" | null; currentTier: number | null } => {
  if (!chartData || chartData.length === 0) {
    return { tierType: null, currentTier: null }
  }

  const tierType = chartData[0]?.tierType ?? null

  if (tierType === "single_value") {
    // Find which tier is active (value === 1)
    const activeTierIndex = chartData.findIndex((d) => d.value === 1)
    return {
      tierType: "single_value",
      currentTier: activeTierIndex >= 0 ? activeTierIndex + 1 : null,
    }
  }

  // multi_value - no single tier, it's a distribution
  return { tierType: "multi_value", currentTier: null }
}

/**
 * Format distribution percentages for display
 * Converts normalized values (0-1) to percentages
 */
const formatDistribution = (chartData: TooltipChartDataPoint[]): string[] => {
  return chartData.map((d) => {
    const percentage = Math.round(d.value * 100)
    return `${percentage}%`
  })
}

/**
 * Shared tooltip/legend content for tier information
 */
export default function TierTooltipContent({
  outcome,
  showTitle = true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  scenarioScore, // Reserved for future equity/gini display
  scenarioLabel,
  chartData,
}: TierTooltipContentProps) {
  const theme = useTheme()
  const { definitions: outcomeDefinitions } = useOutcomeDefinitions()

  // Determine tier type and current tier from chart data (more accurate than score)
  const { tierType, currentTier } = getTierFromChartData(chartData)

  // Tier level names for display
  const tierLevelNames = ["Optimal", "Sub-optimal", "At-risk", "Critical"]

  // Get distribution percentages for multi-value tiers
  const distribution = tierType === "multi_value" && chartData ? formatDistribution(chartData) : null

  return (
    <Box sx={{ color: theme.palette.text.primary }}>
      {showTitle && (
        <Typography
          variant="tooltipHeader"
          sx={{ mb: theme.space.component.sm }}
        >
          {outcome}
        </Typography>
      )}

      <Typography variant="dashboard" sx={{ mb: theme.space.component.md }}>
        {formatDescription(
          (outcomeDefinitions as Record<string, string>)[outcome] ||
            "Definition not available",
          theme.typography.fontWeightMedium as number,
        )}
      </Typography>

      {/* WCAG 4.1.2: Scenario-specific display for accessibility */}
      {/* Single-value tier: Show the current tier level */}
      {tierType === "single_value" && currentTier && scenarioLabel && (
        <Box
          sx={{
            mb: theme.space.component.md,
            p: theme.space.component.md,
            backgroundColor: theme.palette.grey[100],
            borderRadius: theme.borderRadius.sm,
            borderLeft: `4px solid ${theme.palette.tiers[`tier${currentTier}` as keyof typeof theme.palette.tiers]}`,
          }}
          role="region"
          aria-label={`Current scenario performance for ${outcome}`}
        >
          <Typography
            variant="dashboard"
            sx={{ fontWeight: theme.typography.fontWeightMedium, mb: 0.5 }}
          >
            {scenarioLabel}:
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: theme.space.gap.sm }}>
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: theme.borderRadius.xs,
                backgroundColor:
                  theme.palette.tiers[
                    `tier${currentTier}` as keyof typeof theme.palette.tiers
                  ],
                flexShrink: 0,
              }}
            />
            <Typography variant="dashboard">
              <strong>{tierLevelNames[currentTier - 1]}</strong> (Level {currentTier} of 4)
            </Typography>
          </Box>
        </Box>
      )}

      {/* Multi-value tier: Show the distribution across tiers */}
      {tierType === "multi_value" && distribution && chartData && scenarioLabel && (
        <Box
          sx={{
            mb: theme.space.component.md,
            p: theme.space.component.md,
            backgroundColor: theme.palette.grey[100],
            borderRadius: theme.borderRadius.sm,
            borderLeft: `4px solid ${theme.palette.blue.bright}`,
          }}
          role="region"
          aria-label={`Current scenario performance distribution for ${outcome}`}
        >
          <Typography
            variant="dashboard"
            sx={{ fontWeight: theme.typography.fontWeightMedium, mb: theme.space.gap.sm }}
          >
            {scenarioLabel}:
          </Typography>
          <Typography
            variant="dashboard"
            sx={{ fontSize: "0.85em", color: theme.palette.grey[600], mb: theme.space.gap.sm }}
          >
            Distribution across locations:
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {chartData.map((tier, index) => {
              const percentage = Math.round(tier.value * 100)
              return (
                <Box
                  key={tier.label}
                  sx={{ display: "flex", alignItems: "center", gap: theme.space.gap.sm }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: theme.borderRadius.xs,
                      backgroundColor: tier.color,
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="dashboard" sx={{ minWidth: "85px" }}>
                    {tierLevelNames[index]}:
                  </Typography>
                  <Typography variant="dashboard" sx={{ fontWeight: theme.typography.fontWeightMedium }}>
                    {percentage}%
                  </Typography>
                </Box>
              )
            })}
          </Box>
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: theme.space.gap.sm,
        }}
      >
        <Typography variant="tooltipHeader">Outcome levels:</Typography>

        {[1, 2, 3, 4].map((tierNum) => {
          const isCurrentTier = currentTier === tierNum
          return (
            <Box
              key={tierNum}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: theme.space.gap.sm,
                // Highlight the current scenario's tier
                ...(isCurrentTier && {
                  backgroundColor: `${theme.palette.tiers[`tier${tierNum}` as keyof typeof theme.palette.tiers]}15`,
                  borderRadius: theme.borderRadius.xs,
                  p: theme.space.component.xs,
                  mx: `-${theme.space.component.xs}`,
                }),
              }}
              // Help screen readers identify the current tier
              aria-current={isCurrentTier ? "true" : undefined}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: theme.borderRadius.xs,
                  backgroundColor:
                    theme.palette.tiers[
                      `tier${tierNum}` as keyof typeof theme.palette.tiers
                    ],
                  flexShrink: 0,
                  mt: "3px", // Align with first line of text
                  // Add ring around current tier
                  ...(isCurrentTier && {
                    outline: `2px solid ${theme.palette.tiers[`tier${tierNum}` as keyof typeof theme.palette.tiers]}`,
                    outlineOffset: "2px",
                  }),
                }}
              />
              <Typography variant="dashboard" component="span">
                {isCurrentTier && (
                  <Box
                    component="span"
                    sx={{
                      display: "inline-block",
                      mr: 0.5,
                      fontWeight: theme.typography.fontWeightBold,
                    }}
                    aria-hidden="true"
                  >
                    &rarr;
                  </Box>
                )}
                {formatTierText(
                  (
                    outcomeTierValues as Record<
                      string,
                      {
                        tier1: string
                        tier2: string
                        tier3: string
                        tier4: string
                      }
                    >
                  )[outcome]?.[
                    `tier${tierNum}` as "tier1" | "tier2" | "tier3" | "tier4"
                  ] ||
                    ["Excellent", "Good", "Fair", "Poor"][tierNum - 1] ||
                    "",
                  theme.typography.fontWeightMedium as number,
                )}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
