/**
 * ExplorePanel - Explore tab content wrapper
 *
 * Renders the ScenarioExplorer component for the Explore tab.
 */

import { ErrorBoundary } from "@repo/utils"
import { ErrorFallback } from "@repo/ui"
import ScenarioExplorer from "../../features/scenarioExplorer/ScenarioExplorer"

export default function ExplorePanel() {
  return (
    <ErrorBoundary
      fallback={
        <ErrorFallback
          title="Explorer couldn't load"
          message="This might be a temporary issue. Try refreshing the page."
        />
      }
    >
      <ScenarioExplorer />
    </ErrorBoundary>
  )
}
