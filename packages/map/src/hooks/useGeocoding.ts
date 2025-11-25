"use client"

import { useState, useCallback, useRef } from "react"
import { useMap } from "../context/MapContext"
import type {
  GeocodingFeature,
  GeocodingResponse,
  GeocodingOptions,
  UseGeocodingReturn,
} from "../types"

// Mapbox Geocoding API endpoints (v5 is current stable)
const GEOCODING_API_BASE = "https://api.mapbox.com/geocoding/v5/mapbox.places"

// Common bounding boxes for convenience
export const BOUNDING_BOXES = {
  CALIFORNIA: [-124.4, 32.5, -114.1, 42.0] as [number, number, number, number],
  CENTRAL_VALLEY: [-122.5, 35.0, -119.0, 40.5] as [
    number,
    number,
    number,
    number,
  ],
  BAY_AREA: [-123.0, 37.0, -121.5, 38.5] as [number, number, number, number],
  SOCAL: [-119.5, 32.5, -116.0, 34.5] as [number, number, number, number],
} as const

/**
 * Hook for Mapbox geocoding (forward and reverse)
 *
 * @param options - Geocoding configuration options
 * @returns Geocoding API with search, reverse, and result management
 *
 * @example
 * ```tsx
 * // Token is automatically pulled from map context if not provided
 * const geocoding = useGeocoding({
 *   limit: 5,
 *   bbox: BOUNDING_BOXES.CALIFORNIA,  // Limit to California
 *   flyTo: true,
 *   flyToZoom: 14
 * });
 *
 * // Or provide token explicitly
 * const geocoding = useGeocoding({
 *   accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
 *   bbox: BOUNDING_BOXES.CALIFORNIA,
 * });
 *
 * // Search for a place
 * const results = await geocoding.search('Sacramento River');
 *
 * // Select a result (automatically flies to it if flyTo: true)
 * geocoding.selectResult(results[0]);
 *
 * // Reverse geocode coordinates
 * const location = await geocoding.reverse(-121.4944, 38.5816);
 * ```
 */
export function useGeocoding(
  options: Partial<GeocodingOptions>,
): UseGeocodingReturn {
  const { flyTo: mapFlyTo, mapRef } = useMap()
  const [results, setResults] = useState<GeocodingFeature[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Use ref to track abort controller for canceling requests
  const abortControllerRef = useRef<AbortController | null>(null)

  // Get token from options or from map instance
  const getAccessToken = useCallback(() => {
    if (options.accessToken) {
      return options.accessToken
    }

    // Try to get token from mapbox map instance
    const map = mapRef?.current?.getMap()
    // Cast to any to access internal mapbox properties
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapToken =
      (map as any)?._requestManager?._customAccessToken ||
      (map as any)?.accessToken

    if (!mapToken) {
      console.warn(
        "⚠️ No Mapbox access token found. Please provide accessToken option or ensure map has a token.",
      )
    }

    return mapToken || ""
  }, [options.accessToken, mapRef])

  const {
    limit = 5,
    countries,
    proximity,
    types,
    bbox,
    language = "en",
    flyTo = false,
    flyToOptions,
    flyToZoom = 14,
  } = options

  /**
   * Build URL parameters for geocoding request
   */
  const buildParams = useCallback(
    (extraParams: Record<string, string> = {}) => {
      const token = getAccessToken()

      const params = new URLSearchParams({
        access_token: token,
        limit: limit.toString(),
        language,
        ...extraParams,
      })

      if (countries && countries.length > 0) {
        params.append("country", countries.join(","))
      }

      if (proximity) {
        params.append("proximity", proximity.join(","))
      }

      if (types && types.length > 0) {
        params.append("types", types.join(","))
      }

      if (bbox) {
        params.append("bbox", bbox.join(","))
      }

      return params
    },
    [getAccessToken, limit, language, countries, proximity, types, bbox],
  )

  /**
   * Forward geocoding: search for places by query string
   */
  const search = useCallback(
    async (query: string): Promise<GeocodingFeature[]> => {
      if (!query.trim()) {
        setResults([])
        return []
      }

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      setLoading(true)
      setError(null)

      try {
        const encodedQuery = encodeURIComponent(query)
        const params = buildParams()
        const url = `${GEOCODING_API_BASE}/${encodedQuery}.json?${params}`

        const response = await fetch(url, {
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`Geocoding request failed: ${response.statusText}`)
        }

        const data: GeocodingResponse = await response.json()

        setResults(data.features)
        setLoading(false)
        return data.features
      } catch (err) {
        // Don't set error for aborted requests
        if (err instanceof Error && err.name === "AbortError") {
          return []
        }

        const errorObj =
          err instanceof Error ? err : new Error("Geocoding search failed")
        setError(errorObj)
        setLoading(false)
        setResults([])
        return []
      }
    },
    [buildParams],
  )

  /**
   * Reverse geocoding: get place information for coordinates
   */
  const reverse = useCallback(
    async (
      longitude: number,
      latitude: number,
    ): Promise<GeocodingFeature[]> => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      setLoading(true)
      setError(null)

      try {
        const params = buildParams()
        const url = `${GEOCODING_API_BASE}/${longitude},${latitude}.json?${params}`

        const response = await fetch(url, {
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(
            `Reverse geocoding request failed: ${response.statusText}`,
          )
        }

        const data: GeocodingResponse = await response.json()

        setResults(data.features)
        setLoading(false)
        return data.features
      } catch (err) {
        // Don't set error for aborted requests
        if (err instanceof Error && err.name === "AbortError") {
          return []
        }

        const errorObj =
          err instanceof Error
            ? err
            : new Error("Reverse geocoding search failed")
        setError(errorObj)
        setLoading(false)
        setResults([])
        return []
      }
    },
    [buildParams],
  )

  /**
   * Select a result and optionally fly to it
   */
  const selectResult = useCallback(
    (feature: GeocodingFeature) => {
      if (flyTo && mapFlyTo) {
        const [longitude, latitude] = feature.center

        // If feature has bbox, fit to bounds, otherwise fly to center
        if (feature.bbox) {
          // Note: bbox format is [minLng, minLat, maxLng, maxLat]
          // We'd need fitBounds from context, for now just fly to center
          mapFlyTo({
            longitude,
            latitude,
            zoom: flyToZoom,
            bearing: 0,
            pitch: 0,
            transitionOptions: flyToOptions,
          })
        } else {
          mapFlyTo({
            longitude,
            latitude,
            zoom: flyToZoom,
            bearing: 0,
            pitch: 0,
            transitionOptions: flyToOptions,
          })
        }
      }
    },
    [flyTo, mapFlyTo, flyToZoom, flyToOptions],
  )

  /**
   * Clear results and error state
   */
  const clear = useCallback(() => {
    setResults([])
    setError(null)

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  return {
    search,
    reverse,
    results,
    loading,
    error,
    clear,
    selectResult,
  }
}
