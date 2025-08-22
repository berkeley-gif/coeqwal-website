import React from "react"
import { Box, Typography, Button, Divider } from "@repo/ui/mui"

interface SelectionHistoryPanelProps {
  selectedScenarios: string[]
  selectedRegion: string
  onClearSelections?: () => void
}

export function SelectionHistoryPanel({
  selectedScenarios,
  selectedRegion,
  onClearSelections,
}: SelectionHistoryPanelProps) {
  const scenarioLabels: Record<string, string> = {
    baseline: "Baseline Scenario",
    conservation: "Conservation Focus",
    infrastructure: "Infrastructure Investment",
    "climate-adaptation": "Climate Adaptation",
    groundwater: "Groundwater Management",
    ecosystem: "Ecosystem Restoration",
  }

  const regionLabels: Record<string, string> = {
    "sacramento-valley": "Sacramento Valley",
    "san-joaquin-valley": "San Joaquin Valley",
    delta: "Delta",
    "tulare-basin": "Tulare Basin",
    "central-valley": "Central Valley",
    "bay-area": "Bay Area",
  }

  const hasSelections = selectedScenarios.length > 0 || selectedRegion

  return (
    <Box sx={{ p: 2 }}>
      <Typography
        variant="h6"
        sx={{ mb: 2, color: (theme) => theme.palette.blue.darkest }}
      >
        Selection History
      </Typography>

      {!hasSelections ? (
        <Box
          sx={{
            textAlign: "center",
            py: 4,
            color: (theme) => theme.palette.text.secondary,
          }}
        >
          <Typography variant="body2">
            No selections made yet. Use the other tabs to select scenarios and
            regions.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Selected Scenarios */}
          {selectedScenarios.length > 0 && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1, color: (theme) => theme.palette.text.secondary }}
              >
                Selected Scenarios ({selectedScenarios.length})
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {selectedScenarios.map((scenarioId) => (
                  <Box
                    key={scenarioId}
                    sx={{
                      p: 1,
                      backgroundColor: (theme) => theme.palette.grey[50],
                      borderRadius: (theme) => theme.borderRadius.rounded,
                      border: "1px solid",
                      borderColor: (theme) => theme.palette.divider,
                    }}
                  >
                    <Typography variant="body2">
                      {scenarioLabels[scenarioId] || scenarioId}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Selected Region */}
          {selectedRegion && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1, color: (theme) => theme.palette.text.secondary }}
              >
                Selected Region
              </Typography>
              <Box
                sx={{
                  p: 1,
                  backgroundColor: (theme) => theme.palette.blue.bright + "10",
                  borderRadius: (theme) => theme.borderRadius.rounded,
                  border: "1px solid",
                  borderColor: (theme) => theme.palette.blue.medium,
                }}
              >
                <Typography variant="body2">
                  {regionLabels[selectedRegion] || selectedRegion}
                </Typography>
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 1 }} />

          {/* Actions */}
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              size="small"
              onClick={onClearSelections}
              sx={{
                textTransform: "none",
                borderColor: (theme) => theme.palette.divider,
                color: (theme) => theme.palette.text.secondary,
                "&:hover": {
                  borderColor: (theme) => theme.palette.text.secondary,
                },
              }}
            >
              Clear All
            </Button>
            <Button
              variant="contained"
              size="small"
              sx={{
                textTransform: "none",
                backgroundColor: (theme) => theme.palette.blue.bright,
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.blue.medium,
                },
              }}
            >
              Apply Selection
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  )
}
