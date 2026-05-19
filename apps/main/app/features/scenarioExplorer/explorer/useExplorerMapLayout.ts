"use client"

/**
 * Map pass-through layout for get-started and explore with map mode.
 * When the map is visible, root wrappers use pointer-events:none so
 * clicks fall through to Mapbox. Child tool areas opt back in.
 */

import { useMemo } from "react"
import { useTheme, type SxProps, type Theme } from "@repo/ui/mui"
import { useMapMode } from "../../map/store"
import { useScenarioExplorerStore } from "../store"
import { useWorkspaceSlice } from "./store"

export type ExplorerMapLayout = {
  rootSx: SxProps<Theme>
  contentMiddleSx: SxProps<Theme>
  contentInnerSx: SxProps<Theme>
}

export function useExplorerMapLayout(): ExplorerMapLayout {
  const theme = useTheme()
  const mainView = useScenarioExplorerStore((s) => s.mainView)
  const showMap = useWorkspaceSlice((s) => s.showMap)
  const mapMode = useMapMode()

  const isGetStartedMapMode =
    mainView === "get-started" && mapMode === "get-started"
  const isExploreMapMode = mainView === "explorer" && showMap
  const needsTransparentBg = isGetStartedMapMode || isExploreMapMode
  const isMapPassThrough = isGetStartedMapMode || isExploreMapMode

  const exploreBackground = theme.palette.explore.background
  const textPrimary = theme.palette.text.primary

  return useMemo(
    (): ExplorerMapLayout => ({
      rootSx: {
        display: "flex",
        flexDirection: "column",
        backgroundColor: needsTransparentBg ? "transparent" : exploreBackground,
        color: textPrimary,
        pointerEvents: isMapPassThrough ? "none" : "auto",
        ...(isGetStartedMapMode ? {} : { height: "100%", overflow: "hidden" }),
      },
      contentMiddleSx: {
        display: "flex",
        flex: 1,
        ...(isGetStartedMapMode ? {} : { overflow: "hidden" }),
        ...(!isMapPassThrough && { pointerEvents: "auto" }),
      },
      contentInnerSx: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        ...(isGetStartedMapMode ? {} : { overflow: "hidden" }),
        ...(!isMapPassThrough && { pointerEvents: "auto" }),
      },
    }),
    [
      needsTransparentBg,
      exploreBackground,
      textPrimary,
      isMapPassThrough,
      isGetStartedMapMode,
    ],
  )
}
