"use client"

/**
 * Map pass-through layout for explore with map mode.
 * When the map is visible, root wrappers use pointer-events:none so
 * clicks fall through to Mapbox. Child tool areas opt back in.
 */

import { useMemo } from "react"
import { useTheme, type SxProps, type Theme } from "@repo/ui/mui"
import { useWorkspaceSlice } from "./store"

export type ExplorerMapLayout = {
  rootSx: SxProps<Theme>
  contentMiddleSx: SxProps<Theme>
  contentInnerSx: SxProps<Theme>
}

export function useExplorerMapLayout(): ExplorerMapLayout {
  const theme = useTheme()
  const showMap = useWorkspaceSlice((s) => s.showMap)

  const exploreBackground = theme.palette.explore.background
  const textPrimary = theme.palette.text.primary

  return useMemo(
    (): ExplorerMapLayout => ({
      rootSx: {
        display: "flex",
        flexDirection: "column",
        backgroundColor: showMap ? "transparent" : exploreBackground,
        color: textPrimary,
        pointerEvents: showMap ? "none" : "auto",
        height: "100%",
        overflow: "hidden",
      },
      contentMiddleSx: {
        display: "flex",
        flex: 1,
        overflow: "hidden",
        ...(!showMap && { pointerEvents: "auto" }),
      },
      contentInnerSx: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...(!showMap && { pointerEvents: "auto" }),
      },
    }),
    [showMap, exploreBackground, textPrimary],
  )
}
