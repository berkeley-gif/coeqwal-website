"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useTheme } from "@repo/ui/mui"
import { fetchTierLocationAssignmentsBatch } from "@repo/data/coeqwal"
import {
  getTierColorsFromTheme,
  type TierLevel,
} from "../../../content/tiers"
import { API_BASE } from "../../../lib/constants/api"

const DEMO_SCENARIO_ID = "s0020"
const TIER_CODE = "AG_REV"

// Keep as readonly literal for autocomplete in the component, but normalize
// once here so both the batch-fetcher call and the outcome bookkeeping use the
// same ordered list. Also export the mutable copy passed to the batch fetcher
// so callers of useOutcomeTierOverrides stay in sync.
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

interface GeoJSONFeature {
  type: "Feature"
  geometry: {
    type: string
    coordinates: number[] | number[][][] | number[][][][]
  }
  properties: {
    location_id: string
    tier_level: number
  }
}

interface GeoJSONResponse {
  type: "FeatureCollection"
  features: GeoJSONFeature[]
}

function computeCentroid(
  geometry: GeoJSONFeature["geometry"],
): [number, number] | null {
  if (geometry.type === "Point") {
    const coords = geometry.coordinates as number[]
    if (coords[0] == null || coords[1] == null) return null
    return [coords[0], coords[1]]
  }

  let sumLng = 0
  let sumLat = 0
  let count = 0

  function walkCoords(arr: unknown) {
    if (!Array.isArray(arr)) return
    if (typeof arr[0] === "number") {
      sumLng += arr[0] as number
      sumLat += arr[1] as number
      count++
    } else {
      for (const sub of arr) walkCoords(sub)
    }
  }

  walkCoords(geometry.coordinates)
  if (count === 0) return null
  return [sumLng / count, sumLat / count]
}

export function useTierAnimationData(): TierAnimationData {
  const theme = useTheme()
  // Stabilize the tier-color lookup against render-identity churn. `theme`
  // itself is a stable MUI object across renders, but
  // `getTierColorsFromTheme(theme)` returns a fresh `{1,2,3,4}` object on
  // every call. Without this memo, every render produces a new `tierColors`
  // identity, which in turn invalidates every downstream memo that lists
  // `tierColors` as a dep (centroids, outcomeLocations, tierColorMap). That
  // cascade caused consumer effects keyed on those memos (most notably the
  // Beat 5 driver in TierAnimationSection, which has `outcomeLocations` in
  // its deps) to tear down and remount on every parent render, clearing
  // local `ringActive`/`hoverActive`/`popupActive` flags and preventing the
  // Beat 5 choreography from ever settling into its visible state.
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
  const [geojson, setGeojson] = useState<GeoJSONResponse | null>(null)
  const [outcomeLocationResponses, setOutcomeLocationResponses] = useState<
    Record<string, TierLocationsResponse>
  >({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        // One batch call covers all N outcomes (including AG_REV, which we
        // reuse below for tierColorMap / tierDistribution). The GeoJSON
        // endpoint is still the sole source of polygon centroids for the
        // animation; no batch equivalent exists, so it stays as a direct
        // fetch. All other per-outcome calls are consolidated.
        const [batch, geoRes] = await Promise.all([
          fetchTierLocationAssignmentsBatch(
            DEMO_SCENARIO_ID,
            OUTCOME_CODES_ARR,
          ),
          fetch(`${API_BASE}/tier-map/${DEMO_SCENARIO_ID}/${TIER_CODE}`),
        ])

        if (!geoRes.ok) {
          throw new Error(`API error: geojson=${geoRes.status}`)
        }

        const geoData: GeoJSONResponse = await geoRes.json()

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
          setGeojson(geoData)
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
    if (!geojson) return []
    const result: Centroid[] = []
    for (const feature of geojson.features) {
      const center = computeCentroid(feature.geometry)
      if (!center) continue
      const level = feature.properties.tier_level as TierLevel
      result.push({
        id: feature.properties.location_id,
        lng: center[0],
        lat: center[1],
        tier: level,
        color: tierColors[level] || "#888888",
      })
    }
    return result
  }, [geojson, tierColors])

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
 * Designed to never trigger a loading flash - old overrides stay visible until
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
