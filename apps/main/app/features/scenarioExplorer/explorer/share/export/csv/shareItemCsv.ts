/**
 * Share-item CSV orchestration. Routes each share item to its variant
 * handler's `exportCsv` hook and assembles either a single-card CSV
 * download or a multi-card ZIP. The caller builds the `CsvLookups`
 * bundle once (see `useCsvLookups`) and passes it straight through.
 */

import JSZip from "jszip"
import type { ShareItem } from "../../types"
import { handlerForItem, type CsvLookups } from "../../variants"
import { withExt, dedupeLabel } from "../../utils/filename"
import { downloadBlob, downloadCSV } from "../download"

/**
 * Render one share-item's CSV body via its variant handler. Returns
 * null when the variant has no exporter or has no cached data, so the
 * caller can skip the item.
 */
function renderShareItemCsv(
  item: ShareItem,
  lookups: CsvLookups,
): string | null {
  const handler = handlerForItem(item)
  if (!handler.exportCsv) return null
  return handler.exportCsv(item as never, lookups)
}

/**
 * Resolve the per-item filename a variant uses for both its PNG/SVG
 * download and its CSV. The bulk exporter reuses this so users get the
 * same basename whether they download an item one at a time or as part
 * of the ZIP.
 */
function shareItemFilenameLabel(item: ShareItem, lookups: CsvLookups): string {
  return handlerForItem(item).filenameLabel(item as never, lookups)
}

/**
 * Export a single share-item's chart data as CSV. Variants without an
 * `exportCsv` hook are silently skipped.
 */
export function exportShareItemAsCSV(
  item: ShareItem,
  filename: string,
  lookups: CsvLookups,
) {
  const csv = renderShareItemCsv(item, lookups)
  if (csv) downloadCSV(csv, filename)
}

/**
 * Bundle every share-item's chart data into a ZIP containing one CSV
 * per item. Each entry is named `<filenameLabel>-data.csv`, deduped on
 * collision, so the names line up with the per-card CSV download.
 *
 * Callers should `useShareDataReady` first so variants with rehydrators
 * have filled in `cachedChartData`. Items whose `exportCsv` returns null
 * (no exporter or no data) are skipped.
 */
export async function exportAllShareItemsAsZip(
  items: ShareItem[],
  filename: string,
  lookups: CsvLookups,
): Promise<void> {
  const zip = new JSZip()
  const usedNames = new Set<string>()
  let included = 0

  for (const item of items) {
    const csv = renderShareItemCsv(item, lookups)
    if (!csv) continue
    const base = dedupeLabel(
      `${shareItemFilenameLabel(item, lookups)}-data`,
      usedNames,
    )
    zip.file(withExt(base, "csv"), csv)
    included += 1
  }

  // Don't trigger a download if every item was skipped. The user would
  // just get an empty ZIP with no signal as to why.
  if (included === 0) return

  const blob = await zip.generateAsync({ type: "blob" })
  downloadBlob(blob, filename)
}
