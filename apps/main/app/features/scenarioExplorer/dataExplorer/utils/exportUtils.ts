import type { OutcomeMetric } from "../../config/outcomeDefinitions"
import { themeValues } from "@repo/ui/themes/theme"

/**
 * Export utilities for Data Explorer
 */

/**
 * Export table data as CSV
 */
export function exportTableAsCSV(
  metrics: OutcomeMetric[],
  filename: string = "coeqwal-metrics.csv",
) {
  // Create CSV header
  const headers = [
    "Metric Name",
    "Category",
    "Unit",
    "Spatial Type",
    "Temporal Scales",
    "Aggregations",
    "Description",
    "Has Outcome Tiers",
    "Show on Map",
    "Notes",
  ]

  // Create CSV rows
  const rows = metrics.map((metric) => [
    metric.name,
    metric.category,
    metric.unit,
    metric.spatialType,
    metric.temporal.join("; "),
    metric.aggregations.join("; "),
    metric.description,
    metric.isTier ? "Yes" : "No",
    metric.showOnMap ? "Yes" : "No",
    metric.notes || "",
  ])

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma or quote
          const cellStr = String(cell)
          if (cellStr.includes(",") || cellStr.includes('"')) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        })
        .join(","),
    ),
  ].join("\n")

  // Create download
  downloadCSV(csvContent, filename)
}

/**
 * Export metric data with scenario values as CSV
 */
export function exportMetricDataAsCSV(
  metric: OutcomeMetric,
  scenarioData: Array<{
    scenarioId: string
    scenarioName: string
    tierData: Array<{ tier: string; value: number; color: string }>
  }>,
  filename?: string,
) {
  const fname = filename || `${metric.id}-comparison.csv`

  // Create header
  const headers = ["Tier", ...scenarioData.map((s) => s.scenarioName)]

  // Get all unique tiers
  const tiers = Array.from(
    new Set(scenarioData.flatMap((s) => s.tierData.map((t) => t.tier))),
  ).sort()

  // Create rows
  const rows = tiers.map((tier) => {
    const row = [tier]
    scenarioData.forEach((scenario) => {
      const tierValue = scenario.tierData.find((t) => t.tier === tier)
      row.push(tierValue ? String(tierValue.value) : "0")
    })
    return row
  })

  // Combine
  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
    "\n",
  )

  downloadCSV(csvContent, fname)
}

/**
 * Export raw JSON data
 */
