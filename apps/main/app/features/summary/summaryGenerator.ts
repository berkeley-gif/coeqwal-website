/**
 * Smart summary generator
 * Analyzes tier data and generates plain language summaries
 * 
 * Experimental, demo version
 */

import { TierLocationsResponse } from "../map/hooks/useOutcomeMapLayer"
import { TIER_LABELS, TierLevel } from "../../content/tiers"
import { getDemandUnitNameInfo } from "../map/config/demandUnitNames"

// Feature properties from Mapbox layer
export interface DemandUnitProperties {
  DU_ID: string
  Urb_Name: string | null // Primary name for CWS (Urban)
  Mod_Name: string | null // Secondary name for CWS, primary for others
  Sub_Name: string | null
  Type: string | null
  Comments: string | null
  Class: string // "Urban", "Agriculture", etc.
  longitude?: number
  latitude?: number
}

// Location with issues
export interface AtRiskLocation {
  duId: string
  primaryName: string // Urb_Name for CWS, Mod_Name for others
  secondaryName: string | null // Mod_Name for CWS if both exist
  subName: string | null
  classType: string | null
  tierLevel: number
  tierLabel: string
  coordinates: [number, number] | null
}

/**
 * Get the display name for a demand unit
 * Priority: Sub_Name > Urb_Name > Mod_Name > staticMapping > apiName > locationId
 */
function getDisplayName(
  props: DemandUnitProperties | undefined,
  locationId: string,
  apiName?: string, // Fallback from API when Mapbox tiles not loaded
): { primary: string; secondary: string | null } {
  // Priority: Sub_Name > Urb_Name > Mod_Name (from Mapbox props)
  if (props) {
    const subName = props.Sub_Name?.trim()
    const urbName = props.Urb_Name?.trim()
    const modName = props.Mod_Name?.trim()

    if (subName && subName !== '') {
      return {
        primary: subName,
        secondary: urbName || modName || null,
      }
    }

    if (urbName && urbName !== '') {
      return {
        primary: urbName,
        secondary: modName || null,
      }
    }

    if (modName && modName !== '') {
      return {
        primary: modName,
        secondary: null,
      }
    }
  }

  // Fallback to static mapping when Mapbox tiles not loaded
  const staticInfo = getDemandUnitNameInfo(locationId)
  if (staticInfo) {
    const subName = staticInfo.subName
    const urbName = staticInfo.urbName
    const modName = staticInfo.modName
    
    if (subName) {
      return { primary: subName, secondary: urbName || modName || null }
    }
    if (urbName) {
      return { primary: urbName, secondary: modName || null }
    }
    if (modName) {
      return { primary: modName, secondary: null }
    }
  }

  // Fallback to API name if Mapbox props not available
  if (apiName && apiName !== locationId) {
    return {
      primary: apiName,
      secondary: null,
    }
  }

  return {
    primary: locationId,
    secondary: null,
  }
}

// Generated summary structure
export interface OutcomeSummary {
  headline: string
  details: string
  tierBreakdown: {
    tier1: { count: number; percentage: number }
    tier2: { count: number; percentage: number }
    tier3: { count: number; percentage: number }
    tier4: { count: number; percentage: number }
  }
  atRiskLocations: AtRiskLocation[]
  criticalLocations: AtRiskLocation[]
}

// Scenario-level summary
export interface ScenarioSummary {
  headline: string
  keyInsights: string[]
  outcomeSummaries: Record<string, string>
}

/**
 * Analyze tier distribution and return counts/percentages
 */
function analyzeTierDistribution(tierData: TierLocationsResponse) {
  const total = tierData.locations.length
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0 }

  tierData.locations.forEach((loc) => {
    if (loc.tier_level >= 1 && loc.tier_level <= 4) {
      counts[loc.tier_level as 1 | 2 | 3 | 4]++
    }
  })

  return {
    tier1: {
      count: counts[1],
      percentage: total > 0 ? (counts[1] / total) * 100 : 0,
    },
    tier2: {
      count: counts[2],
      percentage: total > 0 ? (counts[2] / total) * 100 : 0,
    },
    tier3: {
      count: counts[3],
      percentage: total > 0 ? (counts[3] / total) * 100 : 0,
    },
    tier4: {
      count: counts[4],
      percentage: total > 0 ? (counts[4] / total) * 100 : 0,
    },
  }
}

/**
 * Generate a qualitative assessment based on tier distribution
 */
