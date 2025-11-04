import type { OutcomeMetric } from "../outcomeDefinitions"

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
