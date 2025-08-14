import { useMemo, useCallback } from "react"
import { VerticalParallelLineData } from "@repo/viz"

interface UseChartDataOptions {
  highlightBaseline: boolean
  expandChart: boolean
}

interface ChartHandlers {
  onLineHover: (data: VerticalParallelLineData | null) => void
  onLineClick: (data: VerticalParallelLineData) => void
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
    onLineHover: (data: VerticalParallelLineData | null) => void
    onLineClick: (data: VerticalParallelLineData) => void
  }
  key: string
}

/**
 * Custom hook that encapsulates all chart data generation and optimization logic.
 * This prevents the need for manual useCallback/useMemo scattered throughout components.
 */
export const useChartData = ({
  highlightBaseline,
  expandChart,
}: UseChartDataOptions): ChartDataReturn => {
  // Memoized axes configuration
  const axes = useMemo(
    () => [
      "Community deliveries",
      "Agricultural deliveries",
      "Environmental deliveries",
      "Reservoir storage",
      "Groundwater storage",
      "Delta salinity",
      "Salmon abundance",
      "Distributional equity",
    ],
    [],
  )

  // Memoized scenario generation function
  const generateScenarios = useCallback((): VerticalParallelLineData[] => {
    const scenarios: VerticalParallelLineData[] = []

    // Baseline scenario (always first)
    scenarios.push({
      id: "baseline",
      name: "Current Operations",
      values: {
        "Community deliveries": 0.0,
        "Agricultural deliveries": 0.0,
        "Environmental deliveries": 0.0,
        "Reservoir storage": 0.0,
        "Groundwater storage": 0.0,
        "Delta salinity": 0.0,
        "Salmon abundance": 0.0,
        "Distributional equity": 0.0,
      },
      highlighted: highlightBaseline,
    })

    // Generate additional scenarios with varied data
    const scenarioNames = [
      "SGMA San Joaquin Valley",
      "SGMA Sacramento Valley",
      "SGMA Delta",
      "SGMA Tulare Basin",
      "Delta Conveyance Tunnel",
      "Delta Conveyance Dual",
      "Sites Reservoir",
      "Temperance Flat",
      "USBR Alternative 1",
      "USBR Alternative 2",
      "USBR Alternative 3",
      "USBR Alternative 4",
      "Urban Conservation High",
      "Urban Conservation Medium",
      "Agricultural Efficiency",
      "Recycled Water Expansion",
      "Desalination Coastal",
      "Atmospheric River Management",
      "Floodplain Restoration",
      "Wetlands Enhancement",
      "Fish Passage Improvement",
      "Climate Adaptation A",
      "Climate Adaptation B",
      "Drought Contingency",
      "Flexible Operations",
      "Coordinated Operations",
      "Ecosystem Services",
      "Water Trading Enhanced",
      "Regional Cooperation",
    ]

    scenarioNames.forEach((name, index) => {
      // Create varied but realistic data patterns
      const baseVariation = (index + 1) / 29 // 0 to 1 progression
      const randomSeed = index * 7 // Consistent randomization

      scenarios.push({
        id: `scenario-${index + 1}`,
        name: name,
        values: {
          "Community deliveries":
            Math.sin(baseVariation * Math.PI * 2 + randomSeed) * 0.8,
          "Agricultural deliveries":
            Math.cos(baseVariation * Math.PI * 1.5 + randomSeed) * 0.9,
          "Environmental deliveries":
            Math.sin(baseVariation * Math.PI * 3 + randomSeed + 1) * 0.7,
          "Reservoir storage":
            Math.cos(baseVariation * Math.PI * 2.5 + randomSeed + 2) * 0.6,
          "Groundwater storage":
            Math.sin(baseVariation * Math.PI * 1.8 + randomSeed + 3) * 0.9,
          "Delta salinity":
            Math.cos(baseVariation * Math.PI * 2.2 + randomSeed + 4) * 0.5,
          "Salmon abundance":
            Math.sin(baseVariation * Math.PI * 2.8 + randomSeed + 5) * 0.8,
          "Distributional equity":
            Math.cos(baseVariation * Math.PI * 1.6 + randomSeed + 6) * 0.6,
        },
      })
    })

    return scenarios
  }, [highlightBaseline])

  // Memoized chart data
  const sampleData = useMemo(() => generateScenarios(), [generateScenarios])

  // Memoized color configurations
  const categoricalColors = useMemo(() => {
    const categorical10 = [
      "#1f77b4",
      "#ff7f0e",
      "#2ca02c",
      "#d62728",
      "#9467bd",
      "#8c564b",
      "#e377c2",
      "#7f7f7f",
      "#bcbd22",
      "#17becf",
    ]

    const colors: string[] = []
    for (let i = 0; i < 30; i++) {
      colors.push(categorical10[i % 10]!)
    }

    return colors
  }, [])

  const chartColors = useMemo(
    () => ({
      default: "#1f77b4",
      highlighted: "#ff7f0e",
      background: "#f8f9fa",
    }),
    [],
  )

  // Memoized baseline data
  const baselineData = useMemo(
    () => sampleData.find((d) => d.id === "baseline"),
    [sampleData],
  )

  // Memoized event handlers
  const handlers: ChartHandlers = useMemo(
    () => ({
      onLineHover: (data: VerticalParallelLineData | null) => {
        console.log("Line hovered:", data?.name || "none")
      },
      onLineClick: (data: VerticalParallelLineData) => {
        console.log("Line clicked:", data.name)
      },
    }),
    [],
  )

  // Return chart props and key separately (React doesn't allow key in spread)
  return useMemo(
    () => ({
      // Chart props (can be spread)
      props: {
        // Chart data
        data: sampleData,
        axes,
        baselineData,

        // Chart styling
        colors: chartColors,
        lineColors: categoricalColors,

        // Chart behavior
        responsive: true,
        showBaseline: highlightBaseline,

        // Event handlers
        ...handlers,
      },

      // Key must be passed separately
      key: `chart-${expandChart ? "expanded" : "normal"}`,
    }),
    [
      sampleData,
      axes,
      baselineData,
      chartColors,
      categoricalColors,
      expandChart,
      highlightBaseline,
      handlers,
    ],
  )
}
