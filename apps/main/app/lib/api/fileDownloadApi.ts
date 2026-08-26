import type { ScenariosResponse } from "../../types/scenarioDownloads"
import { FILE_DOWNLOAD_API_BASE } from "../constants/api"

/**
 * Fetch scenarios list for file downloads.
 *
 * Scenarios are frozen and complete, so this list is a static manifest
 * (`public/scenario-manifest.json`) generated once from the presign
 * Lambda's `GET /scenario` route rather than fetched from it live on every
 * page load - see coeqwal-data-platform's
 * `api/lambda/coeqwalPresignDownload/open_issues.md` #1. Regenerate that
 * file (re-run the same one-off S3 listing) only if the scenario set ever
 * changes again. Same-origin static asset, so no CORS/cold-start handling
 * is needed here anymore.
 */
export async function fetchScenariosForDownload(): Promise<ScenariosResponse> {
  const response = await fetch("/scenario-manifest.json", {
    headers: { Accept: "application/json" },
  })

  if (!response.ok) {
    throw new Error(`Failed to load scenario manifest: HTTP ${response.status}`)
  }

  return await response.json()
}

/**
 * Get presigned download URL for a specific scenario and file type.
 * Unlike the scenario list, this always hits the Lambda - presigned URLs
 * expire in 15 minutes, so they have to be minted at click time, not baked
 * into a static asset.
 */
export function getFileDownloadUrl(
  scenarioId: string,
  fileType: "zip" | "output" | "sv",
): string {
  return `${FILE_DOWNLOAD_API_BASE}/download?scenario=${scenarioId}&type=${fileType}`
}
