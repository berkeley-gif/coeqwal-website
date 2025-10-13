import type { ScenariosResponse } from "../types/scenarioDownloads"

const SCENARIOS_API_URL = "https://api.coeqwal.org/scenarios"

/**
 * Fetch scenarios from AWS API
 * Currently blocked by CORS - AWS API needs to be configured to allow cross-origin requests
 *
 * To fix CORS on AWS API Gateway:
 * 1. Enable CORS on the API Gateway endpoint
 * 2. Add these headers to the response:
 *    - Access-Control-Allow-Origin: * (or specific domain)
 *    - Access-Control-Allow-Headers: Content-Type
 *    - Access-Control-Allow-Methods: GET, OPTIONS
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
  return `https://api.coeqwal.org/download?scenario=${scenarioId}&type=${fileType}`
}
