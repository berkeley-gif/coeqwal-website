"use client"

/**
 * HowToReadChartModal. Renders the per-tool "How to read this chart"
 * body in a MobileModal. Content is keyed off the current exploreMode.
 *
 * Modal open state is owned by the caller (ToolToolbar) so the trigger
 * and the modal can share it without a store entry.
 */

import React from "react"
import { useTheme } from "@repo/ui/mui"
import { MobileModal } from "@repo/ui"
import type { ExploreMode } from "../store"
import {
  ResilienceHowToRead,
  RadarHowToRead,
  ListHowToRead,
  ComparisonHowToRead,
  EquityHowToRead,
  DataHowToRead,
} from "./howToReadContent"

interface HowToReadChartModalProps {
  open: boolean
  onClose: () => void
  exploreMode: ExploreMode
}

const EXPLORE_MODE_READABLE_NAME: Record<ExploreMode, string> = {
  list: "the list view",
  radar: "the radar chart",
  equity: "the equity view",
  comparison: "the comparison view",
  resilience: "the resilience heatmap",
  data: "the data view",
}

function getBody(mode: ExploreMode) {
  switch (mode) {
    case "resilience":
      return <ResilienceHowToRead />
    case "radar":
      return <RadarHowToRead />
    case "list":
      return <ListHowToRead />
    case "comparison":
      return <ComparisonHowToRead />
    case "equity":
      return <EquityHowToRead />
    case "data":
      return <DataHowToRead />
    default: {
      const _exhaustive: never = mode
      return _exhaustive
    }
  }
}

export function HowToReadChartModal({
  open,
  onClose,
  exploreMode,
}: HowToReadChartModalProps) {
  const theme = useTheme()
  const title = `How to read ${EXPLORE_MODE_READABLE_NAME[exploreMode]}`

  return (
    <MobileModal
      open={open}
      onClose={onClose}
      title={title}
      titleId="how-to-read-chart-title"
      maxWidth="min(1100px, 95vw)"
      maxHeight="95vh"
      height="95vh"
      zIndex={theme.zIndex.floating}
      contentAriaLabel={title}
    >
      {getBody(exploreMode)}
    </MobileModal>
  )
}

export default HowToReadChartModal