function getQualitativeAssessment(
  breakdown: ReturnType<typeof analyzeTierDistribution>,
): string {
  const optimalPct = breakdown.tier1.percentage
  const criticalPct = breakdown.tier4.percentage
  const atRiskPct = breakdown.tier3.percentage
  // subOptimalPct available via breakdown.tier2.percentage if needed

  // Mostly optimal
  if (optimalPct >= 80) {
    return "performing excellently"
  } else if (optimalPct >= 60) {
    if (criticalPct > 5) {
      return "performing well overall, but with some areas of serious concern"
    }
    return "performing well overall"
  } else if (optimalPct >= 40) {
    if (criticalPct > 10) {
      return "showing mixed results with significant areas at critical levels"
    }
    return "showing mixed results"
  } else if (atRiskPct + criticalPct >= 50) {
    return "facing significant challenges"
  } else {
    return "under considerable stress"
  }
}

/**
 * Generate headline for an outcome
 */
function generateHeadline(
  outcome: string,
  breakdown: ReturnType<typeof analyzeTierDistribution>,
): string {
  const assessment = getQualitativeAssessment(breakdown)

  switch (outcome) {
    case "Community deliveries":
      return `Community water systems are ${assessment} under this scenario.`
    case "Agricultural revenue":
      return `Agricultural water deliveries are ${assessment} under this scenario.`
    default:
      return `${outcome} is ${assessment} under this scenario.`
  }
}

/**
 * Generate detailed analysis text
 */
function generateDetails(
  outcome: string,
  breakdown: ReturnType<typeof analyzeTierDistribution>,
  total: number,
  atRiskCount: number,
  criticalCount: number,
): string {
  const optimalPct = Math.round(breakdown.tier1.percentage)
  const subOptimalPct = Math.round(breakdown.tier2.percentage)
  // atRiskPct and criticalPct available via breakdown.tier3/4.percentage if needed

  const parts: string[] = []

  // Opening statement about the majority
  if (optimalPct >= 50) {
    parts.push(
      `${optimalPct}% of locations (${breakdown.tier1.count} of ${total}) are receiving optimal water deliveries.`,
    )
  } else if (optimalPct + subOptimalPct >= 50) {
    parts.push(
      `${optimalPct + subOptimalPct}% of locations are at optimal or sub-optimal levels.`,
    )
  }

  // Note about concerns
  if (criticalCount > 0) {
    parts.push(
      `However, ${criticalCount} location${criticalCount === 1 ? " is" : "s are"} at critical levels, requiring immediate attention.`,
    )
  } else if (atRiskCount > 0) {
    parts.push(
      `${atRiskCount} location${atRiskCount === 1 ? " is" : "s are"} at-risk and should be monitored.`,
    )
  }

  return parts.join(" ")
}

/**
 * Generate a full outcome summary
 */
export function generateOutcomeSummary(
  outcome: string,
  tierData: TierLocationsResponse,
  featureProperties?: Map<string, DemandUnitProperties>,
  apiNames?: Map<string, string>, // Fallback names from API when Mapbox tiles not loaded
): OutcomeSummary {
  const breakdown = analyzeTierDistribution(tierData)
  const total = tierData.locations.length

  // Identify at-risk and critical locations
  const atRiskLocations: AtRiskLocation[] = []
  const criticalLocations: AtRiskLocation[] = []

  tierData.locations.forEach((loc) => {
    if (loc.tier_level === 3 || loc.tier_level === 4) {
      const props = featureProperties?.get(loc.location_id)
      const apiName = apiNames?.get(loc.location_id)
      const displayNames = getDisplayName(props, loc.location_id, apiName)

      const location: AtRiskLocation = {
        duId: loc.location_id,
        primaryName: displayNames.primary,
        secondaryName: displayNames.secondary,
        subName: props?.Sub_Name || null,
        classType: props?.Class || null,
        tierLevel: loc.tier_level,
        tierLabel: TIER_LABELS[loc.tier_level as TierLevel],
        coordinates:
          props?.longitude && props?.latitude
            ? [props.longitude, props.latitude]
            : null,
      }

      if (loc.tier_level === 3) {
        atRiskLocations.push(location)
      } else {
        criticalLocations.push(location)
      }
    }
  })

  return {
    headline: generateHeadline(outcome, breakdown),
    details: generateDetails(
      outcome,
      breakdown,
      total,
      atRiskLocations.length,
      criticalLocations.length,
    ),
    tierBreakdown: breakdown,
    atRiskLocations,
    criticalLocations,
  }
}

