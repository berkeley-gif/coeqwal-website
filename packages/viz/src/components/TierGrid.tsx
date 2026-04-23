import React, { useRef, useEffect, useCallback, useMemo, useState } from "react"
import * as d3 from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"

// ============================================================================
// Types
// ============================================================================

export interface CategoryLayout {
  category: string
  width: number
  startX: number
}

export interface Objective {
  id: number
  tier: string
  baselineTier: string
  category: string
  locationId: string
  locationName: string
  tierLevel: number
  tierCode: string // Optional: tier/outcome code for coordinate lookup
}

export interface Position {
  id: number | string
  x: number
  y: number
  width: number
  height: number
  obj: Objective
  shape: string
}

export interface TierGridProps {
  objectives: Objective[]
  categories: string[]
  tiers: string[]
  responsive?: boolean
  width?: number
  height?: number
  colorMode?: "default" | "tier" | "category"
  showComparison?: boolean
  selectedObjectives?: Objective[]
  onObjectiveClick?: (objective: Objective) => void
  onCategoryClick?: (category: string) => void
  onTierCategoryClick?: (category: string, tier: string) => void
  onShowOnMap?: (locationIds: string[]) => void
  tierColorMap?: Record<string, string>
  showMapView?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const MARGIN = { top: 50, right: 50, bottom: 100, left: 60 }
const MAX_DOT_SIZE = 16
const MIN_DOT_SIZE = 4
const CELL_PADDING = 0
const MIN_CATEGORY_WIDTH = 80

const DEFAULT_TIER_COLORS = {
  "Tier 1": "#1ca367",
  "Tier 2": "#31b2c5",
  "Tier 3": "#f2944f",
  "Tier 4": "#ee5d32",
}

// ============================================================================
// Calculation Functions
// ============================================================================

export const calculateCategoryWidths = (
  objectives: Objective[],
  categories: string[],
  gridWidth: number,
): CategoryLayout[] => {
  const categoryObjectiveCounts = new Map<string, number>()
  categories.forEach((category) => {
    const count = objectives.filter((obj) => obj.category === category).length
    categoryObjectiveCounts.set(category, count)
  })

  const totalObjectives = Array.from(categoryObjectiveCounts.values()).reduce(
    (sum, count) => sum + count,
    0,
  )

  const proportionalWidths = new Map<string, number>()
  categories.forEach((category) => {
    const count = categoryObjectiveCounts.get(category) || 0
    const proportion =
      totalObjectives > 0 ? count / totalObjectives : 1 / categories.length
    const categoryWidth = gridWidth * proportion
    proportionalWidths.set(category, categoryWidth)
  })

  const categoriesNeedingMin: string[] = []
  const categoriesAboveMin: string[] = []
  let totalMinWidth = 0

  categories.forEach((category) => {
    const width = proportionalWidths.get(category) || 0
    if (width < MIN_CATEGORY_WIDTH) {
      categoriesNeedingMin.push(category)
      totalMinWidth += MIN_CATEGORY_WIDTH
    } else {
      categoriesAboveMin.push(category)
    }
  })

  const finalWidths = new Map<string, number>()
  const remainingWidth = gridWidth - totalMinWidth

  categoriesNeedingMin.forEach((category) => {
    finalWidths.set(category, MIN_CATEGORY_WIDTH)
  })

  if (categoriesAboveMin.length > 0) {
    if (remainingWidth > 0) {
      const totalAboveMinObjectives = categoriesAboveMin.reduce((sum, cat) => {
        return sum + (categoryObjectiveCounts.get(cat) || 0)
      }, 0)

      categoriesAboveMin.forEach((category) => {
        const count = categoryObjectiveCounts.get(category) || 0
        const proportion = count / totalAboveMinObjectives
        const categoryWidth = remainingWidth * proportion
        finalWidths.set(category, categoryWidth)
      })
    } else {
      const scaleFactor =
        gridWidth /
        (totalMinWidth + categoriesAboveMin.length * MIN_CATEGORY_WIDTH)

      categoriesNeedingMin.forEach((category) => {
        finalWidths.set(category, MIN_CATEGORY_WIDTH * scaleFactor)
      })

      categoriesAboveMin.forEach((category) => {
        finalWidths.set(category, MIN_CATEGORY_WIDTH * scaleFactor)
      })
    }
  }

  const layouts: CategoryLayout[] = []
  let currentX = 0

  categories.forEach((category) => {
    const width = finalWidths.get(category) || MIN_CATEGORY_WIDTH
    layouts.push({
      category,
      width,
      startX: currentX,
    })
    currentX += width
  })

  return layouts
}

const calculateTierPositions = (
  objectives: Objective[],
  categories: string[],
  tiers: string[],
  width: number,
  height: number,
  showComparison: boolean = false,
): {
  positions: Position[]
  cellLayouts: Map<
    string,
    {
      contentHeight: number
      x: number
      y: number
      width: number
      height: number
    }
  >
} => {
  const gridWidth = width - MARGIN.left - MARGIN.right
  const gridHeight = height - MARGIN.top - MARGIN.bottom

  const categoryLayouts = calculateCategoryWidths(
    objectives,
    categories,
    gridWidth,
  )
  const categoryWidths = new Map(
    categoryLayouts.map((l) => [l.category, l.width]),
  )
  const categoryStartX = new Map(
    categoryLayouts.map((l) => [l.category, l.startX]),
  )

  const cellHeight = gridHeight / tiers.length
  const positions: Position[] = []

  const computeMaxDotSizeForCell = (
    count: number,
    cellWidth: number,
    cellHeight: number,
  ) => {
    if (count <= 0) return MAX_DOT_SIZE

    for (let size = MAX_DOT_SIZE; size >= MIN_DOT_SIZE; size -= 0.5) {
      const spacing = size * 1.2
      const maxCols = Math.floor(
        (cellWidth - CELL_PADDING - size / 2) / spacing,
      )
      const cols = Math.max(1, maxCols)
      const rows = Math.ceil(count / cols)
      const requiredHeight = rows * spacing + size / 2
      const requiredWidth = cols * spacing + size / 2
      if (
        requiredHeight <= cellHeight - CELL_PADDING &&
        requiredWidth <= cellWidth - CELL_PADDING
      ) {
        return size
      }
    }
    return MIN_DOT_SIZE
  }

  let globalDotSize = MAX_DOT_SIZE
  tiers.forEach((tier) => {
    categories.forEach((category) => {
      const count = objectives.filter(
        (obj) => obj.tier === tier && obj.category === category,
      ).length

      if (count === 0) return
      const cellWidth = categoryWidths.get(category) || 0
      const maxSizeForCell = computeMaxDotSizeForCell(
        count,
        cellWidth,
        cellHeight,
      )
      globalDotSize = Math.min(globalDotSize, maxSizeForCell)
    })
  })
  const globalSpacing = globalDotSize * 1.2

  const cellLayouts = new Map<
    string,
    {
      contentHeight: number
      x: number
      y: number
      width: number
      height: number
    }
  >()

  const grouped = d3.group(
    objectives,
    (d) => d.tier,
    (d) => d.category,
  )

  tiers.forEach((tier, tierIndex) => {
    categories.forEach((category) => {
      const cellObjectives = grouped.get(tier)?.get(category) || []
      if (cellObjectives.length === 0) {
        return
      }

      // Sort by comparison outcome: improved first, same second, worsened last
      const sortedCellObjectives = [...cellObjectives].sort((a, b) => {
        if (!showComparison) return 0

        const aTierNum = parseInt(a.tier.replace("Tier ", ""))
        const aBaselineTierNum = parseInt(a.baselineTier.replace("Tier ", ""))
        const bTierNum = parseInt(b.tier.replace("Tier ", ""))
        const bBaselineTierNum = parseInt(b.baselineTier.replace("Tier ", ""))

        const aStatus =
          aTierNum < aBaselineTierNum
            ? 0
            : aTierNum === aBaselineTierNum
              ? 1
              : 2
        const bStatus =
          bTierNum < bBaselineTierNum
            ? 0
            : bTierNum === bBaselineTierNum
              ? 1
              : 2

        return aStatus - bStatus
      })

      const cellWidth = categoryWidths.get(category) || 0
      const cellStartX = categoryStartX.get(category) || 0

      const spacing = globalSpacing
      const dotSize = globalDotSize
      const dotsPerRow = Math.max(
        1,
        Math.floor((cellWidth - CELL_PADDING - dotSize / 2) / spacing),
      )

      let maxRow = -1

      sortedCellObjectives.forEach((obj, idx) => {
        const row = Math.floor(idx / dotsPerRow)
        const col = idx % dotsPerRow

        const x_rel = col * spacing + dotSize
        const y_rel = row * spacing + dotSize

        const globalX = MARGIN.left + cellStartX + x_rel - dotSize / 2
        const globalY =
          MARGIN.top + tierIndex * cellHeight + y_rel - dotSize / 2

        // Determine shape based on comparison mode
        let shape = "rect"
        if (showComparison && obj.baselineTier !== obj.tier) {
          const currentTierNum = parseInt(obj.tier.replace("Tier ", ""))
          const baselineTierNum = parseInt(
            obj.baselineTier.replace("Tier ", ""),
          )
          if (currentTierNum < baselineTierNum) {
            shape = "triangle-up" // Improved (lower tier number is better)
          } else if (currentTierNum > baselineTierNum) {
            shape = "triangle-down" // Worsened (higher tier number is worse)
          }
        }

        positions.push({
          id: `${obj.tierCode}:${obj.locationId}`, // Location ID is not unique
          x: globalX,
          y: globalY,
          width: dotSize,
          height: dotSize,
          obj: obj,
          shape: shape,
        })

        maxRow = Math.max(maxRow, row)
      })

      const contentHeight =
        maxRow === -1 ? 0 : (maxRow + 1) * spacing + dotSize / 2

      cellLayouts.set(`${tier}-${category}`, {
        contentHeight,
        x: MARGIN.left + cellStartX,
        y: MARGIN.top + tierIndex * cellHeight,
        width: cellWidth,
        height: cellHeight,
      })
    })
  })

  return { positions, cellLayouts }
}

// ============================================================================
// Utility Functions
// ============================================================================

const getFillColor = (
  obj: Objective,
  colorMode: string,
  tierColorMap: Record<string, string>,
  categoryColorScale: d3.ScaleOrdinal<string, string, never>,
  showComparison: boolean = false,
): string => {
  if (colorMode === "tier") {
    // In comparison mode, use comparison colors (blue/red based on change)
    if (showComparison) {
      const currentTierNum = parseInt(obj.tier.replace("Tier ", ""))
      const baselineTierNum = parseInt(obj.baselineTier.replace("Tier ", ""))

      if (currentTierNum === baselineTierNum) {
        return "#90caf9" // Light blue - no change
      } else if (currentTierNum < baselineTierNum) {
        return "#2196f3" // Default blue - improved
      } else {
        return "#f44336" // Red - worsened
      }
    }

    // In normal mode, use tier colors
    return tierColorMap[obj.tier] || "#999"
    // return "#999"
  } else if (colorMode === "category") {
    return categoryColorScale(obj.category)
  }
  // Default: use tier colors
  return tierColorMap[obj.tier] || "#999"
}

const drawTierGrid = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  width: number,
  height: number,
  categoryLayouts: CategoryLayout[],
  tiers: string[],
  onTierCategoryClick?: (category: string, tier: string) => void,
  showMapView: boolean = false,
) => {
  const gridWidth = width - MARGIN.left - MARGIN.right
  const gridHeight = height - MARGIN.top - MARGIN.bottom

  svg.selectAll(".grid-layer").remove()
  const gridLayer = svg.append("g").attr("class", "grid-layer")

  const tierHeight = gridHeight / tiers.length

  // Draw clickable cell backgrounds
  if (onTierCategoryClick && showMapView) {
    tiers.forEach((tier, tierIndex) => {
      categoryLayouts.forEach((layout) => {
        gridLayer
          .append("rect")
          .attr("class", "grid-cell-bg")
          .attr("x", MARGIN.left + layout.startX)
          .attr("y", MARGIN.top + tierIndex * tierHeight)
          .attr("width", layout.width)
          .attr("height", tierHeight)
          .attr("fill", "transparent")
          .style("cursor", "pointer")
          .on("click", () => onTierCategoryClick(layout.category, tier))
          .on("mouseover", function () {
            d3.select(this).attr("fill", "rgba(0, 0, 0, 0.1)")
          })
          .on("mouseout", function () {
            d3.select(this).attr("fill", "transparent")
          })
      })
    })
  }

  // Horizontal lines (tier separators)
  tiers.forEach((_, i) => {
    gridLayer
      .append("line")
      .attr("x1", MARGIN.left)
      .attr("y1", MARGIN.top + i * tierHeight)
      .attr("x2", MARGIN.left + gridWidth)
      .attr("y2", MARGIN.top + i * tierHeight)
      .attr("stroke", "#ddd")
      .attr("stroke-width", 1)
      .style("pointer-events", "none")
  })

  // Bottom border
  gridLayer
    .append("line")
    .attr("x1", MARGIN.left)
    .attr("y1", MARGIN.top + gridHeight)
    .attr("x2", MARGIN.left + gridWidth)
    .attr("y2", MARGIN.top + gridHeight)
    .attr("stroke", "#ddd")
    .attr("stroke-width", 1)
    .style("pointer-events", "none")

  // Vertical lines (category separators)
  categoryLayouts.forEach((layout) => {
    gridLayer
      .append("line")
      .attr("x1", MARGIN.left + layout.startX)
      .attr("y1", MARGIN.top)
      .attr("x2", MARGIN.left + layout.startX)
      .attr("y2", MARGIN.top + gridHeight)
      .attr("stroke", "#ddd")
      .attr("stroke-width", 1)
      .style("pointer-events", "none")
  })

  // Right border
  gridLayer
    .append("line")
    .attr("x1", MARGIN.left + gridWidth)
    .attr("y1", MARGIN.top)
    .attr("x2", MARGIN.left + gridWidth)
    .attr("y2", MARGIN.top + gridHeight)
    .attr("stroke", "#ddd")
    .attr("stroke-width", 1)
    .style("pointer-events", "none")

  // Tier labels on the left
  tiers.forEach((tier, i) => {
    gridLayer
      .append("text")
      .attr("x", MARGIN.left - 10)
      .attr("y", MARGIN.top + i * tierHeight + tierHeight / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .style("font-size", "11px")
      .style("fill", "#666")
      .style("pointer-events", "none")
      .text(tier)
  })
}

const drawCategoryLabels = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  height: number,
  categoryLayouts: CategoryLayout[],
  onCategoryClick?: (category: string) => void,
) => {
  svg.selectAll(".category-labels").remove()
  const labelLayer = svg.append("g").attr("class", "category-labels")

  const gridHeight = height - MARGIN.top - MARGIN.bottom

  categoryLayouts.forEach((layout) => {
    const x = MARGIN.left + layout.startX + layout.width / 2
    const y = MARGIN.top + gridHeight + 15

    // Split long category names into multiple lines
    const maxCharsPerLine = 8 // Approximate chars that fit
    const words = layout.category.split(" ")
    const lines: string[] = []
    let currentLine = ""

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    })
    if (currentLine) lines.push(currentLine)

    const textElement = labelLayer
      .append("text")
      .attr("x", x)
      .attr("y", y)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "hanging")
      .style("font-size", "11px")
      .style("fill", "#333")
      .style("cursor", onCategoryClick ? "pointer" : "default")

    // Add each line as a tspan
    lines.forEach((line, i) => {
      textElement
        .append("tspan")
        .attr("x", x)
        .attr("dy", i === 0 ? 0 : "1.2em")
        .text(line)
    })

    if (onCategoryClick) {
      textElement.on("click", () => onCategoryClick(layout.category))
    }
  })
}

