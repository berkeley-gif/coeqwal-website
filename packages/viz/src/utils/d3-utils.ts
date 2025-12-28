/**
 * Utility functions for D3 visualizations
 */
import * as d3 from "d3"
import { DecileData } from "../types"

/**
 * Creates a continuous color scale for categorical data (scenarios, series, etc.)
 * Uses interpolateViridis - perceptually uniform, colorblind-friendly
 *
 * @param count - Total number of items to color
 * @returns A function that takes an index (0-based) and returns a hex color
 *
 * @example
 * const getColor = createCategoricalColorScale(8)
 * scenarios.map((s, i) => ({ ...s, color: getColor(i) }))
 */
export function createCategoricalColorScale(
  count: number,
): (index: number) => string {
  // For single item, return a mid-range color
  if (count <= 1) {
    return () => d3.interpolateViridis(0.5)
  }

  // Distribute colors evenly across the spectrum
  // Offset slightly from edges to avoid very dark/light colors
  const startOffset = 0.1
  const endOffset = 0.9
  const range = endOffset - startOffset

  return (index: number) => {
    const t = startOffset + (index / (count - 1)) * range
    return d3.interpolateViridis(t)
  }
}

/**
 * Parses data from various formats into DecileData format
 */
export function parseDecileData(
  rawData: DecileData[] | Record<string, unknown> | unknown,
): DecileData[] {
  // Handle array data format
  if (Array.isArray(rawData)) {
    return rawData.map((value, index) => ({
      decile: index + 1,
      value: typeof value === "number" ? value : 0,
    }))
  }

  // Handle object with quantile keys (q10, q20, etc.)
  if (typeof rawData === "object" && rawData !== null) {
    const decileData: DecileData[] = []
    const data = rawData as Record<string, unknown>

    // Check for quantile keys in the format q10, q20, etc.
    const quantilePattern = /^q(\d+)$/
    let hasQuantileKeys = false

    for (const key in data) {
      const match = key.match(quantilePattern)
      if (match && match[1]) {
        hasQuantileKeys = true
        const percentile = parseInt(match[1], 10)
        // Convert percentile (10, 20, ...) to decile (1, 2, ...)
        const decile = percentile / 10
        decileData.push({
          decile,
          value: typeof data[key] === "number" ? (data[key] as number) : 0,
        })
      }
    }

    if (hasQuantileKeys) {
      return decileData.sort((a, b) => a.decile - b.decile)
    }

    // Try to find decile keys directly (decile1, decile2, etc.)
    let hasDecileKeys = false
    for (const key in data) {
      if (key.toLowerCase().includes("decile")) {
        hasDecileKeys = true
        const decileMatch = key.match(/\d+/)
        if (decileMatch) {
          const decileNum = parseInt(decileMatch[0], 10)
          decileData.push({
            decile: decileNum,
            value: typeof data[key] === "number" ? (data[key] as number) : 0,
          })
        }
      }
    }

    if (hasDecileKeys) {
      return decileData.sort((a, b) => a.decile - b.decile)
    }

    // Try to find decile data in nested structure
    const objData = data as { data?: unknown }
    if (objData.data && Array.isArray(objData.data)) {
      return parseDecileData(objData.data)
    }
  }

  // Return empty array if data format is unrecognized
  console.warn("Unrecognized data format for decile chart")
  return []
}

/**
 * Creates a color scale for decile data based on specified scheme
 */
export function createDecileColorScale(
  scheme: "blues" | "greens" | "purples" | "oranges" | "reds" = "blues",
  count: number = 10,
): (decile: number) => string {
  const colorInterpolator = {
    blues: d3.interpolateBlues,
    greens: d3.interpolateGreens,
    purples: d3.interpolatePurples,
    oranges: d3.interpolateOranges,
    reds: d3.interpolateReds,
  }[scheme]

  return (decile: number) =>
    d3.scaleSequential().domain([1, count]).interpolator(colorInterpolator)(
      decile,
    )
}

/**
 * Formats a value for display with appropriate units
 */
export function formatValue(value: number, unit?: string): string {
  if (value === undefined || isNaN(value)) return "N/A"

  // Format based on magnitude
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M${unit || ""}`
  } else if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}k${unit || ""}`
  } else {
    return `${value.toFixed(1)}${unit || ""}`
  }
}

/**
 * Calculates chart dimensions accounting for margins
 */
export function calculateChartDimensions(
  width: number,
  height: number,
  margin: { top: number; right: number; bottom: number; left: number },
) {
  return {
    width,
    height,
    innerWidth: width - margin.left - margin.right,
    innerHeight: height - margin.top - margin.bottom,
    margin,
  }
}

/**
 * Safely accesses a value from a nested object structure
 */
export function getNestedValue(
  obj: Record<string, unknown>,
  path: string,
  defaultValue: unknown = undefined,
): unknown {
  const keys = path.split(".")
  let current: unknown = obj

  for (const key of keys) {
    if (current === undefined || current === null) return defaultValue
    current = (current as Record<string, unknown>)[key]
  }

  return current !== undefined ? current : defaultValue
}
