"use client"

/* Tier data for the storyboard
 *
 * Fetches per-location tier assignments for the demo scenario and shapes
 * them into the centroids, colors, and per-outcome location sets the
 * animation reads. `useOutcomeTierOverrides` does the same for a
 * non-base hydroclimate variant.
 */

import { useState, useEffect, useMemo, useRef } from "react"
import { useTheme } from "@repo/ui/mui"
import { fetchTierLocationAssignmentsBatch } from "@repo/data/coeqwal"
import { getTierColorsFromTheme, type TierLevel } from "../../../content/tiers"
import { AG_REV_COORDINATES } from "../../map/config/outcomeLocations"

const DEMO_SCENARIO_ID = "s0020"
const TIER_CODE = "AG_REV"

const OUTCOME_CODES_FOR_ANIMATION = [
  "CWS_DEL",
  "AG_REV",
  "ENV_FLOWS",
  "RES_STOR",
  "GW_STOR",
  "DELTA_ECO",
  "FW_EXP",
  "FW_DELTA_USES",
  "WRC_SALMON_AB",
] as const
const OUTCOME_CODES_ARR: string[] = [...OUTCOME_CODES_FOR_ANIMATION]

interface TierLocationRaw {
  location_id: string
  location_name: string
  tier_level: number
  tier_value: number | null
}

interface TierLocationsResponse {
  locations: TierLocationRaw[]
  metadata: {
    total_locations: number
    tier_counts: Record<string, number>
  }
}

export interface Centroid {
  id: string
  lng: number
  lat: number
  tier: TierLevel
  color: string
}

export interface OutcomeLocationData {
  ids: Set<string>
  tierMap: Record<string, TierLevel>
  colorMap: Record<string, string>
  nameMap: Record<string, string>
}

export interface TierAnimationData {
  tierColorMap: Record<string, string>
  centroids: Centroid[]
  tierDistribution: [number, number, number, number]
  tierColors: [string, string, string, string]
  outcomeLocations: Record<string, OutcomeLocationData>
  allLocationIds: Set<string>
  isLoading: boolean
  error: string | null
}

