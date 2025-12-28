import type { ScenariosResponse } from "../../types/scenarioDownloads"
import { FILE_DOWNLOAD_API_BASE } from "../constants/api"

/**
 * Fetch scenarios list for file downloads
 * Uses the presigned download API
 */
export async function fetchScenariosForDownload(): Promise<ScenariosResponse> {
  const response = await fetch(`${FILE_DOWNLOAD_API_BASE}/scenario`, {
    method: "GET",
    mode: "cors",
    headers: {
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch scenarios: ${response.status}`)
  }

  return response.json()
}

/**
 * Get presigned download URL for a specific scenario and file type
 */
export function getFileDownloadUrl(
  scenarioId: string,
  fileType: "zip" | "output" | "sv",
): string {
  return `https://x66ckhp067.execute-api.us-west-2.amazonaws.com/default/download?scenario=${scenarioId}&type=${fileType}`
}