export function exportAsJSON(
  data: unknown,
  filename: string = "coeqwal-data.json",
) {
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Convert the internal radar coordinate (-1 … +1) back to a weighted
 * tier score on the 1-4 scale used by the tier system:
 *   1 = Optimal, 2 = Acceptable, 3 = At-risk, 4 = Critical
 */
function radarValueToTierScore(v: number): number {
  return Math.round((4 - (v + 1) * 1.5) * 100) / 100
}

function csvEscape(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

function csvQuote(val: string): string {
  return `"${val.replace(/"/g, '""')}"`
}

type BarTierEntry = {
  label?: string
  value?: number
  rawCount?: number
  tierType?: "single_value" | "multi_value"
}

/**
 * Convert bar chart tier data into a readable CSV string.
 *
 * Values are reported as number of locations per tier.
 * Single-location outcomes get a 1 in their active tier.
 *
 *   Scenario, <name>
 *   Outcome, Optimal, Acceptable, At-risk, Critical, Total Locations
 *   Delta Exports, 1, 2, 1, 0, 4
 *   Delta Outflow, 0, 1, 0, 0, 1
 *   …
 */
function barChartDataToCSV(
  data: Record<string, BarTierEntry[]>,
  scenarioLabel: string,
): string {
  const outcomes = Object.keys(data)
  if (outcomes.length === 0) return ""

  const firstTiers = data[outcomes[0]!]!
  const tierNames = firstTiers.map((t) => t.label ?? "")

  const header = ["Outcome", ...tierNames.map(csvEscape), "Total Locations"]

  const rows = outcomes.map((outcome) => {
    const tiers = data[outcome]!
    const isSingle = tiers[0]?.tierType === "single_value"

    let counts: string[]
    let total: string
    if (isSingle) {
      counts = tiers.map((t) => (t.value && t.value > 0 ? "1" : "0"))
      total = "1"
    } else {
      counts = tiers.map((t) => String(t.rawCount ?? 0))
      total = String(tiers.reduce((sum, t) => sum + (t.rawCount ?? 0), 0))
    }
    return [csvEscape(outcome), ...counts, total]
  })

  return [
    `Scenario,${csvEscape(scenarioLabel)}`,
    header.join(","),
    ...rows.map((r) => r.join(",")),
  ].join("\n")
}

/**
 * Convert radar chart data into a readable CSV string.
 *
 * Layout: outcomes as rows, scenarios as columns.
 *
 *   Scale: 1 = Optimal  2 = Acceptable  3 = At-risk  4 = Critical
 *   (blank line)
 *   Outcome, Scenario A, Scenario B
 *   Delta Exports, 2.35, 1.80
 *   Delta Outflow, 1.50, 2.00
 */
function radarDataToCSV(
  rawData: Record<string, unknown>,
  scenarioIds?: string[],
  scenarioNameLookup?: (id: string) => string,
): string | null {
  const ids = scenarioIds ?? Object.keys(rawData)
  if (ids.length === 0) return null

  const data: Record<string, Record<string, number | null>> = {}
  for (const id of ids) {
    const entry = rawData[id]
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      data[id] = entry as Record<string, number | null>
    }
  }
  const scenarioEntries = Object.entries(data)
  if (scenarioEntries.length === 0) return null

  const outcomeNames = Array.from(
    new Set(scenarioEntries.flatMap(([, v]) => Object.keys(v))),
  )

  const scenarioLabels = scenarioEntries.map(
    ([id]) => scenarioNameLookup?.(id) ?? id,
  )

  const lines: string[] = []
  lines.push(
    csvQuote(
      "Scale: 1 = Optimal | 2 = Acceptable | 3 = At-risk | 4 = Critical",
    ),
  )
  lines.push("")
  lines.push(["Key outcomes", ...scenarioLabels.map(csvQuote)].join(","))

  for (const outcome of outcomeNames) {
    const vals = scenarioEntries.map(([, values]) => {
      const v = values[outcome]
      return v != null ? String(radarValueToTierScore(v)) : ""
    })
    lines.push([csvQuote(outcome), ...vals].join(","))
  }

  return lines.join("\n")
}

/**
 * Resilience heatmap row shape, mirroring `ResilienceChartDataRow` in
 * `ResiliencePanel.tsx`. Duplicated here as a plain type to avoid a
 * runtime import cycle between exportUtils and the explore view.
 */
type ResilienceHeatmapRow = {
  rowKey: string
  rowLabel: string
  colKey: string
  colLabel: string
  tier?: number
  value?: number
  delta?: number
  count?: number
}

type ResilienceHeatmapChartDataShape = {
  view?: string
  cellEncoding?: string
  tileScope?: string
  tileLabel?: string
  rows: ResilienceHeatmapRow[]
}

type ResilienceQuadrantChartDataShape = {
  view?: "quadrant"
  tileScope?: "quadrant"
  tileLabel?: string
  xLabel?: string
  yLabel?: string
  rows: Array<{
    id: string
    label: string
    x: number | null
    y: number | null
    tierAtRefHc?: number | null
    secondary?: string
  }>
}

/**
 * Convert a flat resilience heatmap payload into a CSV table.
 * Layout: one row per (row, column) cell, with tier / value / delta
 * columns that map back to the heatmap's cell encoding.
 */
function resilienceHeatmapDataToCSV(
  data: ResilienceHeatmapChartDataShape,
): string | null {
  if (!Array.isArray(data.rows) || data.rows.length === 0) return null
  const header = ["Row", "Column", "Tier", "Value", "Delta", "Count"]
  const lines: string[] = []
  if (data.tileLabel) {
    lines.push(`Subject,${csvEscape(String(data.tileLabel))}`)
  }
  if (data.view) lines.push(`View,${csvEscape(String(data.view))}`)
  if (data.cellEncoding) {
    lines.push(`Encoding,${csvEscape(String(data.cellEncoding))}`)
  }
  if (lines.length > 0) lines.push("")
  lines.push(header.join(","))
  for (const row of data.rows) {
    lines.push(
      [
        csvEscape(row.rowLabel),
        csvEscape(row.colLabel),
        row.tier != null ? String(row.tier) : "",
        row.value != null ? String(row.value) : "",
        row.delta != null ? String(row.delta) : "",
        row.count != null ? String(row.count) : "",
      ].join(","),
    )
  }
  return lines.join("\n")
}

/**
 * Convert a quadrant scatter payload into a CSV table. Uses the
 * payload's xLabel / yLabel as the X and Y column headers so the
 * captured axis metadata rides through the export.
 */
function resilienceQuadrantDataToCSV(
  data: ResilienceQuadrantChartDataShape,
): string | null {
  if (!Array.isArray(data.rows) || data.rows.length === 0) return null
  const xLabel = data.xLabel ?? "X"
  const yLabel = data.yLabel ?? "Y"
  const header = ["Item", csvEscape(xLabel), csvEscape(yLabel), "Tier"]
  const lines: string[] = []
  if (data.tileLabel) {
    lines.push(`Subject,${csvEscape(String(data.tileLabel))}`)
    lines.push("")
  }
  lines.push(header.join(","))
  for (const row of data.rows) {
    lines.push(
      [
        csvEscape(row.label),
        row.x != null ? String(row.x) : "",
        row.y != null ? String(row.y) : "",
        row.tierAtRefHc != null ? String(row.tierAtRefHc) : "",
      ].join(","),
    )
  }
  return lines.join("\n")
}

/**
 * Export a single share-item's chart data as CSV.
 *
 * Bar chart items produce a readable matrix - one row per outcome,
 * tier scores as columns (Optimal, Acceptable, At-risk, Critical).
 *
 * Radar items produce a scenario × outcome matrix:
 *   Scenario, Outcome1, Outcome2, …
 *
 * Resilience heatmap items produce a row-per-cell table. Resilience
 * quadrant items (discriminated by `cachedChartData.view === "quadrant"`)
 * produce a row-per-dot table with axis-labeled X and Y columns.
 */
export function exportShareItemAsCSV(
  item: {
    type: string
    scenarioId?: string
    scenarioIds?: string[]
    cachedChartData?: Record<string, unknown>
  },
  filename: string,
  scenarioNameLookup?: (id: string) => string,
) {
  if (!item.cachedChartData) return

  if (item.type === "barChart") {
    const data = item.cachedChartData as Record<
      string,
      { label?: string; value?: number; rawCount?: number }[]
    >
    const scenarioLabel =
      scenarioNameLookup?.(item.scenarioId ?? "") ?? item.scenarioId ?? ""
    const lines = barChartDataToCSV(data, scenarioLabel)
    downloadCSV(lines, filename)
    return
  }

  if (item.type === "radar") {
    const csv = radarDataToCSV(
      item.cachedChartData as Record<string, unknown>,
      item.scenarioIds,
      scenarioNameLookup,
    )
    if (csv) downloadCSV(csv, filename)
    return
  }

  if (item.type === "resilience") {
    const data = item.cachedChartData as Record<string, unknown>
    const csv =
      data.view === "quadrant"
        ? resilienceQuadrantDataToCSV(
            data as unknown as ResilienceQuadrantChartDataShape,
          )
        : resilienceHeatmapDataToCSV(
            data as unknown as ResilienceHeatmapChartDataShape,
          )
    if (csv) downloadCSV(csv, filename)
    return
  }
}

/**
 * Export all share-items' chart data as a single multi-sheet-style CSV.
 * Each item's data is separated by a header row indicating the item type.
 */
export function exportAllShareItemsAsCSV(
  items: Array<{
    type: string
    scenarioId?: string
    scenarioIds?: string[]
    cachedChartData?: Record<string, unknown>
  }>,
  filename: string,
  scenarioNameLookup?: (id: string) => string,
) {
  const sections: string[] = []

  for (const item of items) {
    if (!item.cachedChartData) continue

    if (item.type === "barChart") {
      const label =
        scenarioNameLookup?.(item.scenarioId ?? "") ?? item.scenarioId ?? ""
      const data = item.cachedChartData as Record<string, BarTierEntry[]>
      sections.push(barChartDataToCSV(data, label))
      sections.push("")
    }

    if (item.type === "radar") {
      const csv = radarDataToCSV(
        item.cachedChartData as Record<string, unknown>,
        item.scenarioIds,
        scenarioNameLookup,
      )
      if (csv) {
        sections.push(csv)
        sections.push("")
      }
    }

    if (item.type === "resilience") {
      const data = item.cachedChartData as Record<string, unknown>
      const csv =
        data.view === "quadrant"
          ? resilienceQuadrantDataToCSV(
              data as unknown as ResilienceQuadrantChartDataShape,
            )
          : resilienceHeatmapDataToCSV(
              data as unknown as ResilienceHeatmapChartDataShape,
            )
      if (csv) {
        sections.push(csv)
        sections.push("")
      }
    }
  }

  if (sections.length === 0) return
  downloadCSV(sections.join("\n"), filename)
}

/**
 * Download CSV helper
 */
function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Capture map screenshot
 * Note: This requires the map instance to be accessible
 */
export async function captureMapScreenshot(
  mapContainer: HTMLElement | null,
  filename: string = "coeqwal-map.png",
): Promise<void> {
  if (!mapContainer) {
    throw new Error("Map container not found")
  }

  // For Mapbox maps, we need to use the canvas element
  const canvas = mapContainer.querySelector("canvas")
  if (!canvas) {
    throw new Error("Map canvas not found")
  }

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create image blob"))
          return
        }

        // Download
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        resolve()
      },
      "image/png",
      1.0,
    )
  })
}

