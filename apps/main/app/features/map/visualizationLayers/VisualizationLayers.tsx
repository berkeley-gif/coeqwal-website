"use client"

/**
 * VisualizationLayers - groups all outcome visualization layers
 *
 * These layers show data based on user-selected outcomes.
 *
 * Includes:
 * - BasemapDimOverlay (dims the map when visualization is active)
 * - OutcomePolygonLayer (demand-units, WBA, delta, reservoir)
 * - TierMarkers (non-polygon outcomes)
 * - ReservoirLabels
 * - HotspotMarkers
 * - Tooltips
 */

import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { useMap, Source, Layer } from "@repo/map"

// Components
import TierMarkers from "./components/TierMarkers"
import type { HoveredFeatureInfo } from "./types"
import { ReservoirLabels } from "./components/ReservoirLabels"
import { HotspotMarkers } from "./components/HotspotMarkers"
import { OutcomePolygonLayer } from "./components/OutcomePolygonLayer"
import { PoiMarker } from "./components/PoiMarker"

// Hooks
import { useOutcomeVisualization } from "./hooks/useOutcomeVisualization"
import { useOutcomeTooltip } from "./hooks/useOutcomeTooltip"

// Config
import { BASEMAP_DIM_OPACITY } from "../config/outcomeLayerRegistry"

// Tooltips
import { MapFeatureTooltip } from "../../tooltips/MapFeatureTooltip"

// API
import {
  fetchTierLocationData,
  type TierLocationResponse,
} from "../../../lib/api/tierLocationApi"

// Store
import { useMapMode, useGeocoderMarker } from "../store"

// Large polygon covering California and surrounding area for dim overlay
const DIM_OVERLAY_GEOJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-130, 30], // SW corner (Pacific Ocean)
            [-130, 45], // NW corner
            [-110, 45], // NE corner (Nevada/Oregon)
            [-110, 30], // SE corner (Arizona)
            [-130, 30], // Close polygon
          ],
        ],
      },
    },
  ],
}

