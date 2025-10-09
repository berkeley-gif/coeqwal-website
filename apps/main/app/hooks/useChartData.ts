// LEGACY: This hook was used for the old ScenarioExplorer with dummy data
// in the interactive parallel line chart.
// Currently not used in ScenarioExplorer3

import { useCallback } from "react"
import { VerticalParallelLineData } from "@repo/viz"

// Types
interface UseChartDataOptions {
  highlightBaseline: boolean
  expandChart: boolean
  defineOutcome: boolean
  overlayTiers: boolean
  onLineClick?: (data: VerticalParallelLineData) => void
}

interface ChartDataReturn {
  props: {
    data: VerticalParallelLineData[]
    axes: string[]
    baselineData: VerticalParallelLineData | undefined
    colors: {
      default: string
      highlighted: string
      background: string
    }
    lineColors: string[]
    responsive: boolean
    showBaseline: boolean
    onLineHover: () => void
    onLineClick: (data: VerticalParallelLineData) => void
  }
  key: string
}

// Constants
const CHART_AXES = [
  "Community deliveries",
  "Agricultural revenue",
  "Environmental flows",
  "Delta estuary status",
  "Delta exports",
  "Reservoir storage",
  "Groundwater storage",
  "Salmon abundance",
] as const


const CHART_COLORS = {
  default: "#1f77b4",
  highlighted: "#ff7f0e",
  background: "#f8f9fa",
} as const

const CATEGORICAL_COLORS = [
  "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
  "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
] as const


export function useChartData({
  highlightBaseline,
  expandChart,
  defineOutcome,
  overlayTiers,
  onLineClick,
}: UseChartDataOptions): ChartDataReturn {
  // Handlers
  const handleLineHover = useCallback(() => {
    // Legacy hover handler
  }, [])

  const handleLineClick = useCallback((data: VerticalParallelLineData) => {
    onLineClick?.(data)
  }, [onLineClick])

  // Legacy baseline data
  const baselineData: VerticalParallelLineData = {
    id: "baseline",
    name: "Current Operations",
    values: Object.fromEntries(CHART_AXES.map(axis => [axis, 0.0])),
    highlighted: highlightBaseline,
  }

  return {
    props: {
      data: [baselineData], // Legacy baseline data for old ScenarioExplorer
      axes: [...CHART_AXES],
      baselineData,
      colors: CHART_COLORS,
      lineColors: [...CATEGORICAL_COLORS],
      responsive: expandChart,
      showBaseline: highlightBaseline,
      onLineHover: handleLineHover,
      onLineClick: handleLineClick,
    },
    key: `${highlightBaseline}-${expandChart}-${defineOutcome}-${overlayTiers}`,
  }
}