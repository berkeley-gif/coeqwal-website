"use client"

/**
 * ViewModeControls - Hydroclimate chooser for explorer toolbar
 *
 * View mode buttons (list/map/comparison) have been moved inline
 * into the "Choose scenarios" tab header in ScenarioExplorer.
 */

import { Box, useTheme } from "@repo/ui/mui"
import { HydroclimateChooser } from "../../scenarios/components"

function Divider() {
  const theme = useTheme()
  return (
    <Box
      sx={{
        width: "1px",
        alignSelf: "stretch",
        backgroundColor: theme.palette.grey[300],
        minHeight: theme.spacing(5),
      }}
    />
  )
}

export function ViewModeControls() {
  return (
    <>
      {/* Divider - hidden under 700px when layout is stacked */}
      <Box
        sx={{
          display: "none",
          "@media (min-width: 700px)": {
            display: "contents",
          },
        }}
      >
        <Divider />
      </Box>

      {/* Hydroclimate chooser */}
      <HydroclimateChooser
        layout="horizontal"
        showTitle={true}
        showLabels={false}
      />
    </>
  )
}
