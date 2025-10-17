import { useState, useEffect, useCallback } from "react"
import { useMap } from "@repo/map"
import {
  fetchTierLocationData,
  type TierLocationResponse,
} from "../../../api/tierLocationApi"

interface UseTierMapDataProps {
  selectedTier: { strategy: string; outcome: string } | null
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

          // Zoom to bounds if available
          if (data.bounds) {
            mapAPI.fitBounds([
              [data.bounds.west, data.bounds.south],
              [data.bounds.east, data.bounds.north],
            ], 50, 0, 0, { duration: 1000 })
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Failed to fetch tier data"))
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

