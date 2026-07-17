"use client"

/**
 * SpillMatrix - Grid layout of SpillCharts for reservoir x scenario comparison
 *
 * Rows = reservoirs (labeled on left)
 * Columns = scenarios
 * Each cell = one SpillChart rendered as SVG
 *
 * Uses CSS Grid for the overall layout with SVG SpillCharts in each cell.
 * Responsive: cells resize based on available container width.
 */

import React, { useRef, useState, useEffect } from "react"
import { useResizeObserver } from "../hooks/useResizeObserver"
import SpillChart from "./SpillChart"
import type { MonthlySpillData } from "./SpillChart"

export interface SpillMatrixProps {
  /** Array of reservoir metadata (rows) */
  reservoirs: Array<{ reservoirId: string; reservoirName: string }>
  /** Array of scenario IDs (columns) */
  scenarios: string[]
  /** Map of scenario ID to display name */
  scenarioNames?: Record<string, string>
  /** Data: reservoirId -> scenarioId -> monthly spill data */
  data: Record<string, Record<string, MonthlySpillData | undefined>>
  /** Enable responsive sizing (default: true) */
  responsive?: boolean
  /** Whether to show scenario headers in top row (default: true) */
  showScenarioHeaders?: boolean
  /** Width of the left label column in pixels (default: 120) */
  labelColumnWidth?: number
  /** Scenario IDs that are still loading data (shows spinner in empty cells) */
  loadingScenarios?: string[]
  /**
   * Whether each cell renders the spill-magnitude (CFS) panel. Defaults to
   * true. Set false when magnitude data is not populated so cells show
   * frequency only. Forwarded to SpillChart.
   */
  showMagnitude?: boolean
}

// Styling constants (matching PercentileMatrix aesthetic)
const COLORS = {
  text: "#5a6c7a",
  header: "#3d5a6c",
  grid: "#e8edf0",
  gridStrong: "#d0d8dd",
  headerBg: "#f5f7f9",
}

const CELL_ASPECT_RATIO = 0.8 // height = width * 0.8

const SpillMatrix: React.FC<SpillMatrixProps> = React.memo(
  ({
    reservoirs,
    scenarios,
    scenarioNames,
    data,
    responsive = true,
    showScenarioHeaders = true,
    labelColumnWidth = 120,
    loadingScenarios,
    showMagnitude = true,
  }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const dimensions = useResizeObserver(
      containerRef as React.RefObject<HTMLElement>,
    )

    const [cellWidth, setCellWidth] = useState(200)

    useEffect(() => {
      if (responsive && dimensions && dimensions.width > 0) {
        const availableWidth = dimensions.width - labelColumnWidth
        const newCellWidth = Math.max(
          80,
          Math.floor(availableWidth / scenarios.length),
        )
        setCellWidth(newCellWidth)
      }
    }, [responsive, dimensions, labelColumnWidth, scenarios.length])

    const cellHeight = Math.round(cellWidth * CELL_ASPECT_RATIO)

    if (reservoirs.length === 0 || scenarios.length === 0) {
      return <div ref={containerRef} style={{ width: "100%" }} />
    }

    // CSS Grid template
    const gridTemplateColumns = `${labelColumnWidth}px repeat(${scenarios.length}, 1fr)`

    return (
      <div ref={containerRef} style={{ width: "100%" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns,
            width: "100%",
          }}
        >
          {/* ============ HEADER ROW ============ */}
          {showScenarioHeaders && (
            <>
              {/* Empty cell for label column */}
              <div />

              {/* Scenario headers */}
              {scenarios.map((scenarioId) => (
                <div
                  key={`header-${scenarioId}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "6px 4px",
                    borderBottom: `1px solid ${COLORS.gridStrong}`,
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontFamily: "'Inter', -apple-system, sans-serif",
                      fontWeight: 600,
                      color: COLORS.header,
                      textAlign: "center",
                      lineHeight: 1.2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "100%",
                    }}
                  >
                    {scenarioNames?.[scenarioId] ?? scenarioId}
                  </span>
                </div>
              ))}
            </>
          )}

          {/* ============ DATA ROWS ============ */}
          {reservoirs.map((reservoir) => (
            <React.Fragment key={`row-${reservoir.reservoirId}`}>
              {/* Row label */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "4px 8px 4px 0",
                  borderBottom: `1px solid ${COLORS.gridStrong}`,
                  borderTop: `1px solid ${COLORS.grid}`,
                  minHeight: cellHeight,
                }}
              >
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontFamily: "'Inter', -apple-system, sans-serif",
                    fontWeight: 600,
                    color: COLORS.header,
                    lineHeight: 1.2,
                    whiteSpace: "pre-line",
                  }}
                >
                  {reservoir.reservoirName}
                </span>
              </div>

              {/* Cells */}
              {scenarios.map((scenarioId) => {
                const monthlyData = data[reservoir.reservoirId]?.[scenarioId]

                return (
                  <div
                    key={`cell-${reservoir.reservoirId}-${scenarioId}`}
                    style={{
                      borderBottom: `1px solid ${COLORS.gridStrong}`,
                      borderTop: `1px solid ${COLORS.grid}`,
                      borderLeft: `1px solid ${COLORS.grid}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: cellHeight,
                    }}
                  >
                    {monthlyData ? (
                      <SpillChart
                        data={monthlyData}
                        width={cellWidth}
                        height={cellHeight}
                        showMagnitude={showMagnitude}
                      />
                    ) : loadingScenarios?.includes(scenarioId) ? (
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        style={{ opacity: 0.5 }}
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="8"
                          fill="none"
                          stroke={COLORS.gridStrong}
                          strokeWidth="2"
                          strokeDasharray="12 38"
                          strokeLinecap="round"
                        >
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 12 12"
                            to="360 12 12"
                            dur="1s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      </svg>
                    ) : (
                      <span
                        style={{
                          fontSize: "10px",
                          fontFamily: "'Inter', -apple-system, sans-serif",
                          color: COLORS.text,
                          fontStyle: "italic",
                        }}
                      >
                        No data
                      </span>
                    )}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    )
  },
)

SpillMatrix.displayName = "SpillMatrix"

export default SpillMatrix