// ============================================================================
// Component
// ============================================================================

export default function TierGrid({
  objectives,
  categories,
  tiers,
  responsive = true,
  width = 800,
  height = 600,
  colorMode = "default",
  showComparison = false,
  selectedObjectives = [],
  onObjectiveClick,
  onCategoryClick,
  onTierCategoryClick,
  tierColorMap = DEFAULT_TIER_COLORS,
  showMapView = false,
}: TierGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const svgSelection = useRef<d3.Selection<
    SVGSVGElement,
    unknown,
    null,
    undefined
  > | null>(null)

  const dimensions = useResizeObserver(
    containerRef as React.RefObject<HTMLElement>,
  )
  const [currentWidth, setCurrentWidth] = useState(width)
  const [currentHeight, setCurrentHeight] = useState(height)

  useEffect(() => {
    if (responsive && dimensions) {
      setCurrentWidth(dimensions.width)
      setCurrentHeight(dimensions.height)
    }
  }, [responsive, dimensions])

  const getSvgSelection = useCallback(() => {
    if (!svgSelection.current && svgRef.current) {
      svgSelection.current = d3.select(svgRef.current)
    }
    return svgSelection.current
  }, [])

  const categoryColorScale = useMemo(
    () => d3.scaleOrdinal(d3.schemeTableau10),
    [],
  )

  const selectedOutcomeLocationCodes = useMemo(
    () =>
      new Set(
        selectedObjectives.map((obj) => `${obj.tierCode}:${obj.locationId}`),
      ),
    [selectedObjectives],
  )

  const initialize = useCallback(
    (w: number, h: number, currentObjectives: typeof objectives) => {
      const svg = getSvgSelection()
      if (!svg || categories.length === 0 || currentObjectives.length === 0)
        return

      // Only clear grid/label layers, not dots
      svg.selectAll(".tier-grid").remove()
      svg.selectAll(".category-labels").remove()
      svg.selectAll(".tier-labels").remove()

      svg
        .attr("width", w)
        .attr("height", h)
        .attr("viewBox", `0 0 ${w} ${h}`)
        .attr("preserveAspectRatio", "xMidYMid meet")

      const categoryLayouts = calculateCategoryWidths(
        currentObjectives,
        categories,
        w - MARGIN.left - MARGIN.right,
      )

      drawTierGrid(
        svg,
        w,
        h,
        categoryLayouts,
        tiers,
        onTierCategoryClick,
        showMapView,
      )
      drawCategoryLabels(svg, h, categoryLayouts, onCategoryClick)
    },
    [
      getSvgSelection,
      categories,
      tiers,
      onCategoryClick,
      onTierCategoryClick,
      showMapView,
    ],
  )

  const animate = useCallback(
    (w: number, h: number) => {
      const svg = getSvgSelection()
      if (!svg || objectives.length === 0) return

      const { positions } = calculateTierPositions(
        objectives,
        categories,
        tiers,
        w,
        h,
        showComparison,
      )

      // Helper function to create path for different shapes
      const getShapePath = (d: Position) => {
        const cx = d.x + d.width / 2
        const cy = d.y + d.height / 2
        const size = d.width

        if (d.shape === "triangle-up") {
          const h = size * 0.866 // height of equilateral triangle
          return `M ${cx},${cy - h / 2} L ${cx + size / 2},${cy + h / 2} L ${cx - size / 2},${cy + h / 2} Z`
        } else if (d.shape === "triangle-down") {
          const h = size * 0.866
          return `M ${cx},${cy + h / 2} L ${cx + size / 2},${cy - h / 2} L ${cx - size / 2},${cy - h / 2} Z`
        } else {
          // rect
          return `M ${d.x},${d.y} L ${d.x + d.width},${d.y} L ${d.x + d.width},${d.y + d.height} L ${d.x},${d.y + d.height} Z`
        }
      }

      // Create dots layer if it doesn't exist, otherwise move it to top
      let dotsLayer = svg.select<SVGGElement>(".dots-layer")
      if (dotsLayer.empty()) {
        dotsLayer = svg.append("g").attr("class", "dots-layer")
      } else {
        dotsLayer.raise()
      }

      const shapes = dotsLayer
        .selectAll<SVGPathElement, Position>(".tier-dot")
        .data(positions, (d) => String(d.id))

      // Enter
      const enterShapes = shapes
        .enter()
        .append("path")
        .attr("class", "tier-dot")
        .attr("d", getShapePath)
        .attr("fill", (d) =>
          getFillColor(
            d.obj,
            colorMode,
            tierColorMap,
            categoryColorScale,
            showComparison,
          ),
        )
        .attr("stroke", (d) =>
          selectedOutcomeLocationCodes.has(String(d.id)) ? "#333" : "#fff",
        )
        .attr("stroke-width", (d) =>
          selectedOutcomeLocationCodes.has(String(d.id)) ? 3 : 1,
        )
        .style("cursor", showMapView ? "pointer" : "default")
        .attr("opacity", 0)

      // Merge
      const allShapes = enterShapes.merge(shapes)

      // Transition
      allShapes
        .transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr("d", getShapePath)
        .attr("fill", (d) =>
          getFillColor(
            d.obj,
            colorMode,
            tierColorMap,
            categoryColorScale,
            showComparison,
          ),
        )
        .attr("stroke", (d) =>
          selectedOutcomeLocationCodes.has(String(d.id)) ? "#333" : "#fff",
        )
        .attr("stroke-width", (d) =>
          selectedOutcomeLocationCodes.has(String(d.id)) ? 3 : 1,
        )
        .attr("opacity", 1)

      // Add event handlers
      allShapes
        .on("click", function (_event, d) {
          if (showMapView && onObjectiveClick) {
            onObjectiveClick(d.obj)
          }
        })
        .on("mouseover", function (this: SVGPathElement, event, d) {
          if (showMapView && !selectedOutcomeLocationCodes.has(String(d.id))) {
            d3.select(this).attr("stroke", "#333").attr("stroke-width", 2)
          }

          // Show tooltip
          if (tooltipRef.current && containerRef.current) {
            const obj = d.obj
            const baselineTierRow = showComparison
              ? `<div style="display: flex; justify-content: space-between; gap: 8px; margin-top: 4px; font-size: 12px;">
                  <span style="color: #718096;">Baseline Tier:</span>
                  <span style="font-weight: 600; color: #2d3748;">${obj.baselineTier}</span>
                </div>`
              : ""
            const tooltipHTML = `
              <div style="font-weight: 600; margin-bottom: 4px; color: #1a202c; font-size: 15.5px;">${obj.locationName}</div>
              <div style="color: #718096; font-size: 12px; margin-bottom: 6px;">${obj.category}</div>
              <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 6px;">
                <div style="display: flex; justify-content: space-between; gap: 8px; font-size: 12px;">
                  <span style="color: #718096;">Tier:</span>
                  <span style="font-weight: 600; color: #2d3748;">${obj.tier}</span>
                </div>
                ${baselineTierRow}
                <div style="display: flex; justify-content: space-between; gap: 8px; margin-top: 4px; font-size: 12px;">
                  <span style="color: #718096;">Location ID:</span>
                  <span style="font-weight: 500; color: #4a5568; font-family: monospace;">${obj.locationId}</span>
                </div>
              </div>
            `
            tooltipRef.current.innerHTML = tooltipHTML
            tooltipRef.current.style.opacity = "1"

            // Position relative to container
            const containerRect = containerRef.current.getBoundingClientRect()
            const x = event.clientX - containerRect.left + 10
            const y = event.clientY - containerRect.top + 10
            tooltipRef.current.style.left = `${x}px`
            tooltipRef.current.style.top = `${y}px`
          }
        })
        .on("mousemove", function (event) {
          if (tooltipRef.current && containerRef.current) {
            // Update position relative to container
            const containerRect = containerRef.current.getBoundingClientRect()
            const x = event.clientX - containerRect.left + 10
            const y = event.clientY - containerRect.top + 10
            tooltipRef.current.style.left = `${x}px`
            tooltipRef.current.style.top = `${y}px`
          }
        })
        .on("mouseout", function (this: SVGPathElement, _event, d) {
          if (!selectedOutcomeLocationCodes.has(String(d.id))) {
            d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1)
          }

          // Hide tooltip
          if (tooltipRef.current) {
            tooltipRef.current.style.opacity = "0"
          }
        })

      // Exit
      shapes.exit().transition().duration(300).attr("opacity", 0).remove()
    },
    [
      getSvgSelection,
      objectives,
      categories,
      tiers,
      colorMode,
      tierColorMap,
      categoryColorScale,
      selectedOutcomeLocationCodes,
      onObjectiveClick,
      showComparison,
      showMapView,
    ],
  )

  // Initialize when dimensions or categories change
  useEffect(() => {
    if (currentWidth > 0 && currentHeight > 0 && objectives.length > 0) {
      initialize(currentWidth, currentHeight, objectives)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWidth, currentHeight, initialize, categories])

  // Animate when data changes
  useEffect(() => {
    if (currentWidth > 0 && currentHeight > 0 && objectives.length > 0) {
      animate(currentWidth, currentHeight)
    }
  }, [currentWidth, currentHeight, animate, objectives])

  return (
    <div
      ref={containerRef}
      style={{
        width: responsive ? "100%" : currentWidth,
        height: responsive ? "100%" : currentHeight,
        minHeight: 400,
        position: "relative",
      }}
    >
      <svg
        ref={svgRef}
        width={currentWidth}
        height={currentHeight}
        style={{ display: "block", width: "100%", height: "100%" }}
      />

      {/* Color legend for comparison mode */}
      {showComparison && colorMode === "tier" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 10,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "12px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: "#2196f3",
                borderRadius: "2px",
              }}
            />
            <span style={{ color: "#4a5568" }}>Improved from baseline</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: "#90caf9",
                borderRadius: "2px",
              }}
            />
            <span style={{ color: "#4a5568" }}>No change</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: "#f44336",
                borderRadius: "2px",
              }}
            />
            <span style={{ color: "#4a5568" }}>Worsened from baseline</span>
          </div>
        </div>
      )}

      <div
        ref={tooltipRef}
        style={{
          position: "absolute",
          pointerEvents: "none",
          background: "rgba(255, 255, 255, 0.97)",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "10px 14px",
          fontSize: "11px",
          fontFamily:
            '"neue-haas-grotesk-text", Roboto, Helvetica, Arial, sans-serif',
          lineHeight: "1.5",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
          opacity: 0,
          transition: "opacity 200ms",
          zIndex: 1000,
          maxWidth: "280px",
        }}
      />
    </div>
  )
}
