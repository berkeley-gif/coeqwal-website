"use client"

/**
 * VisualizationLayers - groups all outcome visualization layers
 *
 * These layers show data based on user-selected outcomes.
 *
 * Includes:
 * - BasemapDimOverlay (dims the map when visualization is active)
 * - OutcomePolygonLayer (demand-units, WBA, delta, reservoir)
 * - TierMarkers (non-polygon outcomes with hardcoded coordinates)
 * - TierLocationLabels (reservoirs, pumping plants, compliance stations)
 * - Tooltips (unified via useMapTooltips hook)
 */

import { useEffect, useState, useMemo, useRef } from "react"
import { useMap, Source, Layer } from "@repo/map"

// Components
import TierMarkers from "./components/TierMarkers"
import { TierLocationLabels } from "./components/TierLocationLabels"
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
import { fetchTierLocationAssignments } from "@repo/data/coeqwal"
import { FetchError } from "@repo/data/fetching"
import type { TierLocation } from "./types"

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
    outcomeCode,
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

  // Lightweight tier location assignments for React-rendered markers (non-polygon outcomes)
  const [tierLocations, setTierLocations] = useState<TierLocation[]>([])
  const [tierCode, setTierCode] = useState<string | null>(null)

  // Fetch tier assignments (no geometry) for non-Mapbox outcomes
  useEffect(() => {
    if (!config || !scenarioId || usesMapboxLayers) {
      setTierLocations([])
      setTierCode(null)
      return
    }

    if (mapMode === "hidden") {
      setTierLocations([])
      setTierCode(null)
      return
    }

    const code = config.tierCode
    let cancelled = false

    async function fetchData() {
      try {
        const data = await fetchTierLocationAssignments(scenarioId, code)
        if (!cancelled) {
          setTierLocations(data.locations)
          setTierCode(data.tier_code)
        }
      } catch (err) {
        if (
          err instanceof FetchError &&
          (err.status === 404 || err.status >= 500)
        ) {
          console.warn(`Tier data unavailable for ${code} (HTTP ${err.status})`)
        } else {
          console.error("Failed to fetch tier location data:", err)
        }
        if (!cancelled) {
          setTierLocations([])
          setTierCode(null)
        }
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [outcome, scenarioId, usesMapboxLayers, map, mapMode, config])

  const isLearnMode = mapMode === "learn"
  const isGetStartedMode = mapMode === "get-started"

  // Memoize dim opacity (skip in get-started mode for clean background)
  const dimOpacity = useMemo(
    () =>
      isVisualizationActive && !isGetStartedMode ? BASEMAP_DIM_OPACITY : 0,
    [isVisualizationActive, isGetStartedMode],
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
      {tierLocations.length > 0 &&
        !usesMapboxLayers &&
        tierCode &&
        outcomeCode !== "FW_EXP" &&
        outcomeCode !== "FW_DELTA_USES" && (
          <TierMarkers
            locations={tierLocations}
            tierCode={tierCode}
            onHover={handlePointHover}
            onClick={handlePointClick}
          />
        )}

      {/* Tier location labels (reservoirs, pumping plants, compliance stations) */}
      {layerType === "reservoir" && Object.keys(tierLevelMap).length > 0 && (
        <TierLocationLabels tierLookup={tierLevelMap} />
      )}
      {(outcomeCode === "FW_EXP" || outcomeCode === "FW_DELTA_USES") &&
        (tierLocations.length > 0 || Object.keys(locationData).length > 0) && (
          <TierLocationLabels
            locationItems={
              tierLocations.length > 0
                ? tierLocations
                : Object.values(locationData)
            }
          />
        )}

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