export function useTierAnimationData(): TierAnimationData {
  const theme = useTheme()
  const t1 = theme.palette.tiers.tier1
  const t2 = theme.palette.tiers.tier2
  const t3 = theme.palette.tiers.tier3
  const t4 = theme.palette.tiers.tier4
  const tierColors = useMemo<Record<TierLevel, string>>(
    () => ({ 1: t1, 2: t2, 3: t3, 4: t4 }),
    [t1, t2, t3, t4],
  )
  const colorTuple = useMemo<[string, string, string, string]>(
    () => [t1, t2, t3, t4],
    [t1, t2, t3, t4],
  )

  const [locations, setLocations] = useState<TierLocationsResponse | null>(null)
  const [outcomeLocationResponses, setOutcomeLocationResponses] = useState<
    Record<string, TierLocationsResponse>
  >({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        // One batched request covers all N outcomes. AG_REV is reused
        // below for tierColorMap / tierDistribution. Polygon centroids
        // for the animation come from the hardcoded `AG_REV_COORDINATES`
        // table (geometry policy: no geometry through the API. See
        // coeqwal-backend/database/README.md and packages/map/README.md
        // MTS section)
        const batch = await fetchTierLocationAssignmentsBatch(
          DEMO_SCENARIO_ID,
          OUTCOME_CODES_ARR,
        )

        const outcomeMap: Record<string, TierLocationsResponse> = {}
        for (const [code, resp] of Object.entries(batch.results)) {
          outcomeMap[code] = {
            locations: resp.locations,
            metadata: {
              total_locations: resp.metadata.total_locations,
              tier_counts: resp.metadata.tier_counts,
            },
          }
        }

        const locData = outcomeMap[TIER_CODE] ?? null
        if (!locData) {
          throw new Error(
            `API error: no active rows for ${TIER_CODE} on ${DEMO_SCENARIO_ID}`,
          )
        }

        if (!cancelled) {
          setLocations(locData)
          setOutcomeLocationResponses(outcomeMap)
          setIsLoading(false)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to fetch tier data")
          setIsLoading(false)
        }
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [])

  const tierColorMap = useMemo(() => {
    if (!locations) return {}
    const map: Record<string, string> = {}
    for (const loc of locations.locations) {
      const level = loc.tier_level as TierLevel
      map[loc.location_id] = tierColors[level] || "#888888"
    }
    return map
  }, [locations, tierColors])

  const centroids = useMemo(() => {
    if (!locations) return []
    const result: Centroid[] = []
    for (const loc of locations.locations) {
      const coord = AG_REV_COORDINATES[loc.location_id]
      if (!coord) continue
      const level = loc.tier_level as TierLevel
      result.push({
        id: loc.location_id,
        lng: coord[0],
        lat: coord[1],
        tier: level,
        color: tierColors[level] || "#888888",
      })
    }
    return result
  }, [locations, tierColors])

  const tierDistribution = useMemo((): [number, number, number, number] => {
    if (!locations) return [0, 0, 0, 0]
    const counts = locations.metadata.tier_counts
    const total = locations.metadata.total_locations || 1
    return [
      (counts["1"] || 0) / total,
      (counts["2"] || 0) / total,
      (counts["3"] || 0) / total,
      (counts["4"] || 0) / total,
    ]
  }, [locations])

  const outcomeLocations = useMemo(() => {
    const result: Record<string, OutcomeLocationData> = {}
    for (const [code, resp] of Object.entries(outcomeLocationResponses)) {
      const ids = new Set<string>()
      const tierMap: Record<string, TierLevel> = {}
      const colorMap: Record<string, string> = {}
      const nameMap: Record<string, string> = {}
      for (const loc of resp.locations) {
        ids.add(loc.location_id)
        const level = loc.tier_level as TierLevel
        tierMap[loc.location_id] = level
        colorMap[loc.location_id] = tierColors[level] || "#888888"
        if (loc.location_name) nameMap[loc.location_id] = loc.location_name
      }
      result[code] = { ids, tierMap, colorMap, nameMap }
    }
    return result
  }, [outcomeLocationResponses, tierColors])

  const allLocationIds = useMemo(() => {
    const all = new Set<string>()
    for (const data of Object.values(outcomeLocations)) {
      for (const id of data.ids) all.add(id)
    }
    return all
  }, [outcomeLocations])

  return {
    tierColorMap,
    centroids,
    tierDistribution,
    tierColors: colorTuple,
    outcomeLocations,
    allLocationIds,
    isLoading,
    error,
  }
}

/**
 * Lightweight companion to useTierAnimationData that fetches only per-location
 * tier levels for a non-base hydroclimate variant. Returns {} when on the base
 * scenario so the caller falls through to useTierAnimationData's data.
 *
 * Designed to never trigger a loading flash. Old overrides stay visible until
 * the new fetch completes. Failures per-outcome are silently skipped so outcomes
 * without data for a given hydroclimate fall back to the base (s0020) tiers.
 */
export function useOutcomeTierOverrides(scenarioId: string) {
  const theme = useTheme()
  const tierColors = getTierColorsFromTheme(theme)
  const colorKey = `${tierColors[1]}|${tierColors[2]}|${tierColors[3]}|${tierColors[4]}`
  const tierColorsRef = useRef(tierColors)
  tierColorsRef.current = tierColors

  const [overrides, setOverrides] = useState<
    Record<string, OutcomeLocationData>
  >({})

  useEffect(() => {
    if (scenarioId === DEMO_SCENARIO_ID) {
      setOverrides((prev) => (Object.keys(prev).length === 0 ? prev : {}))
      return
    }

    let cancelled = false
    const colors = tierColorsRef.current

    async function fetchOverrides() {
      // One batched request (server-side ANY($codes)) instead of N parallel
      // per-outcome fetches. Outcomes absent for this scenario land in
      // batch.missing and are silently skipped, matching the previous
      // per-outcome try/catch behavior.
      let batch
      try {
        batch = await fetchTierLocationAssignmentsBatch(
          scenarioId,
          OUTCOME_CODES_ARR,
        )
      } catch {
        return
      }

      if (cancelled) return

      const map: Record<string, OutcomeLocationData> = {}
      for (const [code, data] of Object.entries(batch.results)) {
        const ids = new Set<string>()
        const tierMap: Record<string, TierLevel> = {}
        const colorMap: Record<string, string> = {}
        const nameMap: Record<string, string> = {}
        for (const loc of data.locations) {
          ids.add(loc.location_id)
          const level = loc.tier_level as TierLevel
          tierMap[loc.location_id] = level
          colorMap[loc.location_id] = colors[level] || "#888888"
          if (loc.location_name) nameMap[loc.location_id] = loc.location_name
        }
        map[code] = { ids, tierMap, colorMap, nameMap }
      }
      setOverrides(map)
    }

    fetchOverrides()
    return () => {
      cancelled = true
    }
  }, [scenarioId, colorKey])

  return overrides
}
