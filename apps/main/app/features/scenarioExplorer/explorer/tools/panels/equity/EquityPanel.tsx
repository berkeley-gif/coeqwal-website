"use client"

/**
 * EquityPanel - Tier Grid.
 *
 * Displays water tier allocations across different categories and scenarios
 * using an interactive tier-based grid visualization.
 */

import { useMemo, useState, useCallback, useEffect, useRef } from "react"
import {
  Box,
  useTheme,
  Tooltip,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  Divider,
} from "@repo/ui/mui"
import { TierGrid, type TierGridProps } from "@repo/viz"
import { useWorkspaceSlice, useEquitySlice } from "../../../store"
import { BASELINE_SCENARIO_ID } from "../../../../constants"
import { mapActions, useMapStore } from "../../../../../map/store"
import { getTierColorsFromTheme } from "../../../../../../content/tiers"
import { getOutcomeLocationCoordinates } from "../../../../../map/config/outcomeLocations"
import { useEquityObjectives } from "./useEquityObjectives"
import { useScrollRightIndicator } from "../../hooks/useScrollRightIndicator"
import ScrollRightIndicator from "../../chrome/layout/ScrollRightIndicator"
import { useTourAnchor } from "../../tour"
import { useEquityOutcomeColumnSync } from "./tour"
import { HydroclimateGate } from "../../../../../scenarios/components/HydroclimateGate"
import {
  OUTCOME_NAMES,
  type OutcomeCode,
} from "../../../../../../content/outcomes"
import {
  OUTCOME_LAYER_REGISTRY,
  RESERVOIR_CALSIM_TO_GNISIDLABEL,
} from "../../../../../map/config/outcomeLayerRegistry"
import { resolveSourceForQuery } from "../../../../../map/config/tilesetSources"
import { useMap, Marker } from "@repo/map"

const TIERS = ["Tier 1", "Tier 2", "Tier 3", "Tier 4"]

// ============================================================================
// CENTROID CALCULATION HELPERS
// ============================================================================

/**
 * Calculate the centroid of a polygon using geographic center method
 */
function calculatePolygonCentroid(coordinates: number[][][]): [number, number] {
  const outerRing = coordinates[0]
  if (!outerRing || outerRing.length === 0) {
    return [0, 0]
  }

  let sumLng = 0
  let sumLat = 0
  let count = 0

  for (const coord of outerRing) {
    const lng = coord[0]
    const lat = coord[1]
    if (lng !== undefined && lat !== undefined) {
      sumLng += lng
      sumLat += lat
      count++
    }
  }

  return count > 0 ? [sumLng / count, sumLat / count] : [0, 0]
}

/**
 * Calculate centroid for a MultiPolygon
 */
function calculateMultiPolygonCentroid(
  coordinates: number[][][][],
): [number, number] {
  if (coordinates.length === 0) {
    return [0, 0]
  }

  let largestPolygon = coordinates[0]
  let maxPoints = largestPolygon?.[0]?.length ?? 0

  for (const polygon of coordinates) {
    const pointCount = polygon?.[0]?.length ?? 0
    if (pointCount > maxPoints) {
      maxPoints = pointCount
      largestPolygon = polygon
    }
  }

  if (!largestPolygon) {
    return [0, 0]
  }

  return calculatePolygonCentroid(largestPolygon)
}

/**
 * Resolves the {sourceId, sourceLayer, idProperty} to query for an
 * outcome's polygon tileset. Reads the source off the live layer instance
 * instead of hardcoding "composite" - non-satellite basemaps (Light,
 * Streets) inject these tilesets as standalone sources at runtime, so
 * "composite" doesn't exist there and a hardcoded query would silently
 * return zero features.
 */
function getPolygonQueryTarget(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
  outcomeCode: string,
): { sourceId: string; sourceLayer: string; idProperty: string } | null {
  const config = OUTCOME_LAYER_REGISTRY[outcomeCode]

  // Only works for polygon layers
  if (!config || config.geometryType !== "polygon") {
    return null
  }

  let sourceLayer = config.sourceLayer
  const idProperty = config.idProperty

  if (!sourceLayer || !idProperty) {
    return null
  }

  // The registry's AG_REV sourceLayer is stale (hyphenated); the real
  // tileset source-layer uses an underscore.
  if (outcomeCode == "AG_REV") sourceLayer = "demand_units"

  return {
    sourceId: resolveSourceForQuery(map, config.mapboxLayerId),
    sourceLayer,
    idProperty,
  }
}

