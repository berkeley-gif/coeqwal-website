import type { ScenariosResponse } from "../../types/scenarioDownloads"
import { FILE_DOWNLOAD_API_BASE } from "../constants/api"

/**
 * Fetch scenarios list for file downloads
 * Uses the presigned download API
 *
 * Includes retry logic with exponential backoff to handle Lambda cold starts
 */
export async function fetchScenariosForDownload(
  retries = 3,
): Promise<ScenariosResponse> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${FILE_DOWNLOAD_API_BASE}/scenario`, {
        method: "GET",
        mode: "cors",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(15000), // 15s timeout for cold starts
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      if (attempt === retries) {
        throw new Error(
          `Failed to fetch scenarios after ${retries} attempts: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
      }
      // Exponential backoff: 1s, 2s, 3s
      await new Promise((r) => setTimeout(r, 1000 * attempt))
    }
  }

  throw new Error("Failed to fetch scenarios after retries")
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
