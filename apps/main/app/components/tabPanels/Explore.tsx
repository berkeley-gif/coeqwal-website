/**
 * ExplorePanel - Explore tab content wrapper
 *
 * Renders the ScenarioExplorer component for the Explore tab.
 */

import { Box, useTheme } from "@repo/ui/mui"
import { ErrorBoundary } from "@repo/utils"
import { ErrorFallback } from "@repo/ui"
import ScenarioExplorer from "../../features/scenarioExplorer/ScenarioExplorer"

/**
 * ExplorerErrorFallback - Sized to match ScenarioExplorer dimensions
 *
 * The Explore tab has a fixed viewport height. The fallback needs to fill
 * the same space so the tab panel layout remains correct.
 */
function ExplorerErrorFallback() {
  const theme = useTheme()

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.palette.explore.background,
        pointerEvents: "auto",
      }}
    >
      <ErrorFallback
        title="Explorer couldn't load"
        message="This might be a temporary issue. Try refreshing the page."
      />
    </Box>
  )
}

export default function ExplorePanel() {
  return (
    <ErrorBoundary fallback={<ExplorerErrorFallback />}>
      <ScenarioExplorer />
    </ErrorBoundary>
  )
}
