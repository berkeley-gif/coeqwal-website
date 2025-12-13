"use client"

import React from "react"
import { Box, Typography, Chip, useTheme } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "@repo/state/scenarioExplorer"

/**
 * Mini-breadcrumbs showing current selections
 * Persists across all views in ScenarioExplorer
 */
export default function Breadcrumbs() {
  const theme = useTheme()
  const { selectedScenarios, selectedOutcomes, clearScenarios, clearOutcomes } =
    useScenarioExplorerStore()

  if (selectedScenarios.length === 0 && selectedOutcomes.length === 0) {
    return null
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2),
        px: theme.spacing(theme.cards.spacing.standard),
        py: theme.spacing(1),
        backgroundColor: theme.palette.grey[50],
        borderBottom: theme.border.standard,
        borderColor: theme.palette.grey[300],
        flexWrap: "wrap",
      }}
    >
      {selectedScenarios.length > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: theme.typography.fontWeightMedium,
              color: theme.palette.text.primary,
            }}
          >
            Scenarios:
          </Typography>
          {selectedScenarios.map((scenario) => (
            <Chip
              key={scenario}
              label={scenario}
              size="small"
              onDelete={() => {
                // TODO: Remove individual scenario
              }}
              sx={{
                backgroundColor: theme.palette.common.white,
                borderRadius: theme.borderRadius.pill,
              }}
            />
          ))}
          <Typography
            component="button"
            variant="body2"
            onClick={clearScenarios}
            sx={{
              color: theme.palette.blue.bright,
              cursor: "pointer",
              background: "none",
              border: "none",
              padding: 0,
              textDecoration: "underline",
              fontSize: theme.typography.caption.fontSize,
              "&:hover": {
                color: theme.palette.blue.darkest,
              },
            }}
          >
            Clear all
          </Typography>
        </Box>
      )}

      {selectedOutcomes.length > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: theme.typography.fontWeightMedium,
              color: theme.palette.text.primary,
            }}
          >
            Outcomes:
          </Typography>
          {selectedOutcomes.map((outcome) => (
            <Chip
              key={outcome}
              label={outcome}
              size="small"
              onDelete={() => {
                // TODO: Remove individual outcome
              }}
              sx={{
                backgroundColor: theme.palette.common.white,
                borderRadius: theme.borderRadius.pill,
              }}
            />
          ))}
          <Typography
            component="button"
            variant="body2"
            onClick={clearOutcomes}
            sx={{
              color: theme.palette.blue.bright,
              cursor: "pointer",
              background: "none",
              border: "none",
              padding: 0,
              textDecoration: "underline",
              fontSize: theme.typography.caption.fontSize,
              "&:hover": {
                color: theme.palette.blue.darkest,
              },
            }}
          >
            Clear all
          </Typography>
        </Box>
      )}
    </Box>
  )
}
