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

import { useEffect, useState, useMemo } from "react"
import { useMap, Source, Layer } from "@repo/map"

// Components
import TierMarkers from "./components/TierMarkers"
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
import { PolygonLayerTooltip } from "../../tooltips/PolygonLayerTooltip"

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

  // Tooltip state for Mapbox layer interactions
  const { hoveredFeature, pinnedFeature, clearPinned } = useOutcomeTooltip({
    config,
    tierLevelMap,
    locationData,
    enabled: isVisualizationActive && usesMapboxLayers,
  })

  // Determine active tooltip (pinned takes precedence)
  const activeTooltip = pinnedFeature || hoveredFeature
  const isTooltipPinned = !!pinnedFeature

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
      {tierData && !usesMapboxLayers && <TierMarkers data={tierData} />}

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

      {/* Tooltip for polygon features */}
      {activeTooltip && (
        <PolygonLayerTooltip
          feature={activeTooltip}
          isPinned={isTooltipPinned}
          onClose={clearPinned}
        />
      )}
    </>
  )
}
