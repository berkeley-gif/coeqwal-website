"use client"

/**
 * ScenarioExplorer - Explore tab tool area
 *
 * Please note that tool navigation (ExploreSubNav) has been lifted to the page shell so it
 * can be part of the sticky stacking alongside SmoothTabs. This
 * component renders the active view in the tool tab area.
 */

import { Box } from "@repo/ui/mui"
import { ErrorBoundary } from "@repo/utils"
import { ErrorFallback } from "@repo/ui"
import GetStartedView from "./getStarted/GetStartedView"
import {
  ExplorerToolView,
  useExplorerLifecycle,
  useExplorerMapLayout,
} from "./explorer"
import { useScenarioExplorerStore } from "./store"

export default function ScenarioExplorer() {
  useExplorerLifecycle()
  const layout = useExplorerMapLayout()
  const mainView = useScenarioExplorerStore((s) => s.mainView)

  return (
    <Box sx={layout.rootSx}>
      <Box sx={layout.contentMiddleSx}>
        <Box sx={layout.contentInnerSx}>
          {mainView === "get-started" && (
            <ErrorBoundary
              fallback={
                <ErrorFallback
                  title="Get started couldn't load"
                  message="This might be a temporary issue. Try refreshing the page or switch to the Tools sub-tab."
                />
              }
            >
              <GetStartedView />
            </ErrorBoundary>
          )}

          {mainView === "explorer" && <ExplorerToolView />}
        </Box>
      </Box>
    </Box>
  )
}
