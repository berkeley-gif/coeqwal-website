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
} from "@repo/data/coeqwal"
import { FetchError } from "@repo/data/fetching"

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

  // Tier location data for React-rendered markers (non-polygon outcomes)
  const [tierData, setTierData] = useState<TierLocationResponse | null>(null)

  // Fetch tier data for non-Mapbox outcomes
  useEffect(() => {
    if (!config || !scenarioId || usesMapboxLayers) {
      setTierData(null)
      return
    }

    if (mapMode === "hidden") {
      setTierData(null)
      return
    }

    const tierCode = config.tierCode

    let cancelled = false

    async function fetchData() {
      try {
        console.log("VisualizationLayers - Fetching tier data for:", {
          outcome,
          tierCode,
          scenarioId,
          usesMapboxLayers,
        })
        const data = await fetchTierLocationData(scenarioId, tierCode)

        if (!cancelled) {
          console.log(
            "VisualizationLayers - Tier data received:",
            data.features.length,
            "features",
          )
          setTierData(data)

          // Camera zoom is handled by useOutcomeVisualization for outcomes
          // with a cameraPreset (Delta views). Other outcomes keep the current position.
        }
      } catch (err) {
        if (
          err instanceof FetchError &&
          (err.status === 404 || err.status >= 500)
        ) {
          // 404: geometry table not yet populated for this tier type.
          // 5xx: transient backend error.
          // Both are known limitations.log as warning so the Next.js dev
          // overlay is not triggered for expected backend gaps.
          console.warn(
            `Tier data unavailable for ${tierCode} (HTTP ${err.status})`,
          )
        } else {
          console.error("Failed to fetch tier location data:", err)
        }
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
      {tierData &&
        !usesMapboxLayers &&
        outcomeCode !== "FW_EXP" &&
        outcomeCode !== "FW_DELTA_USES" && (
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
      {(outcomeCode === "FW_EXP" || outcomeCode === "FW_DELTA_USES") &&
        (tierData != null || Object.keys(locationData).length > 0) && (
          <TierLocationLabels
            data={tierData ?? undefined}
            locationItems={
              tierData == null ? Object.values(locationData) : undefined
            }
          />
        )}

      {/* Hotspot markers for tier 4 locations (hidden in get-started mode) */}
      <HotspotMarkers
        outcomeCode={outcomeCode}
        scenarioId={scenarioId}
        visible={
          !isGetStartedMode &&
          !!outcomeCode &&
          (outcomeCode === "CWS_DEL" ||
            outcomeCode === "WRC_SALMON_AB" ||
            outcomeCode === "AG_REV" ||
            outcomeCode === "ENV_FLOWS" ||
            outcomeCode === "GW_STOR")
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
