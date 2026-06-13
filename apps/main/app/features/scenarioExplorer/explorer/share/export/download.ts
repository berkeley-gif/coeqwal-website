/**
 * Browser download + clipboard helpers shared by every share export
 * path (CSV, ZIP, PNG/SVG). The export code produces a
 * Blob or data URL and hands over to here.
 */

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
 * Convert a base64 or URI-encoded data URL into a Blob. Lets capture
 * code that yields a data URL feed the same Blob-based download and ZIP
 * paths as everything else.
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return await res.blob()
}

/**
 * Trigger a browser download from a base64 data URL.
 */
export async function downloadFromDataUrl(
  dataUrl: string,
  filename: string,
): Promise<void> {
  const blob = await dataUrlToBlob(dataUrl)
  downloadBlob(blob, filename)
}

/**
 * Trigger a browser download for an SVG string. Wraps the string in
 * a Blob with the SVG mime type so the file opens in a viewer or
 * vector tool rather than as plain text.
 */
export function downloadSvgString(svgString: string, filename: string): void {
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
  downloadBlob(blob, filename)
}

/**
 * Download CSV helper. Wraps the shared `downloadBlob` so the CSV /
 * ZIP / image download paths all share one anchor-click
 * implementation.
 */
export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  downloadBlob(blob, filename)
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
