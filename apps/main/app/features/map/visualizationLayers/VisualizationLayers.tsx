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
 * - TierLocationLabels (reservoirs, pumping plants, compliance stations)
 * - HotspotMarkers
 * - Tooltips (unified via useMapTooltips hook)
 */

import { useEffect, useState, useMemo, useRef } from "react"
import { useMap, Source, Layer } from "@repo/map"

// Components
import TierMarkers from "./components/TierMarkers"
import { TierLocationLabels } from "./components/TierLocationLabels"
import { HotspotMarkers } from "./components/HotspotMarkers"
import { OutcomePolygonLayer } from "./components/OutcomePolygonLayer"
import { PoiMarker } from "./components/PoiMarker"

// Hooks
import { useOutcomeVisualization } from "./hooks/useOutcomeVisualization"
import { useMapTooltips } from "./hooks/useMapTooltips"

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
import { useMapMode, useGeocoderMarker, useClearTooltipsSignal } from "../store"

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
    scenarioId,
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

  // Unified tooltip state for all map features (polygons + point markers)
  const {
    hoveredFeature,
    pinnedFeatures,
    isHoveredAlreadyPinned,
    handlePointHover,
    handlePointClick,
    clearPinned,
    clearAllPinned,
  } = useMapTooltips({
    polygonConfig: config,
    tierLevelMap,
    locationData,
    polygonEnabled: isVisualizationActive && usesMapboxLayers,
  })

  // Clear all pinned tooltips when signal changes (triggered by glyph clicks)
  const clearTooltipsSignal = useClearTooltipsSignal()
  const prevSignalRef = useRef(clearTooltipsSignal)
  useEffect(() => {
    if (clearTooltipsSignal !== prevSignalRef.current) {
      prevSignalRef.current = clearTooltipsSignal
      clearAllPinned()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTooltipsSignal])

  // Tier location data for React-rendered markers (non-polygon outcomes)
  const [tierData, setTierData] = useState<TierLocationResponse | null>(null)

  // Fetch tier data for non-Mapbox outcomes
  useEffect(() => {
    if (!outcome || !scenarioId || usesMapboxLayers) {
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
        console.log("VisualizationLayers - Fetching tier data for:", { outcome, scenarioId, usesMapboxLayers })
        const data = await fetchTierLocationData(scenarioId, outcome!)

        if (!cancelled) {
          console.log("VisualizationLayers - Tier data received:", data.features.length, "features")
          setTierData(data)

          // Zoom to show all markers
          // In explore mode: camera is handled by useOutcomeVisualization
          // In learn mode: skip if outcome has a cameraPreset (handled by useOutcomeVisualization)
          const hasCameraPreset = config?.cameraPreset != null
          const isLearnMode = mapMode === "learn"
          const shouldFitBounds = isLearnMode && !hasCameraPreset
          if (shouldFitBounds && data.features.length > 0 && map.mapRef?.current) {
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
              // This only runs in learn mode (explore mode handled by useOutcomeVisualization)
              map.mapRef.current.fitBounds(
                [
                  [minLng, minLat],
                  [maxLng, maxLat],
                ],
                {
                  padding: 100,
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
  }, [outcome, scenarioId, usesMapboxLayers, map, mapMode, config])

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

      {/* React markers for non-Mapbox outcomes (except Delta station outcomes which use labels) */}
      {tierData && !usesMapboxLayers && 
        outcome !== "Freshwater for Delta exports" && 
        outcome !== "Freshwater for in-Delta uses" && (
        <TierMarkers
          data={tierData}
          onHover={handlePointHover}
          onClick={handlePointClick}
        />
      )}

      {/* Tier location labels (reservoirs, pumping plants, compliance stations) */}
      {layerType === "reservoir" && Object.keys(tierLevelMap).length > 0 && (
        <TierLocationLabels tierLookup={tierLevelMap} />
      )}
      {(outcome === "Freshwater for Delta exports" || outcome === "Freshwater for in-Delta uses") && tierData && (
        <TierLocationLabels data={tierData} />
      )}

      {/* Hotspot markers for tier 4 locations */}
      <HotspotMarkers
        outcome={outcome}
        scenarioId={scenarioId}
        visible={
          !!outcome &&
          (outcome === "Community deliveries" || outcome === "Salmon abundance")
        }
      />

      {/* Pinned tooltips (multiple allowed) */}
      {pinnedFeatures.map((feature) => (
        <MapFeatureTooltip
          key={`pinned-${feature.featureId}`}
          feature={feature}
          isPinned={true}
          onClose={() => clearPinned(feature)}
        />
      ))}

      {/* Hover tooltip (only if not already pinned) */}
      {hoveredFeature && !isHoveredAlreadyPinned && (
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
