/**
 * API functions for fetching tier location data for map visualization
 */

// Type definitions
export interface TierLocation {
  id: string
  tier: number // 1-4
  geometry:
    | {
        type: "Point"
        coordinates: [number, number] // [lng, lat]
      }
    | {
        type: "Polygon"
        coordinates: [number, number][][] // Array of rings
      }
  properties?: Record<string, string | number>
}

export interface TierLocationResponse {
  scenario: string
  outcome: string
  locations: TierLocation[]
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
}

/**
 * Fetch tier location data for a specific scenario and outcome
 * TODO: Replace with actual API endpoint when ready
 */
export async function fetchTierLocationData(
  scenarioId: string,
  outcomeDisplayName: string,
): Promise<TierLocationResponse> {
  // TODO: Replace with actual API call
  // const response = await fetch(
  //   `https://api.coeqwal.org/api/tiers/scenarios/${scenarioId}/outcomes/${outcomeCode}/locations`
  // )
  // return response.json()

  // Mock data for development
  console.log(
    `Fetching tier location data for ${scenarioId} - ${outcomeDisplayName}`,
  )

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Return mock data based on outcome type
  if (outcomeDisplayName === "Environmental flows") {
    // Multi-location point data (17 river locations)
    return {
      scenario: scenarioId,
      outcome: outcomeDisplayName,
      locations: [
        {
          id: "sac_1",
          tier: 2,
          geometry: {
            type: "Point",
            coordinates: [-121.5, 38.5],
          },
          properties: { name: "Sacramento River at Bend Bridge" },
        },
        {
          id: "sac_2",
          tier: 3,
          geometry: {
            type: "Point",
            coordinates: [-122.0, 39.0],
          },
          properties: { name: "Sacramento River at Wilkins Slough" },
        },
        // Add more locations as needed
      ],
      bounds: {
        north: 39.5,
        south: 37.5,
        east: -120.5,
        west: -122.5,
      },
    }
  }

  // Default mock: single point
  return {
    scenario: scenarioId,
    outcome: outcomeDisplayName,
    locations: [
      {
        id: "default",
        tier: 2,
        geometry: {
          type: "Point",
          coordinates: [-121.5, 38.0],
        },
      },
    ],
    bounds: {
      north: 39.0,
      south: 37.0,
      east: -120.0,
      west: -123.0,
    },
  }
}

