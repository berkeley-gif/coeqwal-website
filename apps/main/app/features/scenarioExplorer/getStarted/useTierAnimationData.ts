"use client"

import { useState, useEffect, useMemo } from "react"
import { useTheme } from "@repo/ui/mui"
import { getTierColorsFromTheme, type TierLevel } from "../../../content/tiers"
import { API_BASE } from "../../../lib/constants/api"

const DEMO_SCENARIO_ID = "s0020"
const TIER_CODE = "AG_REV"

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

export interface TierAnimationData {
  tierColorMap: Record<string, string>
  centroids: Centroid[]
  tierDistribution: [number, number, number, number]
  tierColors: [string, string, string, string]
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

function computeCentroid(geometry: GeoJSONFeature["geometry"]): [number, number] | null {
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
  const tierColors = getTierColorsFromTheme(theme)
  const colorTuple: [string, string, string, string] = [
    tierColors[1], tierColors[2], tierColors[3], tierColors[4],
  ]

  const [locations, setLocations] = useState<TierLocationsResponse | null>(null)
  const [geojson, setGeojson] = useState<GeoJSONResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        const [locRes, geoRes] = await Promise.all([
          fetch(`${API_BASE}/tier-map/${DEMO_SCENARIO_ID}/${TIER_CODE}/locations`),
          fetch(`${API_BASE}/tier-map/${DEMO_SCENARIO_ID}/${TIER_CODE}`),
        ])

        if (!locRes.ok || !geoRes.ok) {
          throw new Error(`API error: locations=${locRes.status}, geojson=${geoRes.status}`)
        }

        const locData: TierLocationsResponse = await locRes.json()
        const geoData: GeoJSONResponse = await geoRes.json()

        if (!cancelled) {
          setLocations(locData)
          setGeojson(geoData)
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
    return () => { cancelled = true }
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

  return {
    tierColorMap,
    centroids,
    tierDistribution,
    tierColors: colorTuple,
    isLoading,
    error,
  }
}
