import React from "react"
import { Box, Typography, Checkbox, FormControlLabel } from "@repo/ui/mui"

interface SelectScenariosPanelProps {
  selectedScenarios: string[]
  onScenarioSelect: (scenario: string) => void
  onScenarioHover?: (scenario: string | null) => void
}

export function SelectScenariosPanel({
  selectedScenarios,
  onScenarioSelect,
  onScenarioHover,
}: SelectScenariosPanelProps) {
  const scenarios = [
    { id: "baseline", label: "Baseline Scenario", description: "Current water management practices" },
    { id: "conservation", label: "Conservation Focus", description: "Increased water conservation measures" },
    { id: "infrastructure", label: "Infrastructure Investment", description: "Major infrastructure improvements" },
    { id: "climate-adaptation", label: "Climate Adaptation", description: "Climate-resilient water management" },
    { id: "groundwater", label: "Groundwater Management", description: "Enhanced groundwater sustainability" },
    { id: "ecosystem", label: "Ecosystem Restoration", description: "Environmental flow priorities" },
  ]

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, color: (theme) => theme.palette.blue.darkest }}>
        Select Water Management Scenarios
      </Typography>
      
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {scenarios.map((scenario) => (
          <Box
            key={scenario.id}
            onMouseEnter={() => onScenarioHover?.(scenario.id)}
            onMouseLeave={() => onScenarioHover?.(null)}
            sx={{
              p: 1.5,
              border: "1px solid",
              borderColor: (theme) => theme.palette.divider,
              borderRadius: (theme) => theme.borderRadius.rounded,
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: (theme) => theme.palette.blue.medium,
                backgroundColor: (theme) => theme.palette.blue.bright + "05",
              },
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={selectedScenarios.includes(scenario.id)}
                  onChange={() => onScenarioSelect(scenario.id)}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {scenario.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: (theme) => theme.palette.text.secondary }}>
                    {scenario.description}
                  </Typography>
                </Box>
              }
              sx={{ margin: 0, width: "100%" }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  )
}
