import type { ScenariosResponse } from "../types/scenarioDownloads"

// File download endpoints (presigned S3 URLs)
const FILE_DOWNLOAD_API_BASE =
  "https://x66ckhp067.execute-api.us-west-2.amazonaws.com/default"

/**
 * Fetch scenarios list for file downloads
 * Uses the presigned download API
 */
// Fallback hardcoded scenarios if API fails
// TODO: Update with correct filenames from your team
const FALLBACK_SCENARIOS: ScenariosResponse = {
  scenarios: [
    {
      scenario_id: "s0020",
      files: {},
    },
    {
      scenario_id: "s0021",
      files: {},
    },
    {
      scenario_id: "s0011",
      files: {},
    },
  ],
}

export async function fetchScenariosForDownload(): Promise<ScenariosResponse> {
  try {
    const response = await fetch(`${FILE_DOWNLOAD_API_BASE}/scenarios`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      console.warn(
        `API returned ${response.status}, using fallback scenarios`,
      )
      return FALLBACK_SCENARIOS
    }

    return response.json()
  } catch (error) {
    console.warn("File download API unavailable, using fallback scenarios")
    console.error("Attempted URL:", `${FILE_DOWNLOAD_API_BASE}/scenarios`)
    return FALLBACK_SCENARIOS
  }
}

/**
 * Get presigned download URL for a specific scenario and file type
 */
export function getFileDownloadUrl(
  scenarioId: string,
  fileType: "zip" | "output" | "sv",
): string {
  return `${FILE_DOWNLOAD_API_BASE}/download?scenario=${scenarioId}&type=${fileType}`
}

