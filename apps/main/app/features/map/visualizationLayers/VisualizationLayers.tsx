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
import { useMap, Source, Layer, Popup } from "@repo/map"
import { Box } from "@repo/ui/mui"

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
import {
  useMapMode,
  useGeocoderMarker,
  useClearTooltipsSignal,
  useLocationHighlights,
  getOnLocationToggle,
  getOnLocationClick,
  getOnLocationHover,
} from "../store"

// Large polygon covering well beyond California for dim overlay.
// Must be oversized so edges are never visible even at low zoom levels.
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
            [-145, 20],
            [-145, 55],
            [-95, 55],
            [-95, 20],
            [-145, 20],
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
  const locationHighlights = useLocationHighlights()

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
    polygonEnabled:
      isVisualizationActive && usesMapboxLayers && mapMode !== "get-started",
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

  const highlightedLocationIds = useMemo(() => {
    if (locationHighlights.length === 0) return undefined
    const ids = new Set<string>()
    for (const h of locationHighlights) {
      const colonIdx = h.key.indexOf(":")
      if (colonIdx >= 0) ids.add(h.key.substring(colonIdx + 1))
    }
    return ids
  }, [locationHighlights])

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

      {/* Polygon layer (demand-units, WBA, delta, reservoir)
          In get-started mode this only renders after the user clicks a category
          (activeOutcomeVisualization is null during the animation). */}
      {isVisualizationActive && geometryType === "polygon" && config && (
        <OutcomePolygonLayer
          tierColorMap={tierColorMap}
          layerType={layerType!}
          idProperty={config.idProperty}
          featureIds={featureIds}
          classFilter={config.classFilter}
          visible={true}
          mapboxLayerId={config.mapboxLayerId}
          featureIdMap={config.featureIdMap}
          outlineOnly={config.outlineOnly}
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
            onHover={
              isGetStartedMode
                ? (feature) => {
                    if (!feature) {
                      getOnLocationHover()?.(null)
                    } else {
                      getOnLocationHover()?.({
                        code: outcomeCode!,
                        sourceId: feature.featureId,
                        tier: feature.tierLevel,
                      })
                    }
                  }
                : handlePointHover
            }
            onClick={
              isGetStartedMode
                ? (feature) => {
                    getOnLocationClick()?.({
                      code: outcomeCode!,
                      sourceId: feature.featureId,
                      tier: feature.tierLevel,
                    })
                  }
                : handlePointClick
            }
            highlightedIds={highlightedLocationIds}
          />
        )}

      {/* Tier location labels (reservoirs, pumping plants, compliance stations) */}
      {layerType === "reservoir" && Object.keys(tierLevelMap).length > 0 && (
        <TierLocationLabels
          tierLookup={tierLevelMap}
          highlightedIds={highlightedLocationIds}
          onHover={
            isGetStartedMode
              ? (info) => {
                  if (!info) {
                    getOnLocationHover()?.(null)
                  } else {
                    getOnLocationHover()?.({
                      code: outcomeCode!,
                      sourceId: info.id,
                      tier: info.tier,
                    })
                  }
                }
              : undefined
          }
          onClick={
            isGetStartedMode
              ? (info) => {
                  getOnLocationClick()?.({
                    code: outcomeCode!,
                    sourceId: info.id,
                    tier: info.tier,
                  })
                }
              : undefined
          }
        />
      )}
      {(outcomeCode === "FW_EXP" || outcomeCode === "FW_DELTA_USES") &&
        (tierLocations.length > 0 || Object.keys(locationData).length > 0) && (
          <TierLocationLabels
            locationItems={
              tierLocations.length > 0
                ? tierLocations
                : Object.values(locationData)
            }
            highlightedIds={highlightedLocationIds}
          />
        )}

      {/* Pinned tooltips (multiple allowed) — suppressed in get-started mode */}
      {!isGetStartedMode &&
        pinnedFeatures.map((feature) => (
          <MapFeatureTooltip
            key={`pinned-${feature.featureId}`}
            feature={feature}
            isPinned={true}
            onClose={() => clearPinned(feature)}
          />
        ))}

      {/* Hover tooltip (only if not already pinned) — suppressed in get-started mode */}
      {!isGetStartedMode && hoveredFeature && !isHoveredAlreadyPinned && (
        <MapFeatureTooltip
          key="hover"
          feature={hoveredFeature}
          isPinned={false}
          onClose={() => {}}
        />
      )}

      {/* Lightweight tooltips from tier animation overlay hover/pin */}
      {locationHighlights
        .filter((hl) => {
          if (!isGetStartedMode) return true
          // In get-started mode, pinned locations use PinnedLocationsList
          // cards with leader lines instead of map Popups.
          if (hl.pinned) return false
          const code = hl.key.split(":")[0]
          return (
            code !== "RES_STOR" && code !== "FW_EXP" && code !== "FW_DELTA_USES"
          )
        })
        .map((hl) => (
          <Popup
            key={hl.key}
            className="location-highlight-popup"
            longitude={hl.longitude}
            latitude={hl.latitude}
            anchor="bottom"
            closeButton={false}
            closeOnClick={false}
            offset={12}
            style={{ zIndex: 10 }}
          >
            <Box
              onClick={
                hl.pinned ? () => getOnLocationToggle()?.(hl.key) : undefined
              }
              sx={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                p: "3px 8px",
                borderRadius: "4px",
                background: "rgba(255,255,255,0.75)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                fontSize: 11,
                lineHeight: 1.3,
                textAlign: "center",
                color: "#333",
                whiteSpace: "nowrap",
                cursor: hl.pinned ? "pointer" : "default",
              }}
            >
              <Box
                component="span"
                sx={{
                  fontWeight: 600,
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {hl.name}
              </Box>
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontWeight: 500,
                  color: hl.tierColor,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "2px",
                    backgroundColor: hl.tierColor,
                    flexShrink: 0,
                  }}
                />
                Tier {hl.tierLevel}: {hl.tierLabel}
              </Box>
            </Box>
          </Popup>
        ))}
    </>
  )
}
