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

import { useEffect, useMemo, useRef } from "react"
import { useMap, Source, Layer, Popup } from "@repo/map"
import { Box, useTheme, alpha } from "@repo/ui/mui"

// Components
import TierMarkers from "./components/TierMarkers"
import { TierLocationLabels } from "./components/TierLocationLabels"
import { OutcomePolygonLayer } from "./components/OutcomePolygonLayer"
import { PoiMarker } from "./components/PoiMarker"

// Hooks
import { useOutcomeVisualization } from "./hooks/useOutcomeVisualization"
import { useMapTooltips } from "./hooks/useMapTooltips"

// Config
import { BASEMAP_DIM_OPACITY, LAYER_IDS } from "../config/outcomeLayerRegistry"

// Tooltips
import { MapFeatureTooltip } from "../../tooltips/MapFeatureTooltip"

// API
import { useTierLocationAssignments } from "@repo/data/coeqwal"
import type { TierLocation } from "./types"

// Store
import {
  useMapMode,
  useMapStyle,
  useGeocoderMarker,
  useClearTooltipsSignal,
  useLocationHighlights,
  getOnLocationToggle,
  getOnLocationClick,
  getOnLocationHover,
} from "../store"
import { MAP_THEME_URLS } from "@repo/map"

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

export default function VisualizationLayers({
  hidden = false,
}: {
  hidden?: boolean
}) {
  const theme = useTheme()
  const map = useMap()
  const mapMode = useMapMode()
  const geocoderMarker = useGeocoderMarker()
  const locationHighlights = useLocationHighlights()

  // Get outcome visualization data
  const {
    outcomeCode,
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

  // Lightweight tier location assignments for React-rendered markers
  // (non-polygon outcomes). Use the SWR-backed hook so this data shares
  // cache with useTierLocationAssignmentsBatch and the prefetch in
  // usePrefetchTiers: when the scenario explorer warms the batch cache, a
  // subsequent mount here hits memory, not the network.
  const shouldFetchAssignments = Boolean(
    config && scenarioId && !usesMapboxLayers && mapMode !== "hidden",
  )
  const { data: assignmentsData } = useTierLocationAssignments(
    shouldFetchAssignments && config ? scenarioId : null,
    shouldFetchAssignments && config ? config.tierCode : null,
  )
  const tierLocations: TierLocation[] = useMemo(
    () =>
      shouldFetchAssignments && assignmentsData
        ? assignmentsData.locations
        : [],
    [shouldFetchAssignments, assignmentsData],
  )
  const tierCode: string | null = useMemo(
    () =>
      shouldFetchAssignments && assignmentsData
        ? assignmentsData.tier_code
        : null,
    [shouldFetchAssignments, assignmentsData],
  )

  const isLearnMode = mapMode === "learn"
  const isGetStartedMode = mapMode === "get-started"
  const mapStyle = useMapStyle()
  const isSatellite = mapStyle === MAP_THEME_URLS.satellite

  // Dim overlay only on satellite basemap (light/streets have enough contrast).
  // Force to 0 when the map is hidden so the Source stays mounted without visual effect.
  const dimOpacity = useMemo(
    () =>
      !hidden && isVisualizationActive && !isGetStartedMode && isSatellite
        ? BASEMAP_DIM_OPACITY
        : 0,
    [hidden, isVisualizationActive, isGetStartedMode, isSatellite],
  )

  // Position dim overlay below all outcome polygon fill layers so
  // tier-colored polygons render above the darkened basemap.
  // Skip when hidden to avoid styledata -> moveLayer -> styledata feedback loops.
  useEffect(() => {
    if (hidden) return

    const mapInstance = map.mapRef?.current?.getMap()
    if (!mapInstance) return

    const DIM_ID = "basemap-dim-overlay"
    const OUTCOME_FILLS = new Set<string>([
      LAYER_IDS.demandUnits.fill,
      LAYER_IDS.wba.fill,
      LAYER_IDS.delta.fill,
      LAYER_IDS.reservoir.fill,
    ])

    if (mapInstance.getLayer(DIM_ID)) {
      mapInstance.setPaintProperty(DIM_ID, "fill-opacity-transition", {
        duration: 800,
        delay: 0,
      })
    }

    const positionDimLayer = () => {
      if (!mapInstance.getLayer(DIM_ID)) return

      const style = mapInstance.getStyle()
      if (!style?.layers) return

      const layerIds = style.layers.map((l) => l.id)
      const dimIdx = layerIds.indexOf(DIM_ID)
      if (dimIdx === -1) return

      let firstFillId: string | undefined
      for (const id of layerIds) {
        if (OUTCOME_FILLS.has(id)) {
          firstFillId = id
          break
        }
      }

      if (!firstFillId) return
      if (dimIdx < layerIds.indexOf(firstFillId)) return

      try {
        mapInstance.moveLayer(DIM_ID, firstFillId)
      } catch {
        /* layer may not exist yet */
      }
    }

    const raf = requestAnimationFrame(positionDimLayer)

    const onStyle = () => requestAnimationFrame(positionDimLayer)
    mapInstance.on("styledata", onStyle)

    return () => {
      cancelAnimationFrame(raf)
      mapInstance.off("styledata", onStyle)
    }
  }, [map, hidden])

  const highlightedLocationIds = useMemo(() => {
    if (locationHighlights.length === 0) return undefined
    const ids = new Set<string>()
    for (const h of locationHighlights) {
      const colonIdx = h.key.indexOf(":")
      if (colonIdx >= 0) ids.add(h.key.substring(colonIdx + 1))
    }
    return ids
  }, [locationHighlights])

  const dimPaint = useMemo(
    () => ({ "fill-color": "#000000", "fill-opacity": dimOpacity }),
    [dimOpacity],
  )

  return (
    <>
      {/* Basemap dim overlay - darkens map when visualization is active */}
      <Source id="basemap-dim-source" type="geojson" data={DIM_OVERLAY_GEOJSON}>
        <Layer id="basemap-dim-overlay" type="fill" paint={dimPaint} />
      </Source>

      {!hidden && (
        <>
          {/* Point of interest marker (Learn mode only) */}
          {isLearnMode && geocoderMarker && (
            <PoiMarker coordinates={geocoderMarker} />
          )}

          {/* Polygon layer (demand-units, WBA, delta, reservoir)
              In get-started mode this only renders after the user clicks a category
              (activeOutcomeVisualization is null during the animation).
              Demand-units in get-started mode is owned by
              `InteractivePaintArbiter` (see
              `apps/main/app/features/scenarioExplorer/getStarted/engine/arbiters/InteractivePaintArbiter.ts`)
              to enforce the storyboard's single-writer-per-resource
              invariant. Skip the OPL mount in that case so both
              writers don't race for the layer. */}
          {isVisualizationActive &&
            geometryType === "polygon" &&
            config &&
            !(isGetStartedMode && layerType === "demand-units") && (
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
          {layerType === "reservoir" &&
            Object.keys(tierLevelMap).length > 0 && (
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
            (tierLocations.length > 0 ||
              Object.keys(locationData).length > 0) && (
              <TierLocationLabels
                locationItems={
                  tierLocations.length > 0
                    ? tierLocations
                    : Object.values(locationData)
                }
                highlightedIds={highlightedLocationIds}
              />
            )}

          {/* Pinned tooltips (multiple allowed) - suppressed in get-started mode */}
          {!isGetStartedMode &&
            pinnedFeatures.map((feature) => (
              <MapFeatureTooltip
                key={`pinned-${feature.featureId}`}
                feature={feature}
                isPinned={true}
                onClose={() => clearPinned(feature)}
              />
            ))}

          {/* Hover tooltip (only if not already pinned) - suppressed in get-started mode */}
          {!isGetStartedMode && hoveredFeature && !isHoveredAlreadyPinned && (
            <MapFeatureTooltip
              key="hover"
              feature={hoveredFeature}
              isPinned={false}
              onClose={() => {}}
            />
          )}

          {/* Lightweight tooltips from tier animation overlay hover/pin.
           * Only *pinned* highlights render on the map (anchored to the
           * upper-left of the polygon). Hovered-but-unpinned highlights
           * show up in the overlay only, keeping the map quiet during
           * hover. Beat 5's storyboard demo participates in this popup
           * by setting `pinned: true` on its pseudo-highlight so the
           * demo renders the map popup alongside the gold polygon stroke;
           * the driver's teardown() clears it at the end of the beat.
           * The older right-side card + dashed leader-line layout
           * (`PinnedLocationsList`) has been retired in favor of this
           * simpler, in-place popup. */}
          {locationHighlights
            .filter((hl) => {
              if (!isGetStartedMode) return true
              if (!hl.pinned) return false
              const code = hl.key.split(":")[0]
              return (
                code !== "RES_STOR" &&
                code !== "FW_EXP" &&
                code !== "FW_DELTA_USES"
              )
            })
            .map((hl) => (
              <Popup
                key={hl.key}
                className="location-highlight-popup"
                longitude={hl.longitude}
                latitude={hl.latitude}
                anchor="bottom-right"
                closeButton={false}
                closeOnClick={false}
                offset={10}
                style={{ zIndex: 10 }}
              >
                <Box
                  onClick={
                    hl.pinned
                      ? () => getOnLocationToggle()?.(hl.key)
                      : undefined
                  }
                  sx={{
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "center",
                    p: "3px 8px",
                    borderRadius: "4px",
                    background: alpha(theme.palette.common.white, 0.75),
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
      )}
    </>
  )
}