export default function VisualizationLayers() {
  const map = useMap()
  const mapMode = useMapMode()
  const geocoderMarker = useGeocoderMarker()

  // Get outcome visualization data
  const {
    outcome,
    strategy,
    config,
    geometryType,
    layerType,
    isActive: isVisualizationActive,
    usesMapboxLayers,
    tierColorMap,
    tierLevelMap,
    locationData,
    featureIds,
  } = useOutcomeVisualization()

  // Tooltip state for Mapbox layer interactions (polygons)
  const { 
    hoveredFeature: polygonHovered, 
    pinnedFeatures: polygonPinnedFeatures, 
    clearPinned: clearPolygonPinned,
  } = useOutcomeTooltip({
    config,
    tierLevelMap,
    locationData,
    enabled: isVisualizationActive && usesMapboxLayers,
  })

  // Tooltip state for point markers (TierMarkers)
  const [pointHovered, setPointHovered] = useState<HoveredFeatureInfo | null>(null)
  const [pointPinnedFeatures, setPointPinnedFeatures] = useState<HoveredFeatureInfo[]>([])
  
  // Track recently unpinned features to suppress hover tooltip
  const suppressedFeaturesRef = useRef<Set<string>>(new Set())

  // Clear point pinned when outcome changes
  useEffect(() => {
    setPointPinnedFeatures([])
    suppressedFeaturesRef.current.clear()
  }, [outcome])

  // Handlers for TierMarkers
  const handlePointHover = useCallback((feature: HoveredFeatureInfo | null) => {
    // If mouse leaves, clear suppression for that feature
    if (feature === null) {
      // Clear all suppressions on mouse leave (user moved away)
      suppressedFeaturesRef.current.clear()
    }
    setPointHovered(feature)
  }, [])

  const handlePointClick = useCallback((feature: HoveredFeatureInfo) => {
    // Toggle: if already pinned, remove it; otherwise add it
    setPointPinnedFeatures(prev => {
      const existingIndex = prev.findIndex(f => f.featureId === feature.featureId)
      if (existingIndex >= 0) {
        // Unpinning: suppress hover tooltip for this feature
        suppressedFeaturesRef.current.add(feature.featureId)
        return prev.filter((_, i) => i !== existingIndex)
      } else {
        // Pinning: remove from suppression if it was there
        suppressedFeaturesRef.current.delete(feature.featureId)
        return [...prev, feature]
      }
    })
  }, [])

  const clearPointPinned = useCallback((featureId: string) => {
    // Suppress hover tooltip when closing via X button
    suppressedFeaturesRef.current.add(featureId)
    setPointPinnedFeatures(prev => prev.filter(f => f.featureId !== featureId))
  }, [])

  // Combine hover from both sources (point hover takes precedence)
  const hoveredFeature = pointHovered || polygonHovered
  
  // Combine all pinned features from both sources
  const allPinnedFeatures = [...pointPinnedFeatures, ...polygonPinnedFeatures]
  
  // Check if hover target is already pinned (don't show duplicate)
  const isHoveredAlreadyPinned = hoveredFeature 
    ? allPinnedFeatures.some(f => f.featureId === hoveredFeature.featureId)
    : false
    
  // Check if hover target was just unpinned (suppress hover tooltip)
  const isHoveredSuppressed = hoveredFeature
    ? suppressedFeaturesRef.current.has(hoveredFeature.featureId)
    : false
    
  // Clear suppression when hover ends (for polygon features)
  useEffect(() => {
    if (!polygonHovered) {
      suppressedFeaturesRef.current.clear()
    }
  }, [polygonHovered])

  // Tier location data for React-rendered markers (non-polygon outcomes)
  const [tierData, setTierData] = useState<TierLocationResponse | null>(null)

  // Fetch tier data for non-Mapbox outcomes
  useEffect(() => {
    if (!outcome || usesMapboxLayers) {
      setTierData(null)
      return
    }

    if (mapMode === "hidden") {
      setTierData(null)
      return
    }

    let cancelled = false

    async function fetchData() {
      try {
        const data = await fetchTierLocationData(strategy, outcome!)

        if (!cancelled) {
          setTierData(data)

          // Zoom to show all markers
          if (data.features.length > 0 && map.mapRef?.current) {
            let minLng = Infinity,
              minLat = Infinity,
              maxLng = -Infinity,
              maxLat = -Infinity

            data.features.forEach((feature) => {
              if (feature.geometry.type === "Point") {
                const [lng, lat] = feature.geometry.coordinates as [number, number]
                minLng = Math.min(minLng, lng)
                minLat = Math.min(minLat, lat)
                maxLng = Math.max(maxLng, lng)
                maxLat = Math.max(maxLat, lat)
              }
            })

            if (minLng !== Infinity) {
              const isExplore = mapMode === "explore"
              const leftPadding = isExplore ? window.innerWidth / 2 : 0

              map.mapRef.current.fitBounds(
                [
                  [minLng, minLat],
                  [maxLng, maxLat],
                ],
                {
                  padding: isExplore
                    ? { left: leftPadding + 100, top: 100, right: 50, bottom: 50 }
                    : 100,
                  maxZoom: 9,
                  duration: 1000,
                }
              )
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch tier location data:", err)
        if (!cancelled) {
          setTierData(null)
        }
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [outcome, strategy, usesMapboxLayers, map, mapMode])

  const isLearnMode = mapMode === "learn"

  // Memoize dim opacity to avoid unnecessary re-renders
  const dimOpacity = useMemo(
    () => (isVisualizationActive ? BASEMAP_DIM_OPACITY : 0),
    [isVisualizationActive]
  )

  return (
    <>
      {/* Basemap dim overlay - darkens map when visualization is active */}
      <Source id="basemap-dim-source" type="geojson" data={DIM_OVERLAY_GEOJSON}>
        <Layer
          id="basemap-dim-overlay"
          type="fill"
          paint={{
            "fill-color": "#000000",
            "fill-opacity": dimOpacity,
          }}
        />
      </Source>

      {/* Point of interest marker (Learn mode only) */}
      {isLearnMode && geocoderMarker && (
        <PoiMarker coordinates={geocoderMarker} />
      )}

      {/* Polygon layer (demand-units, WBA, delta, reservoir) */}
      {isVisualizationActive && geometryType === "polygon" && config && (
        <OutcomePolygonLayer
          tierColorMap={tierColorMap}
          layerType={layerType!}
          idProperty={config.idProperty}
          featureIds={featureIds}
          classFilter={config.classFilter}
          visible={true}
          mapboxLayerId={config.mapboxLayerId}
        />
      )}

      {/* React markers for non-Mapbox outcomes */}
      {tierData && !usesMapboxLayers && (
        <TierMarkers
          data={tierData}
          onHover={handlePointHover}
          onClick={handlePointClick}
        />
      )}

      {/* Reservoir labels */}
      {layerType === "reservoir" && Object.keys(tierLevelMap).length > 0 && (
        <ReservoirLabels tierLookup={tierLevelMap} />
      )}

      {/* Hotspot markers for tier 4 locations */}
      <HotspotMarkers
        outcome={outcome}
        strategy={strategy}
        visible={
          !!outcome &&
          (outcome === "Community deliveries" || outcome === "Salmon abundance")
        }
      />

      {/* Pinned tooltips (multiple allowed) */}
      {allPinnedFeatures.map((feature) => (
        <MapFeatureTooltip
          key={`pinned-${feature.featureId}`}
          feature={feature}
          isPinned={true}
          onClose={() => {
            // Suppress hover tooltip when closing via X button
            suppressedFeaturesRef.current.add(feature.featureId)
            // Clear from appropriate source based on geometry type
            if (feature.geometryType === "point") {
              clearPointPinned(feature.featureId)
            } else {
              clearPolygonPinned(feature.featureId)
            }
          }}
        />
      ))}

      {/* Hover tooltip (only if not already pinned and not just unpinned) */}
      {hoveredFeature && !isHoveredAlreadyPinned && !isHoveredSuppressed && (
        <MapFeatureTooltip
          key="hover"
          feature={hoveredFeature}
          isPinned={false}
          onClose={() => {}}
        />
      )}
    </>
  )
}