/**
 * Maps an objective's API locationId to the id value the Mapbox tileset
 * feature actually carries. RES_STOR uses CalSim short codes (API) vs.
 * full reservoir names (tileset); single-feature layers like DELTA_ECO
 * carry one fixed feature id regardless of locationId.
 */
function resolveMapboxFeatureId(
  outcomeCode: string,
  locationId: string,
): string {
  if (outcomeCode === "RES_STOR") {
    return RESERVOIR_CALSIM_TO_GNISIDLABEL[locationId] || locationId
  }
  return (
    OUTCOME_LAYER_REGISTRY[outcomeCode]?.featureIdMap?.[outcomeCode] ??
    locationId
  )
}

function getPolygonCentroidNameFromMapbox(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
  outcomeCode: string,
  locationId: string,
): { coords: [number, number]; name: string } | null {
  const target = getPolygonQueryTarget(map, outcomeCode)
  if (!target) {
    return null
  }
  const { sourceId, sourceLayer, idProperty } = target
  const featureId = resolveMapboxFeatureId(outcomeCode, locationId)

  try {
    const features: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      properties?: Record<string, any>
      geometry: { type: string; coordinates: unknown }
    }[] = map.querySourceFeatures(sourceId, { sourceLayer })
    const matches = features.filter(
      (f) => String(f.properties?.[idProperty]) === featureId,
    )

    const feature = matches[0]
    if (!feature) {
      return null
    }

    // Some ids are generic/placeholder codes (e.g. a region's "not
    // assigned" demand-unit id) reused across several genuinely different
    // real-world locations. Tile-boundary fragments of the *same* feature
    // always agree on name, so if the matched features disagree, this id
    // is ambiguous and there is no way to know which location the API
    // actually meant - bail rather than guess one.
    const distinctNames = new Set(
      matches
        .map(
          (f) =>
            f.properties?.Mod_Name ||
            f.properties?.Urb_Name ||
            f.properties?.Sub_Name,
        )
        .filter(Boolean),
    )
    if (distinctNames.size > 1) {
      return null
    }

    const geometry = feature.geometry
    const resolvedName =
      feature.properties?.Mod_Name ||
      feature.properties?.Urb_Name ||
      feature.properties?.Sub_Name

    if (geometry.type === "Polygon" && geometry.coordinates) {
      return {
        coords: calculatePolygonCentroid(geometry.coordinates as number[][][]),
        name: resolvedName,
      }
    } else if (geometry.type === "MultiPolygon" && geometry.coordinates) {
      return {
        coords: calculateMultiPolygonCentroid(
          geometry.coordinates as number[][][][],
        ),
        name: resolvedName,
      }
    }

    return null
  } catch (_error) {
    return null
  }
}

/**
 * Batches a single querySourceFeatures call per outcome (rather than one
 * per objective) to build a feature-id -> descriptive Mapbox name lookup.
 * Same field priority (Mod_Name / Urb_Name / Sub_Name) as the map's own
 * marker tooltips, so the grid and the map agree on what a location is
 * called instead of the grid falling back to the API's more generic
 * `location_name`.
 */
function collectMapboxNames(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
  outcomeCode: string,
): Map<string, string> {
  const names = new Map<string, string>()
  // Some ids are generic/placeholder codes (e.g. a region's "not assigned"
  // demand-unit id) reused across several genuinely different real-world
  // locations. Track which ids see more than one distinct name and drop
  // them below rather than keep whichever happened to be seen last -
  // matches the ambiguity check in getPolygonCentroidNameFromMapbox so the
  // grid and the map agree on when a location can't be resolved at all.
  const ambiguousIds = new Set<string>()
  const target = getPolygonQueryTarget(map, outcomeCode)
  if (!target) {
    return names
  }

  try {
    const features = map.querySourceFeatures(target.sourceId, {
      sourceLayer: target.sourceLayer,
    })
    for (const feature of features) {
      const featureId = feature.properties?.[target.idProperty]
      const resolvedName =
        feature.properties?.Mod_Name ||
        feature.properties?.Urb_Name ||
        feature.properties?.Sub_Name
      if (featureId == null || !resolvedName) continue

      const key = String(featureId)
      const existing = names.get(key)
      if (existing !== undefined && existing !== resolvedName) {
        ambiguousIds.add(key)
        continue
      }
      names.set(key, resolvedName)
    }
  } catch {
    /* tiles for this layer may not be loaded yet; caller retries */
  }

  ambiguousIds.forEach((key) => names.delete(key))
  return names
}

