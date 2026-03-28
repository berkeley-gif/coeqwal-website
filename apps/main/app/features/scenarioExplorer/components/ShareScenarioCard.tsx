"use client"

import React from "react"
import { Box, Typography, IconButton, useTheme, icons } from "@repo/ui/mui"
import { OutcomeGlyphItem } from "../../scenarios/components/shared/OutcomeGlyphItem"
import type { ChartDataPoint } from "../../scenarios/components/shared/types"

interface ShareScenarioCardProps {
  scenarioId: string
  name: string
  description: string
  chartData?: Record<string, ChartDataPoint[]>
  outcomeNames: { shortCode: string; displayName: string }[]
  onRemove?: (id: string) => void
}

export default function ShareScenarioCard({
  scenarioId,
  name,
  description,
  chartData,
  outcomeNames,
  onRemove,
}: ShareScenarioCardProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        position: "relative",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.borderRadius.sm ?? "6px",
        backgroundColor: theme.palette.background.paper,
        p: 1.5,
        mb: 1,
      }}
    >
      {/* Remove button */}
      {onRemove && (
        <IconButton
          size="small"
          onClick={() => onRemove(scenarioId)}
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            p: 0.25,
            color: theme.palette.grey[400],
            "&:hover": { color: theme.palette.grey[700] },
          }}
        >
          <icons.Close sx={{ fontSize: "0.875rem" }} />
        </IconButton>
      )}

      {/* Scenario name */}
      <Typography
        sx={{
          fontSize: "0.8125rem",
          fontWeight: 600,
          lineHeight: 1.3,
          color: theme.palette.text.primary,
          pr: onRemove ? 2.5 : 0,
        }}
      >
        {name}
      </Typography>

      {/* Short description */}
      {description && (
        <Typography
          sx={{
            fontSize: "0.6875rem",
            lineHeight: 1.3,
            color: theme.palette.grey[500],
            mt: 0.25,
          }}
        >
          {description}
        </Typography>
      )}

      {/* Outcome glyphs */}
      {chartData && outcomeNames.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.25,
            mt: 1,
            justifyContent: "center",
          }}
        >
          {outcomeNames.map(({ shortCode, displayName }) => {
            const data = chartData[shortCode]
            return (
              <OutcomeGlyphItem
                key={shortCode}
                displayName={displayName}
                name={shortCode}
                chartData={data}
                isActive={!!data && data.length > 0}
                size={36}
                showLabel={true}
                showInfoButton={false}
                showSortButton={false}
              />
            )
          })}
        </Box>
      )}
    </Box>
  )
}
