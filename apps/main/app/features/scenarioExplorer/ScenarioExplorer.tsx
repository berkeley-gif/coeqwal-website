"use client"

/**
 * ScenarioExplorer - Explore tab tool area
 *
 * Please note that tool navigation (ExploreSubNav) has been lifted to the page shell so it
 * can be part of the sticky stacking alongside SmoothTabs. This
 * component renders the active view in the tool tab area.
 */

import { Box } from "@repo/ui/mui"

import {
  ExplorerToolView,
  useExplorerLifecycle,
  useExplorerMapLayout,
} from "./explorer"

export default function ScenarioExplorer() {
  useExplorerLifecycle()
  const layout = useExplorerMapLayout()

  return (
    <Box sx={layout.rootSx}>
      <Box sx={layout.contentMiddleSx}>
        <Box sx={layout.contentInnerSx}>
          <ExplorerToolView />
        </Box>
      </Box>
    </Box>
  )
}