/**
 * Copy data to clipboard as text
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand("copy")
    document.body.removeChild(textarea)
  }
}

/**
 * Format date for filename
 */
export function getTimestampedFilename(
  base: string,
  extension: string,
): string {
  const date = new Date()
  const timestamp = date.toISOString().slice(0, 19).replace(/[T:]/g, "-")
  return `${base}-${timestamp}.${extension}`
}

// ============================================================================
// SVG capture utilities
// ============================================================================

/**
 * Inline all computed styles on an SVG clone so it renders identically when
 * serialised as a standalone image (outside the document's stylesheets).
 */
export function inlineStyles(clone: SVGElement, original: SVGElement) {
  const computed = window.getComputedStyle(original)
  const dominated = [
    "fill",
    "stroke",
    "stroke-width",
    "stroke-opacity",
    "fill-opacity",
    "opacity",
    "font-family",
    "font-size",
    "font-weight",
    "text-anchor",
    "dominant-baseline",
    "letter-spacing",
    "visibility",
    "display",
  ]
  for (const prop of dominated) {
    const val = computed.getPropertyValue(prop)
    if (val) clone.style.setProperty(prop, val)
  }

  const origChildren = original.children
  const cloneChildren = clone.children
  for (let i = 0; i < origChildren.length; i++) {
    if (origChildren[i] instanceof SVGElement && cloneChildren[i]) {
      inlineStyles(
        cloneChildren[i] as SVGElement,
        origChildren[i] as SVGElement,
      )
    }
  }
}

