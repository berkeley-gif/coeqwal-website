import type { OutcomeMetric } from "../../config/outcomeDefinitions"

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

// ============================================================================
// SVG capture utilities
// ============================================================================

/**
 * Inline all computed styles on an SVG clone so it renders identically when
 * serialised as a standalone image (outside the document's stylesheets).
 */
function inlineStyles(clone: SVGElement, original: SVGElement) {
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
  const { scale = 2, backgroundColor = "#ffffff" } = options

  const clone = svgElement.cloneNode(true) as SVGSVGElement
  inlineStyles(clone, svgElement)

  // Use getBoundingClientRect for reliable pixel dimensions — baseVal can be
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
 * Capture a DOM element that contains one or more child SVGs by compositing
 * them onto a single canvas at their relative positions.  Works for the list
 * view outcome column (grid of SVG glyphs) as well as single-SVG containers.
 */
export async function captureElementToBlob(
  element: HTMLElement,
  options: { scale?: number; backgroundColor?: string } = {},
): Promise<{ blob: Blob; dataUrl: string }> {
  const { scale = 2, backgroundColor = "#ffffff" } = options
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

  const svgs = element.querySelectorAll("svg")
  const serializer = new XMLSerializer()

  const drawPromises = Array.from(svgs).map((svg) => {
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