export default function EquityPanel({
  highlightedIds = null,
  onChartHover,
}: {
  highlightedIds?: Set<string> | null
  onChartHover?: (
    info: {
      scenarioId: string
      outcome?: string
      tierValue?: number
    } | null,
  ) => void
}) {
  const theme = useTheme()
  const { mapRef, setMotionChildren, motionChildren } = useMap()
  const tierColors = useMemo(() => getTierColorsFromTheme(theme), [theme])

  // The Distribution (equity) tool uses its own focus field rather
  // than the shared multi-select, so entering/leaving Distribution
  // does not disturb List/Radar/Resilience/Comparison selections.
  const { equityFocusScenario, showMap, setShowMap } = useWorkspaceSlice()
  const { showEquityComparison, yAxisMode, equityHiddenCategories } =
    useEquitySlice()

  const { objectives: allObjectives, categories: allCategories } =
    useEquityObjectives({
      scenarioId: equityFocusScenario,
      compareToBaseline: showEquityComparison,
    })

  // Categories toggled off in EquityChartControls are excluded from the
  // grid entirely, so the remaining ones get more room.
  const categories = useMemo(
    () => allCategories.filter((c) => !equityHiddenCategories.includes(c)),
    [allCategories, equityHiddenCategories],
  )
  const baseObjectives = useMemo(
    () =>
      allObjectives.filter((o) => !equityHiddenCategories.includes(o.category)),
    [allObjectives, equityHiddenCategories],
  )

  // Descriptive names resolved from the same Mapbox tilesets the map
  // markers use, keyed by "<tierCode>:<mapbox feature id>". Without this,
  // the grid tooltip falls back to the API's `location_name`, which reads
  // more generic than what the map shows for the same location. Populated
  // per-outcome (one querySourceFeatures call per outcome, not per
  // objective) once the map instance exists.
  const [mapboxNames, setMapboxNames] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    const map = mapRef?.current?.getMap()
    if (!map) return

    const outcomeCodes = Array.from(
      new Set(baseObjectives.map((o) => o.tierCode)),
    )
    if (outcomeCodes.length === 0) return

    let cancelled = false

    const collect = () => {
      const next = new Map<string, string>()
      outcomeCodes.forEach((outcomeCode) => {
        collectMapboxNames(map, outcomeCode).forEach((name, featureId) => {
          next.set(`${outcomeCode}:${featureId}`, name)
        })
      })
      return next
    }

    const apply = () => {
      if (cancelled) return
      const next = collect()
      if (next.size > 0) {
        setMapboxNames(next)
      }
    }

    apply()

    // querySourceFeatures only sees currently loaded tiles. Small polygons
    // can still be loading on first query, so retry once after they've had
    // a moment (same tradeoff SummaryPanel makes rather than polling
    // indefinitely).
    const retryId = setTimeout(apply, 1000)

    return () => {
      cancelled = true
      clearTimeout(retryId)
    }
  }, [mapRef, baseObjectives])

  const objectives = useMemo(
    () =>
      baseObjectives.map((obj) => {
        const featureId = resolveMapboxFeatureId(obj.tierCode, obj.locationId)
        const displayName = mapboxNames.get(`${obj.tierCode}:${featureId}`)
        return displayName ? { ...obj, displayName } : obj
      }),
    [baseObjectives, mapboxNames],
  )

  const [selectedObjectives, setSelectedObjectives] = useState<
    TierGridProps["objectives"]
  >([])

  const [hasShownMapHint, setHasShownMapHint] = useState(false)
  const [showMapHintSnackbar, setShowMapHintSnackbar] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number
    mouseY: number
    category: string
    tier: string
  } | null>(null)

  // Deselect grid cells when the user clears map highlights (e.g. animation
  // overlay), not merely because highlights are empty by default.
  const locationHighlights = useMapStore((state) => state.locationHighlights)
  const prevLocationHighlightsRef = useRef(locationHighlights)

  useEffect(() => {
    const prev = prevLocationHighlightsRef.current
    prevLocationHighlightsRef.current = locationHighlights
    if (prev.length > 0 && locationHighlights.length === 0) {
      setSelectedObjectives([])
    }
  }, [locationHighlights])

  // Memoized so TierGrid's d3 redraw callback keeps a stable identity. Plain
  // functions here re-bind every parent render and force TierGrid to rerun
  // a 1000ms enter/update transition on every SWR revalidation, which
  // intermittently swallows clicks on the small (4-16px) dot targets.
  const handleObjectiveClick = useCallback(
    (objective: TierGridProps["objectives"][0]) => {
      setSelectedObjectives((prev) => {
        const isSelected = prev.some(
          (obj) =>
            obj.locationId === objective.locationId &&
            obj.tierCode === objective.tierCode,
        )
        if (isSelected) {
          return prev.filter(
            (obj) =>
              !(
                obj.locationId === objective.locationId &&
                obj.tierCode === objective.tierCode
              ),
          )
        } else {
          return [...prev, objective]
        }
      })
    },
    [],
  )

  const handleCategoryClick = useCallback(
    (categoryName: string) => {
      const categoryObjectives = objectives.filter(
        (obj) => obj.category === categoryName,
      )
      setSelectedObjectives(categoryObjectives)
    },
    [objectives],
  )

  const handleTierCategoryClick = useCallback(
    (categoryName: string, tier: string, event: MouseEvent) => {
      event.preventDefault()
      if (showEquityComparison) {
        // Show context menu for filtering
        setContextMenu({
          mouseX: event.clientX,
          mouseY: event.clientY,
          category: categoryName,
          tier: tier,
        })
      } else {
        // Direct selection in non-comparison mode
        let tierCategoryObjectives: TierGridProps["objectives"]

        if (yAxisMode === "continuous") {
          // Filter by continuous range (1.0-5.0)
          // Tier 1 = 1.0-2.0, Tier 2 = 2.0-3.0, Tier 3 = 3.0-4.0, Tier 4 = 4.0-5.0
          const tierNum = parseInt(tier.replace("Tier ", ""))
          const rangeStart = tierNum
          const rangeEnd = tierNum + 1

          tierCategoryObjectives = objectives.filter((obj) => {
            if (obj.category !== categoryName) return false
            if (obj.tierContinuous === undefined) return false

            // All tiers use ranges [start, end)
            return (
              obj.tierContinuous >= rangeStart && obj.tierContinuous < rangeEnd
            )
          })
        } else {
          // Filter by discrete tier
          tierCategoryObjectives = objectives.filter(
            (obj) => obj.category === categoryName && obj.tier === tier,
          )
        }

        setSelectedObjectives(tierCategoryObjectives)
      }
    },
    [objectives, showEquityComparison, yAxisMode],
  )

  const handleContextMenuSelect = (
    filter: "all" | "improved" | "nochange" | "worsened",
  ) => {
    if (!contextMenu) return

    const { category, tier } = contextMenu

    // First filter by category and tier (continuous or discrete)
    let filtered: TierGridProps["objectives"]

    if (yAxisMode === "continuous") {
      // Filter by continuous range (1.0-5.0)
      // Tier 1 = 1.0-2.0, Tier 2 = 2.0-3.0, Tier 3 = 3.0-4.0, Tier 4 = 4.0-5.0
      const tierNum = parseInt(tier.replace("Tier ", ""))
      const rangeStart = tierNum
      const rangeEnd = tierNum + 1

      filtered = objectives.filter((obj) => {
        if (obj.category !== category) return false
        if (obj.tierContinuous === undefined) return false

        // All tiers use ranges [start, end)
        return obj.tierContinuous >= rangeStart && obj.tierContinuous < rangeEnd
      })
    } else {
      // Filter by discrete tier
      filtered = objectives.filter(
        (obj) => obj.category === category && obj.tier === tier,
      )
    }

    // Then apply comparison filter
    if (filter === "improved") {
      filtered = filtered.filter((obj) => {
        const currentTier = parseInt(obj.tier.replace("Tier ", ""))
        const baselineTier = parseInt(obj.baselineTier.replace("Tier ", ""))
        return currentTier < baselineTier
      })
    } else if (filter === "nochange") {
      filtered = filtered.filter((obj) => obj.tier === obj.baselineTier)
    } else if (filter === "worsened") {
      filtered = filtered.filter((obj) => {
        const currentTier = parseInt(obj.tier.replace("Tier ", ""))
        const baselineTier = parseInt(obj.baselineTier.replace("Tier ", ""))
        return currentTier > baselineTier
      })
    }

    setSelectedObjectives(filtered)
    setContextMenu(null)
  }

  const handleShowOnMap = useCallback(
    (outcomeLocationCodes: string[]) => {
      setShowMap(true)

      // Get the Mapbox map instance
      const map = mapRef?.current?.getMap()

      // Filter objectives array to only the requested locations
      const outcomeLocationIDSet = new Set(outcomeLocationCodes)
      const objectivesToShow = objectives.filter((obj) =>
        outcomeLocationIDSet.has(`${obj.tierCode}:${obj.locationId}`),
      )

      if (objectivesToShow.length === 0) {
        setMotionChildren?.(null)
        return
      }

      // Create marker elements for each location
      const markerElements = objectivesToShow.map((obj) => {
        // Get tier color and shape based on comparison mode
        let isTriangle = false
        let triangleDirection: "up" | "down" = "up"

        if (showEquityComparison) {
          const currentTierNum = parseInt(obj.tier.replace("Tier ", ""))
          const baselineTierNum = parseInt(
            obj.baselineTier.replace("Tier ", ""),
          )
          if (currentTierNum === baselineTierNum) {
            // markerColor = "#64b5f6" // Light blue - no change
            isTriangle = false // Circle for no change
          } else if (currentTierNum < baselineTierNum) {
            // markerColor = "#1976d2" // Blue - improved
            isTriangle = true
            triangleDirection = "up" // Triangle pointing up for improvement
          } else {
            // markerColor = "#d32f2f" // Red - worsened
            isTriangle = true
            triangleDirection = "down" // Triangle pointing down for worse
          }
        } else {
          // Use tier color when not in comparison mode
          // markerColor = tierColors[obj.tierLevel as 1 | 2 | 3 | 4] || "#999"
          isTriangle = false
        }
        const markerColor = tierColors[obj.tierLevel as 1 | 2 | 3 | 4]

        // Get coordinates - try polygon centroid first, fallback to hardcoded
        let coords: [number, number] | null = null
        if (obj.tierCode && map) {
          // Try to get centroid from polygon layer. Name is intentionally
          // not read from this result - it's a fresh, separately-timed
          // query that can see a different set of loaded tiles than the
          // batched lookup below did, which is exactly what was causing
          // the map and the grid to disagree on a location's name. Using
          // obj.displayName here instead means both always read the same
          // resolved value.
          const result = getPolygonCentroidNameFromMapbox(
            map,
            obj.tierCode,
            obj.locationId,
          )
          if (result) {
            coords = result.coords
          }
        }
        const name = obj.displayName ?? null

        // Fallback to hardcoded coordinates if polygon centroid not available
        if (!coords && obj.tierCode) {
          coords = getOutcomeLocationCoordinates(obj.tierCode, obj.locationId)
        }

        // Skip marker if no coordinates available
        if (!coords) {
          console.warn(
            `No coordinates found for ${obj.locationId} in ${obj.tierCode}`,
          )
          return null
        }

        const lng = coords[0]
        const lat = coords[1]

        // Build tooltip content
        const tooltipContent = showEquityComparison ? (
          <Box>
            <Box
              sx={{
                fontWeight: 600,
                mb: 0.5,
                color: "#1a202c",
                fontSize: "15.5px",
              }}
            >
              {name || obj.locationName}
            </Box>
            {name && (
              <Box
                sx={{
                  fontWeight: 400,
                  mb: 0.5,
                  color: "#718096",
                  fontSize: "11px",
                }}
              >
                {obj.locationName}
              </Box>
            )}
            <Box sx={{ color: "#718096", fontSize: "12px", mb: 0.75 }}>
              {(obj.tierCode && OUTCOME_NAMES[obj.tierCode as OutcomeCode]) ||
                obj.tierCode}
            </Box>
            <Box
              sx={{
                borderTop: "1px solid #e2e8f0",
                pt: 0.75,
                mt: 0.75,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1,
                  fontSize: "12px",
                }}
              >
                <Box component="span" sx={{ color: "#718096" }}>
                  Selected:
                </Box>
                <Box
                  component="span"
                  sx={{ fontWeight: 600, color: "#2d3748" }}
                >
                  {obj.tier}
                </Box>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1,
                  fontSize: "12px",
                  mt: 0.5,
                }}
              >
                <Box component="span" sx={{ color: "#718096" }}>
                  Baseline:
                </Box>
                <Box
                  component="span"
                  sx={{ fontWeight: 600, color: "#2d3748" }}
                >
                  {obj.baselineTier}
                </Box>
              </Box>
            </Box>
          </Box>
        ) : (
          <Box>
            <Box
              sx={{
                fontWeight: 600,
                mb: 0.5,
                color: "#1a202c",
                fontSize: "15.5px",
              }}
            >
              {name || obj.locationName}
            </Box>
            {name && (
              <Box
                sx={{
                  fontWeight: 400,
                  mb: 0.5,
                  color: "#718096",
                  fontSize: "11px",
                }}
              >
                {obj.locationName}
              </Box>
            )}
            <Box sx={{ color: "#718096", fontSize: "12px", mb: 0.75 }}>
              {(obj.tierCode && OUTCOME_NAMES[obj.tierCode as OutcomeCode]) ||
                obj.tierCode}
            </Box>
            <Box
              sx={{
                borderTop: "1px solid #e2e8f0",
                pt: 0.75,
                mt: 0.75,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1,
                  fontSize: "12px",
                }}
              >
                <Box component="span" sx={{ color: "#718096" }}>
                  Tier:
                </Box>
                <Box
                  component="span"
                  sx={{ fontWeight: 600, color: "#2d3748" }}
                >
                  {obj.tier}
                </Box>
              </Box>
            </Box>
          </Box>
        )

        return (
          <Marker
            key={`${obj.locationId}-${obj.tierCode}`}
            longitude={lng}
            latitude={lat}
            anchor="bottom"
          >
            <Tooltip
              title={tooltipContent}
              arrow
              placement="top"
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: "white",
                    "& .MuiTooltip-arrow": {
                      color: "rgba(0, 0, 0, 0.9)",
                    },
                    padding: "12px 16px",
                    fontSize: "12px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  },
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                {/* <Box
                  sx={{
                    px: 1,
                    py: 0.5,
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    color: "white",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  {obj.locationName}
                </Box> */}
                {isTriangle ? (
                  <Box
                    component="svg"
                    sx={{
                      width: 16,
                      height: 16,
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                    }}
                    viewBox="0 0 14 14"
                  >
                    {triangleDirection === "up" ? (
                      <polygon
                        points="7,2 2,12 12,12"
                        fill={markerColor}
                        stroke="white"
                        strokeWidth="1"
                      />
                    ) : (
                      <polygon
                        points="7,12 2,2 12,2"
                        fill={markerColor}
                        stroke="white"
                        strokeWidth="1"
                      />
                    )}
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: markerColor,
                      border: "1px solid white",
                      // boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                      // opacity: showEquityComparison ? 0.5 : 1,
                    }}
                  />
                )}
              </Box>
            </Tooltip>
          </Marker>
        )
      })

      // Set markers on the map
      setMotionChildren?.(<>{markerElements}</>)

      // Switch to explore mode to show the map
      mapActions.setMapMode("explore")
    },
    [
      objectives,
      showEquityComparison,
      tierColors,
      mapRef,
      setMotionChildren,
      setShowMap,
    ],
  )

  // Update selectedObjectives with fresh data when scenario or comparison mode changes
  useEffect(() => {
    if (selectedObjectives.length > 0) {
      const locationIds = new Set(
        selectedObjectives.map((obj) => obj.locationId),
      )
      const updatedObjectives = objectives.filter((obj) =>
        locationIds.has(obj.locationId),
      )
      if (updatedObjectives.length > 0) {
        setSelectedObjectives(updatedObjectives)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equityFocusScenario, showEquityComparison, objectives])

  // Paint map markers when the user selects grid cells. Selection turns the
  // map panel on if it was off. handleShowOnMap also sets mapMode explore.
  useEffect(() => {
    if (selectedObjectives.length > 0) {
      const selectedTierLocationCodes = selectedObjectives.map(
        (obj) => `${obj.tierCode}:${obj.locationId}`,
      )
      handleShowOnMap(selectedTierLocationCodes)
    } else if (setMotionChildren) {
      setMotionChildren(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedObjectives, handleShowOnMap])

  useEffect(() => {
    if (showMap && !hasShownMapHint) {
      setHasShownMapHint(true)
      setShowMapHintSnackbar(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap])

  // Watch for external map marker clearing (from Clear button)
  const prevMotionChildrenRef = useRef(motionChildren)
  useEffect(() => {
    const prev = prevMotionChildrenRef.current
    prevMotionChildrenRef.current = motionChildren
    // If motion children were cleared externally and we have selected objectives
    if (
      prev !== null &&
      motionChildren === null &&
      selectedObjectives.length > 0
    ) {
      setSelectedObjectives([])
    }
  }, [motionChildren, selectedObjectives.length])

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      if (setMotionChildren) {
        setMotionChildren(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const focusScenarioId = equityFocusScenario ?? BASELINE_SCENARIO_ID

  const chartEmphasized = useMemo(() => {
    if (!highlightedIds || highlightedIds.size === 0) return false
    return highlightedIds.has(focusScenarioId)
  }, [highlightedIds, focusScenarioId])

  const { scrollRef, canScrollRight, checkOverflow } = useScrollRightIndicator([
    objectives,
    categories,
  ])
  const gridTourRef = useTourAnchor("equity.grid")
  const setGridRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef.current = node
      gridTourRef(node)
    },
    [scrollRef, gridTourRef],
  )
  const outcomeColumnTourRef = useTourAnchor("equity.grid.outcomeColumn")
  const tourHighlightCategory = useEquityOutcomeColumnSync()

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: theme.palette.grey[100],
        height: "100%",
        width: "100%",
        p: theme.space.component.lg,
        position: "relative",
      }}
    >
      {" "}
      <Box sx={{ position: "relative", flex: 1, minHeight: 0 }}>
        <Box
          ref={setGridRef}
          onScroll={checkOverflow}
          sx={{
            flex: 1,
            width: "100%",
            height: "100%",
            minHeight: 0,
            overflowX: "auto",
            boxShadow: chartEmphasized
              ? `inset 0 0 0 2px ${theme.palette.primary.main}`
              : undefined,
            borderRadius: 1,
            transition: "box-shadow 0.12s ease-out",
          }}
        >
          <Box sx={{ minWidth: 1120, height: "100%" }}>
            <HydroclimateGate scenarioId={focusScenarioId} variant="block">
              <TierGrid
                objectives={objectives}
                categories={categories}
                tiers={TIERS}
                colorMode="tier"
                showComparison={showEquityComparison}
                yAxisMode={yAxisMode}
                selectedObjectives={selectedObjectives}
                onObjectiveClick={handleObjectiveClick}
                onCategoryClick={handleCategoryClick}
                onTierCategoryClick={handleTierCategoryClick}
                onShowOnMap={handleShowOnMap}
                showMapView
                focusScenarioId={focusScenarioId}
                onChartHover={onChartHover}
                tourHighlightCategory={tourHighlightCategory}
                tourHighlightCategoryRef={outcomeColumnTourRef}
              />
            </HydroclimateGate>
          </Box>
        </Box>

        <ScrollRightIndicator
          visible={canScrollRight}
          fadeColor={theme.palette.grey[100]}
        />
      </Box>
      {/* Context menu for filtering tier-category cells */}
      <Menu
        open={contextMenu !== null}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem
          onClick={() => handleContextMenuSelect("all")}
          sx={{ fontSize: "0.75rem", py: 0.2, px: 1.5 }}
        >
          All in this cell
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => handleContextMenuSelect("improved")}
          sx={{ fontSize: "0.75rem", py: 0.2, px: 1.5 }}
        >
          Improved only
        </MenuItem>
        <MenuItem
          onClick={() => handleContextMenuSelect("nochange")}
          sx={{ fontSize: "0.75rem", py: 0.2, px: 1.5 }}
        >
          No change only
        </MenuItem>
        <MenuItem
          onClick={() => handleContextMenuSelect("worsened")}
          sx={{ fontSize: "0.75rem", py: 0.2, px: 1.5 }}
        >
          Worsened only
        </MenuItem>
      </Menu>
      <Snackbar
        open={showMapHintSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{
          top: "50% !important",
        }}
      >
        <Alert
          onClose={() => setShowMapHintSnackbar(false)}
          severity="info"
          sx={{
            width: "100%",
            border: 2,
            alignItems: "center",
          }}
        >
          Click on squares in the grid to view their locations on the map
        </Alert>
      </Snackbar>
    </Box>
  )
}