/**
 * Capture an SVG element as a rasterised PNG blob + base64 data URL.
 *
 * The SVG is cloned, its computed styles are inlined, and it is drawn onto
 * an offscreen canvas at the requested scale.
 */
export async function captureSvgToBlob(
  svgElement: SVGSVGElement,
  options: { scale?: number; backgroundColor?: string } = {},
): Promise<{ blob: Blob; dataUrl: string }> {
  const { scale = 2, backgroundColor = themeValues.palette.common.white } =
    options

  const clone = svgElement.cloneNode(true) as SVGSVGElement
  inlineStyles(clone, svgElement)

  // Use getBoundingClientRect for reliable pixel dimensions - baseVal can be
  // 0 when the SVG uses percentage-based sizing (style="width:100%").
  const rect = svgElement.getBoundingClientRect()
  const svgWidth = rect.width || svgElement.clientWidth || 600
  const svgHeight = rect.height || svgElement.clientHeight || 600

  // Strip percentage/relative sizing from the clone so the standalone SVG
  // renders at the correct pixel dimensions when loaded as an image.
  clone.removeAttribute("style")
  clone.setAttribute("width", String(svgWidth))
  clone.setAttribute("height", String(svgHeight))
  if (!clone.getAttribute("viewBox")) {
    clone.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
  }
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")

  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(clone)
  const svgDataUri =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString)

  const canvasWidth = svgWidth * scale
  const canvasHeight = svgHeight * scale

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Could not get canvas 2d context"))
        return
      }
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)

      const dataUrl = canvas.toDataURL("image/png")
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create image blob from SVG"))
            return
          }
          resolve({ blob, dataUrl })
        },
        "image/png",
        1.0,
      )
    }
    img.onerror = () => reject(new Error("Failed to load SVG as image"))
    img.src = svgDataUri
  })
}