/**
 * Generate a scenario-level summary based on multiple outcomes
 */
export function generateScenarioSummary(
  scenarioId: string,
  outcomeTiers: Record<string, TierLocationsResponse>,
): ScenarioSummary {
  const insights: string[] = []
  const outcomeSummaries: Record<string, string> = {}

  // Analyze each outcome
  Object.entries(outcomeTiers).forEach(([outcome, tierData]) => {
    const breakdown = analyzeTierDistribution(tierData)
    const assessment = getQualitativeAssessment(breakdown)
    outcomeSummaries[outcome] = assessment
  })

  // Generate headline based on overall picture
  const headlines: string[] = []

  // Check community and agricultural water
  const cwsAssessment = outcomeSummaries["Community deliveries"]
  const agAssessment = outcomeSummaries["Agricultural revenue"]

  if (cwsAssessment && agAssessment) {
    if (cwsAssessment.includes("well") && agAssessment.includes("well")) {
      headlines.push(
        "This scenario favors community and agricultural water deliveries",
      )
    } else if (cwsAssessment.includes("well")) {
      headlines.push("This scenario favors community water deliveries")
    } else if (agAssessment.includes("well")) {
      headlines.push("This scenario favors agricultural water deliveries")
    }
  }

  // Build key insights
  if (cwsAssessment?.includes("concern") || cwsAssessment?.includes("stress")) {
    insights.push("Not every community is served equally under this scenario.")
  }

  // Add more outcome-specific insights here as we expand

  return {
    headline: headlines.join(", ") + ".",
    keyInsights: insights,
    outcomeSummaries,
  }
}

/**
 * Format a list of location names for display
 */
export function formatLocationList(
  locations: AtRiskLocation[],
  maxItems = 5,
): string {
  if (locations.length === 0) return ""

  // Group by primary name to avoid repetition
  const uniqueNames = [...new Set(locations.map((l) => l.primaryName))]

  if (uniqueNames.length <= maxItems) {
    if (uniqueNames.length === 1) {
      return uniqueNames[0] ?? ""
    }
    return (
      uniqueNames.slice(0, -1).join(", ") +
      " and " +
      (uniqueNames[uniqueNames.length - 1] ?? "")
    )
  }

  return (
    uniqueNames.slice(0, maxItems).join(", ") +
    ` and ${uniqueNames.length - maxItems} others`
  )
}

/**
 * Generate a detailed insight for a specific outcome with location links
 */
export function generateOutcomeInsight(
  outcome: string,
  summary: OutcomeSummary,
): string {
  const { tierBreakdown, atRiskLocations, criticalLocations } = summary
  const total = Object.values(tierBreakdown).reduce(
    (sum, t) => sum + t.count,
    0,
  )

  const parts: string[] = []

  // Opening based on outcome type
  if (outcome === "Community deliveries") {
    parts.push("Looking at community water system data,")

    if (tierBreakdown.tier1.percentage >= 80) {
      parts.push(
        `we can see that the vast majority (${tierBreakdown.tier1.count} of ${total}) of water systems are thriving under this scenario.`,
      )
    } else if (tierBreakdown.tier1.percentage >= 50) {
      parts.push(
        `we can see that most water systems are doing well under this scenario, but a minority are not.`,
      )
    } else {
      parts.push(
        `we can see significant challenges facing water systems under this scenario.`,
      )
    }

    // Add critical/at-risk details
    if (criticalLocations.length > 0) {
      const names = formatLocationList(criticalLocations)
      parts.push(`The critical areas are ${names}.`)
    } else if (atRiskLocations.length > 0) {
      const names = formatLocationList(atRiskLocations)
      parts.push(`The at-risk areas are ${names}.`)
    }
  } else if (outcome === "Agricultural revenue") {
    parts.push("Looking at agricultural water delivery data,")

    if (tierBreakdown.tier1.percentage >= 80) {
      parts.push(
        `agricultural districts are largely thriving (${tierBreakdown.tier1.count} of ${total} at optimal levels).`,
      )
    } else if (tierBreakdown.tier1.percentage >= 50) {
      parts.push(
        `most agricultural districts are receiving adequate water, though some are struggling.`,
      )
    } else {
      parts.push(
        `agricultural districts face significant water delivery challenges.`,
      )
    }

    if (criticalLocations.length > 0) {
      const names = formatLocationList(criticalLocations)
      parts.push(`Districts at critical levels include ${names}.`)
    }
  }

  return parts.join(" ")
}
