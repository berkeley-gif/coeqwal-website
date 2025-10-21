import type { ScenariosResponse } from "../types/scenarioDownloads"

const SCENARIOS_API_URL =
  "https://x66ckhp067.execute-api.us-west-2.amazonaws.com/default/scenario"

/**
 * Fetch scenarios via AWS Lambda function (for security)
 */
export async function fetchScenariosFromAPI(): Promise<ScenariosResponse> {
  const response = await fetch(SCENARIOS_API_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch scenarios: ${response.status}`)
  }

  return response.json()
}

/**
 * Get download URL for a specific scenario and file type
 */
export function getDownloadUrl(
  scenarioId: string,
  fileType: "zip" | "output" | "sv",
): string {
  return `https://x66ckhp067.execute-api.us-west-2.amazonaws.com/default/download?scenario=${scenarioId}&type=${fileType}`
}