/**
 * Rasterise an already-styled SVG clone to a PNG blob + data URL.
 *
 * To be used when we've already called `inlineStyles` and performed any
 * DOM surgery (e.g. pruning elements) on the clone. Pass the pixel
 * dimensions of the *original* on-screen SVG so the canvas is sized
 * correctly.
 */
export async function rasterizeSvgClone(
  clone: SVGSVGElement,
  width: number,
  height: number,
  options: { scale?: number; backgroundColor?: string } = {},
): Promise<{ blob: Blob; dataUrl: string }> {
  const { scale = 2, backgroundColor = themeValues.palette.common.white } =
    options

  clone.removeAttribute("style")
  clone.setAttribute("width", String(width))
  clone.setAttribute("height", String(height))
  if (!clone.getAttribute("viewBox")) {
    clone.setAttribute("viewBox", `0 0 ${width} ${height}`)
  }
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")

  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(clone)
  const svgDataUri =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString)

  const canvasWidth = width * scale
  const canvasHeight = height * scale

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Could not get canvas 2d context"))
        return
      }
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)

      const dataUrl = canvas.toDataURL("image/png")
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create image blob from SVG clone"))
            return
          }
          resolve({ blob, dataUrl })
        },
        "image/png",
        1.0,
      )
    }
    img.onerror = () => reject(new Error("Failed to load SVG clone as image"))
    img.src = svgDataUri
  })
}

/**
 * Capture a DOM element that contains one or more child SVGs by compositing
 * them onto a single canvas at their relative positions.  Works for the list
 * view outcome column (grid of SVG glyphs) as well as single-SVG containers.
 */
export async function captureElementToBlob(
  element: HTMLElement,
  options: { scale?: number; backgroundColor?: string } = {},
): Promise<{ blob: Blob; dataUrl: string }> {
  const { scale = 2, backgroundColor = themeValues.palette.common.white } =
    options
  const rect = element.getBoundingClientRect()
  const canvasW = rect.width * scale
  const canvasH = rect.height * scale

  const canvas = document.createElement("canvas")
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not get canvas 2d context")

  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, canvasW, canvasH)

  // Skip any SVG nested inside an element explicitly marked to be excluded
  // from composite captures (e.g. share / expand action icons rendered on top
  // of the chart). This lets chart authors keep interactive glyphs out of
  // snapshot thumbnails without the utility needing to know about them.
  const svgs = Array.from(element.querySelectorAll("svg")).filter(
    (svg) => !svg.closest("[data-capture-exclude]"),
  )
  const serializer = new XMLSerializer()

  const drawPromises = svgs.map((svg) => {
    const clone = svg.cloneNode(true) as SVGSVGElement
    inlineStyles(clone, svg)
    const svgW = svg.clientWidth || svg.getBoundingClientRect().width
    const svgH = svg.clientHeight || svg.getBoundingClientRect().height
    clone.setAttribute("width", String(svgW))
    clone.setAttribute("height", String(svgH))
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")

    const svgRect = svg.getBoundingClientRect()
    const offsetX = (svgRect.left - rect.left) * scale
    const offsetY = (svgRect.top - rect.top) * scale

    const uri =
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(serializer.serializeToString(clone))

    return new Promise<void>((resolve) => {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, offsetX, offsetY, svgW * scale, svgH * scale)
        resolve()
      }
      img.onerror = () => resolve()
      img.src = uri
    })
  })

  await Promise.all(drawPromises)

  const dataUrl = canvas.toDataURL("image/png")
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create image blob from element"))
          return
        }
        resolve({ blob, dataUrl })
      },
      "image/png",
      1.0,
    )
  })
}

/**
 * Trigger a browser download from a Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Trigger a browser download from a base64 data URL.
 */
export async function downloadFromDataUrl(
  dataUrl: string,
  filename: string,
): Promise<void> {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  downloadBlob(blob, filename)
}
