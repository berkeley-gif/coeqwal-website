"use client"

import { useMemo, useCallback } from "react"
import booleanPointInPolygon from "@turf/boolean-point-in-polygon"
import type { FeatureCollection, Feature, Polygon, MultiPolygon } from "geojson"

/**
 * Result from point-in-polygon lookup
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface PointInPolygonResult<T = any> {
  /** The feature that contains the point */
  feature: Feature<Polygon | MultiPolygon, T>
  /** Properties from the feature */
  properties: T
  /** Index in the original feature collection */
  index: number
}

/**
 * Options for point-in-polygon search
 */
export interface UsePointInPolygonOptions {
  /** Property name to use as the feature name (default: 'name') */
  nameProperty?: string
  /** Whether to ignore holes in polygons (default: false) */
  ignoreBoundary?: boolean
}

/**
 * Return value from usePointInPolygon hook
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UsePointInPolygonReturn<T = any> {
  /** Find the feature containing a point */
  findContainingFeature: (
    longitude: number,
    latitude: number,
  ) => PointInPolygonResult<T> | null
  /** Get all features */
  features: Feature<Polygon | MultiPolygon, T>[]
  /** Check if a point is in any feature */
  isPointInAnyFeature: (longitude: number, latitude: number) => boolean
}

/**
 * Hook for performing point-in-polygon spatial queries on GeoJSON data
 *
 * @param geoJson - FeatureCollection of Polygons or MultiPolygons
 * @param options - Optional configuration
 * @returns Functions for spatial queries
 *
 * @example
 * ```tsx
 * import { centralValleyBasins } from '@repo/data'
 * import { usePointInPolygon } from '@repo/map'
 *
 * function MyComponent() {
 *   const { findContainingFeature } = usePointInPolygon(centralValleyBasins)
 *
 *   const checkLocation = (lng: number, lat: number) => {
 *     const result = findContainingFeature(lng, lat)
 *
 *     if (result) {
 *       console.log('Found:', result.properties.name)
 *       console.log('Feature:', result.feature)
 *     }
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function usePointInPolygon<T = any>(
  geoJson: FeatureCollection<Polygon | MultiPolygon, T> | null | undefined,
  options: UsePointInPolygonOptions = {},
): UsePointInPolygonReturn<T> {
  const { ignoreBoundary = false } = options

  // Memoize the features array
  const features = useMemo(() => {
    if (!geoJson || !geoJson.features) {
      return []
    }
    return geoJson.features as Feature<Polygon | MultiPolygon, T>[]
  }, [geoJson])

  /**
   * Find which feature contains a given point
   */
  const findContainingFeature = useCallback(
    (longitude: number, latitude: number): PointInPolygonResult<T> | null => {
      if (!features || features.length === 0) {
        return null
      }

      const point: [number, number] = [longitude, latitude]

      // Check each feature
      for (let i = 0; i < features.length; i++) {
        const feature = features[i]

        if (!feature) continue

        try {
          // Use Turf.js to check if point is in polygon
          // Cast feature to satisfy Turf's type requirements
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const isInside = booleanPointInPolygon(point, feature as any, {
            ignoreBoundary,
          })

          if (isInside) {
            return {
              feature,
              properties: feature.properties || ({} as T),
              index: i,
            }
          }
        } catch (error) {
          console.warn(
            `Error checking point in polygon for feature ${i}:`,
            error,
          )
          continue
        }
      }

      return null
    },
    [features, ignoreBoundary],
  )

  /**
   * Check if point is in ANY feature (faster than findContainingFeature if you just need boolean)
   */
  const isPointInAnyFeature = useCallback(
    (longitude: number, latitude: number): boolean => {
      return findContainingFeature(longitude, latitude) !== null
    },
    [findContainingFeature],
  )

  return {
    findContainingFeature,
    features,
    isPointInAnyFeature,
  }
}

/**
 * Helper hook specifically for basin lookups
 *
 * @example
 * ```tsx
 * import { centralValleyBasins } from '@repo/data'
 * import { useBasinLookup } from '@repo/map'
 *
 * function BasinFinder() {
 *   const { findBasin } = useBasinLookup(centralValleyBasins)
 *
 *   const basin = findBasin(-121.4944, 38.5816)
 *   console.log(basin?.name) // "Sacramento River Basin"
 * }
 * ```
 */
export function useBasinLookup(
  basinGeoJson: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FeatureCollection<Polygon | MultiPolygon, any> | null | undefined,
) {
  const { findContainingFeature, features, isPointInAnyFeature } =
    usePointInPolygon(basinGeoJson, {
      nameProperty: "name",
    })

  const findBasin = useCallback(
    (longitude: number, latitude: number) => {
      const result = findContainingFeature(longitude, latitude)
      return result
        ? {
            name: result.properties.name || "Unknown Basin",
            properties: result.properties,
            feature: result.feature,
          }
        : null
    },
    [findContainingFeature],
  )

  return {
    findBasin,
    basins: features,
    isInBasin: isPointInAnyFeature,
  }
}
