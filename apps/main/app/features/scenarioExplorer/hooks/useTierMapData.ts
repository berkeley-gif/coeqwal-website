import { useState, useEffect, useCallback } from "react"
import { useMap } from "@repo/map"
import {
  fetchTierLocationData,
  type TierLocationResponse,
  type TierFeature,
} from "../../../api/tierLocationApi"

interface UseTierMapDataProps {
  selectedTier: { strategy: string; outcome: string } | null
}

// Calculate bounds from GeoJSON features
function calculateBounds(
  features: TierFeature[],
): [[number, number], [number, number]] {
  let minLng = Infinity
  let maxLng = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  features.forEach((feature) => {
    if (feature.geometry.type === "Point") {
      const [lng, lat] = feature.geometry.coordinates as [number, number]
      minLng = Math.min(minLng, lng)
      maxLng = Math.max(maxLng, lng)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    } else if (feature.geometry.type === "Polygon") {
      const coords = feature.geometry.coordinates as [number, number][][]
      coords[0]?.forEach(([lng, lat]) => {
        minLng = Math.min(minLng, lng)
        maxLng = Math.max(maxLng, lng)
        minLat = Math.min(minLat, lat)
        maxLat = Math.max(maxLat, lat)
      })
    } else if (feature.geometry.type === "MultiPolygon") {
      const coords = feature.geometry.coordinates as [number, number][][][]
      coords.forEach((polygon) => {
        polygon[0]?.forEach(([lng, lat]) => {
          minLng = Math.min(minLng, lng)
          maxLng = Math.max(maxLng, lng)
          minLat = Math.min(minLat, lat)
          maxLat = Math.max(maxLat, lat)
        })
      })
    }
  })

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ]
}

/**
 * Hook to manage tier location data fetching and map zoom
 */
export function useTierMapData({ selectedTier }: UseTierMapDataProps) {
  const mapAPI = useMap()
  const [tierData, setTierData] = useState<TierLocationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Fetch tier location data when selection changes
  useEffect(() => {
    if (!selectedTier) {
      setTierData(null)
      return
    }

    let cancelled = false

    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)

        const data = await fetchTierLocationData(
          selectedTier!.strategy,
          selectedTier!.outcome,
        )

        if (!cancelled) {
          setTierData(data)

          // Calculate bounds from features and zoom
          if (data.features.length > 0) {
            const bounds = calculateBounds(data.features)
            mapAPI.fitBounds(bounds, 50, 0, 0, { duration: 1000 })
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error("Failed to fetch tier data"),
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [selectedTier, mapAPI])

  const clearTierData = useCallback(() => {
    setTierData(null)
    setError(null)
  }, [])

  return {
    tierData,
    isLoading,
    error,
    clearTierData,
  }
}
