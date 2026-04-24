"use client"

import React, { useMemo } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { OutcomeGlyphItem } from "../../scenarios/components/shared/OutcomeGlyphItem"
import type { ChartDataPoint } from "../../scenarios/components/shared/types"
import TourTierLegend from "./TourTierLegend"

/**
 * List tour: top visual block for the bar step.
 *
 * Swiss International Typographic Style layout. One framed block with a
 * 2-column grid: sample bar cell on the left, tier legend on the right,
 * separated by a single hairline rule. Small caption eyebrows sit above
 * each column on a shared baseline so the two halves align as a unit.
 * The explanatory paragraph is rendered below this block by ToolTour.
 */
export default function ListTourBarIllustration() {
  const theme = useTheme()

  const chartData = useMemo((): ChartDataPoint[] => {
    const t = theme.palette.tiers
    return [
      { label: "Tier 1", color: t.tier1, value: 35, tierType: "multi_value" },
      { label: "Tier 2", color: t.tier2, value: 28, tierType: "multi_value" },
      { label: "Tier 3", color: t.tier3, value: 22, tierType: "multi_value" },
      { label: "Tier 4", color: t.tier4, value: 15, tierType: "multi_value" },
    ]
  }, [theme])

  const eyebrowSx = {
    display: "block",
    color: theme.palette.grey[700],
    fontSize: "0.6875rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    lineHeight: 1,
  }

  const panelBg = "#faf8f5"
  const ruleColor = theme.palette.divider

  return (
    <Box
      component="figure"
      sx={{
        m: 0,
        border: `1px solid ${ruleColor}`,
        borderRadius: 1.5,
        bgcolor: panelBg,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          columnGap: 0,
          alignItems: "stretch",
        }}
      >
        <Box
          sx={{
            p: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            borderRight: `1px solid ${ruleColor}`,
          }}
        >
          <Typography component="span" sx={eyebrowSx}>
            Bar chart
          </Typography>
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 72,
            }}
          >
            <OutcomeGlyphItem
              displayName="Key outcome (example)"
              name="DEMO"
              chartData={chartData}
              isActive
              morphEnabled
              size={60}
              showLabel={false}
              showInfoButton={false}
              showSortButton={false}
            />
          </Box>
        </Box>
        <Box
          sx={{
            p: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Typography component="span" sx={eyebrowSx}>
            Tiers
          </Typography>
          <TourTierLegend bare compact />
        </Box>
      </Box>
    </Box>
  )
}
