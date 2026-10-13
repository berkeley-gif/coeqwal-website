"use client"

/**
 * SelectScenarioPrompt - the centered sentence a sidebar tool shows in place
 * of its chart while no scenario is selected. When to show it is decided by
 * `needsScenarioPrompt` in ./scenarioPrompt.ts; this component only renders.
 */

import { Box, Typography, useTheme } from "@repo/ui/mui"

export interface SelectScenarioPromptProps {
  /** One sentence telling the user what to select and where */
  message: string
}

export default function SelectScenarioPrompt({
  message,
}: SelectScenarioPromptProps) {
  const theme = useTheme()
  return (
    <Box
      role="status"
      data-select-scenario-prompt=""
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
        p: theme.space.component.xl,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: theme.palette.grey[600],
          textAlign: "center",
          maxWidth: 420,
        }}
      >
        {message}
      </Typography>
    </Box>
  )
}
