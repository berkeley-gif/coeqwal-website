import type { ScenariosResponse } from "../../types/scenarioDownloads"

// File download endpoints (presigned S3 URLs)
const FILE_DOWNLOAD_API_BASE =
  "https://x66ckhp067.execute-api.us-west-2.amazonaws.com/default"

/**
 * Fetch scenarios list for file downloads
 * Uses the presigned download API
 */
// Fallback hardcoded scenarios if API fails
// TODO: Keep updated or remove
const FALLBACK_SCENARIOS: ScenariosResponse = {
  scenarios: [
    {
      scenario_id: "s0011",
      files: {
        zip: {
          key: "scenario/s0011/run/s0011_adjBL_wTUCP_v1_20250710.zip",
          filename: "s0011_adjBL_wTUCP_v1_20250710.zip",
        },
        output_csv: {
          key: "scenario/s0011/csv/s0011_coeqwal_calsim_output.csv",
          filename: "s0011_coeqwal_calsim_output.csv",
        },
        sv_csv: {
          key: "scenario/s0011/csv/s0011_coeqwal_sv_input.csv",
          filename: "s0011_coeqwal_sv_input.csv",
        },
      },
    },
    {
      scenario_id: "s0020",
      files: {
        zip: {
          key: "scenario/s0020/run/s0020_DCRadjBL_2020LU_wTUCP.zip",
          filename: "s0020_DCRadjBL_2020LU_wTUCP.zip",
        },
        output_csv: {
          key: "scenario/s0020/csv/s0020_coeqwal_calsim_output.csv",
          filename: "s0020_coeqwal_calsim_output.csv",
        },
        sv_csv: {
          key: "scenario/s0020/csv/s0020_coeqwal_sv_input.csv",
          filename: "s0020_coeqwal_sv_input.csv",
        },
      },
    },
    {
      scenario_id: "s0021",
      files: {
        zip: {
          key: "scenario/s0021/run/s0021_DCRadjBL_2020LU_woTUCP.zip",
          filename: "s0021_DCRadjBL_2020LU_woTUCP.zip",
        },
        output_csv: {
          key: "scenario/s0021/csv/s0021_coeqwal_calsim_output.csv",
          filename: "s0021_coeqwal_calsim_output.csv",
        },
        sv_csv: {
          key: "scenario/s0021/csv/s0021_coeqwal_sv_input.csv",
          filename: "s0021_coeqwal_sv_input.csv",
        },
      },
    },
  ],
}

export async function fetchScenariosForDownload(): Promise<ScenariosResponse> {
  try {
    const response = await fetch(`${FILE_DOWNLOAD_API_BASE}/scenario`, {
      method: "GET",
      mode: "cors", // Explicitly set CORS mode
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      console.warn(`API returned ${response.status}, using fallback scenarios`)
      return FALLBACK_SCENARIOS
    }

    return response.json()
  } catch {
    console.warn("File download API unavailable, using fallback scenarios")
    console.log("Attempted URL:", `${FILE_DOWNLOAD_API_BASE}/scenario`)
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
  return `https://x66ckhp067.execute-api.us-west-2.amazonaws.com/default/download?scenario=${scenarioId}&type=${fileType}`
}
