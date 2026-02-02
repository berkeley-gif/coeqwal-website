"use client"

/**
 * ChartGridContext - Unified layout system for comparison charts
 *
 * Provides a CSS Grid-based layout with a React context for sharing
 * layout measurements. This ensures:
 * - Perfect vertical alignment between headers and all chart types
 * - Dynamic chart sizing based on available space
 * - Consistent aspect ratios
 * - Native responsiveness via CSS Grid
 */

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from "react"

// Layout constants - single source of truth
export const CHART_GRID = {
  /** Width of the left label column in pixels */
  labelColumnWidth: 100,
  /** Minimum width per scenario cell (prevents illegible charts) */
  minCellWidth: 120,
  /** Maximum width per scenario cell (prevents elongated charts) */
  maxCellWidth: 250,
  /** Vertical gap between grid rows */
  rowGap: 16,
  /** Vertical padding within each row */
  rowPaddingY: 8,
}

// Chart sizing constraints
export const CHART_SIZING = {
  /** Minimum chart size for legibility */
  minSize: 60,
  /** Maximum chart size */
  maxSize: 120,
  /** Default size when container width unknown */
  defaultSize: 80,
  /** Chart uses this fraction of cell width */
  cellRatio: 0.75,
}

/**
 * Layout measurements provided by the context
 */
export interface ChartGridLayout {
  /** Total container width in pixels */
  containerWidth: number
  /** Actual cell width (clamped between min/max) */
  cellWidth: number
  /** Recommended chart size based on cell width */
  chartSize: number
  /** Number of scenarios in the grid */
  scenarioCount: number
}

const ChartGridContext = createContext<ChartGridLayout | null>(null)

/**
 * Hook to access grid layout measurements from any child component
 *
 * @returns Layout measurements or null if outside provider
 *
 * @example
 * ```tsx
 * function ChartCell() {
 *   const layout = useChartGridLayout()
 *   const size = layout?.chartSize ?? CHART_SIZING.defaultSize
 *   return <VerticalBarChart size={size} />
 * }
 * ```
 */
export function useChartGridLayout(): ChartGridLayout | null {
  return useContext(ChartGridContext)
}

interface ChartGridProviderProps {
  /** Scenario IDs to create columns for */
  scenarios: string[]
  /** Child components to render within the grid */
  children: ReactNode
}

/**
 * Provider component that creates a CSS Grid layout and provides
 * measurements via context.
 *
 * The grid structure is:
 * - Column 1: Fixed-width label column (100px)
 * - Columns 2-N: Scenario columns with minmax constraints
 *
 * @example
 * ```tsx
 * <ChartGridProvider scenarios={selectedScenarios}>
 *   <ScenarioHeader scenarios={scenarios} scenarioNames={names} />
 *   <StorageTierRow scenarios={scenarios} />
 *   <MonthlyStorageSection scenarios={scenarios} />
 * </ChartGridProvider>
 * ```
 */
export function ChartGridProvider({
  scenarios,
  children,
}: ChartGridProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<ChartGridLayout | null>(null)

  useEffect(() => {
    const updateLayout = () => {
      if (!containerRef.current || scenarios.length === 0) return

      const containerWidth = containerRef.current.offsetWidth
      const availableWidth = containerWidth - CHART_GRID.labelColumnWidth
      const naturalCellWidth = availableWidth / scenarios.length

      // Clamp cell width between min and max
      const cellWidth = Math.max(
        CHART_GRID.minCellWidth,
        Math.min(CHART_GRID.maxCellWidth, naturalCellWidth),
      )

      // Calculate optimal chart size based on cell width
      const chartSize = Math.max(
        CHART_SIZING.minSize,
        Math.min(
          CHART_SIZING.maxSize,
          Math.floor(cellWidth * CHART_SIZING.cellRatio),
        ),
      )

      setLayout({
        containerWidth,
        cellWidth,
        chartSize,
        scenarioCount: scenarios.length,
      })
    }

    // Initial layout calculation
    updateLayout()

    // Update on resize
    const observer = new ResizeObserver(updateLayout)
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [scenarios.length])

  // CSS Grid template: fixed label column + equal-width scenario columns
  // Using 1fr ensures columns expand to fill available width evenly
  // Chart sizing is controlled via context (capped at maxSize)
  const gridTemplateColumns = `${CHART_GRID.labelColumnWidth}px repeat(${scenarios.length}, 1fr)`

  return (
    <ChartGridContext.Provider value={layout}>
      <div
        ref={containerRef}
        style={{
          display: "grid",
          gridTemplateColumns,
          gap: `${CHART_GRID.rowGap}px 0`,
          width: "100%",
        }}
      >
        {children}
      </div>
    </ChartGridContext.Provider>
  )
}
