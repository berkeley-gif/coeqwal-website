"use client"

/**
 * EquityPanel - Tier Grid.
 *
 * Displays water tier allocations across different categories and scenarios
 * using an interactive tier-based grid visualization.
 */

import { useMemo, useState, useCallback, useEffect } from "react"
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
import { useScenarioExplorerStore } from "../../../store"
import { BASELINE_SCENARIO_ID } from "../../../constants"
import { mapActions, useMapStore } from "../../../../map/store"
import { getTierColorsFromTheme } from "../../../../../content/tiers"
import { getOutcomeLocationCoordinates } from "../../../../map/config/outcomeLocations"
import { useEquityObjectives } from "./useEquityObjectives"
import { HydroclimateGate } from "../../../../scenarios/components/HydroclimateGate"
import {
  OUTCOME_NAMES,
  type OutcomeCode,
} from "../../../../../content/outcomes"
import {
  OUTCOME_LAYER_REGISTRY,
  RESERVOIR_CALSIM_TO_GNISIDLABEL,
} from "../../../../map/config/outcomeLayerRegistry"
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

function getPolygonCentroidNameFromMapbox(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
  outcomeCode: string,
  locationId: string,
): { coords: [number, number]; name: string } | null {
  const config = OUTCOME_LAYER_REGISTRY[outcomeCode]

  // Only works for polygon layers
  if (!config || config.geometryType !== "polygon") {
    return null
  }

  let sourceLayer = config.sourceLayer
  const idProperty = outcomeCode != "DELTA_ECO" ? config.idProperty : "WBA_ID"

  if (!sourceLayer || !idProperty) {
    return null
  }
  const sourceId = "composite"

  if (outcomeCode == "AG_REV" || outcomeCode == "CWS_DEL")
    sourceLayer = "demand_units"
  if (outcomeCode == "RES_STOR")
    locationId = RESERVOIR_CALSIM_TO_GNISIDLABEL[locationId] || locationId
  if (outcomeCode == "DELTA_ECO") sourceLayer = "delta_water"

  try {
    // Query the source for the specific feature
    const filter =
      outcomeCode === "DELTA_ECO"
        ? undefined
        : ["==", ["get", idProperty], locationId]

    const features = map.querySourceFeatures(sourceId, {
      sourceLayer: sourceLayer,
      ...(filter && { filter }),
    })

    if (features.length === 0) {
      return null
    }

    const feature = features[0]
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
  } catch (error) {
    console.warn(
      `Failed to get centroid for ${locationId} in ${outcomeCode}:`,
      error,
    )
    return null
  }
}

export default function EquityPanel() {
  const theme = useTheme()
  const { mapRef, setMotionChildren } = useMap()
  const tierColors = useMemo(() => getTierColorsFromTheme(theme), [theme])

  // The Distribution (equity) tool uses its own focus field rather
  // than the shared multi-select, so entering/leaving Distribution
  // does not disturb List/Radar/Resilience/Comparison selections.
  const { equityFocusScenario, showEquityComparison, showMap } =
    useScenarioExplorerStore()

  const { objectives, categories } = useEquityObjectives({
    scenarioId: equityFocusScenario,
    compareToBaseline: showEquityComparison,
  })

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

  // Watch for map location highlights being cleared to deselect all objectives
  const locationHighlights = useMapStore((state) => state.locationHighlights)

  useEffect(() => {
    // When location highlights are cleared (empty array), clear selections
    if (locationHighlights.length === 0) {
      setSelectedObjectives([])
    }
  }, [locationHighlights])

  const handleObjectiveClick = (objective: TierGridProps["objectives"][0]) => {
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
  }

  const handleCategoryClick = (categoryName: string) => {
    const categoryObjectives = objectives.filter(
      (obj) => obj.category === categoryName,
    )
    setSelectedObjectives(categoryObjectives)
  }

  const handleTierCategoryClick = (
    categoryName: string,
    tier: string,
    event: MouseEvent,
  ) => {
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
      const tierCategoryObjectives = objectives.filter(
        (obj) => obj.category === categoryName && obj.tier === tier,
      )
      setSelectedObjectives(tierCategoryObjectives)
    }
  }

  const handleContextMenuSelect = (
    filter: "all" | "improved" | "nochange" | "worsened",
  ) => {
    if (!contextMenu) return

    const { category, tier } = contextMenu
    let filtered = objectives.filter(
      (obj) => obj.category === category && obj.tier === tier,
    )

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
        let name: string | null = null
        if (obj.tierCode && map) {
          // Try to get centroid from polygon layer
          const result = getPolygonCentroidNameFromMapbox(
            map,
            obj.tierCode,
            obj.locationId,
          )
          if (result) {
            coords = result.coords
            name = result.name
          }
        }

        // Fallback to hardcoded coordinates if polygon centroid not available
        if (!coords && obj.tierCode) {
          coords = getOutcomeLocationCoordinates(obj.tierCode, obj.locationId)
        }

        // Skip marker if no coordinates available
        if (!coords) {
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
    [objectives, showEquityComparison, tierColors, mapRef, setMotionChildren],
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

  // Update highlights when selected objectives changes
  useEffect(() => {
    if (selectedObjectives.length > 0 && showMap) {
      // const locationIds = selectedObjectives.map((obj) => obj.locationId)
      const selectedTierLocationCodes = selectedObjectives.map(
        (obj) => `${obj.tierCode}:${obj.locationId}`,
      )
      handleShowOnMap(selectedTierLocationCodes)
    } else if (setMotionChildren) {
      // Clear markers when no objectives selected or map hidden
      setMotionChildren(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedObjectives, showMap])

  useEffect(() => {
    if (showMap && !hasShownMapHint) {
      setHasShownMapHint(true)
      setShowMapHintSnackbar(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap])

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      if (setMotionChildren) {
        setMotionChildren(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      <Box
        sx={{
          flex: 1,
          width: "100%",
          height: "100%",
          minHeight: 0,
        }}
      >
        <HydroclimateGate
          scenarioId={equityFocusScenario ?? BASELINE_SCENARIO_ID}
          variant="block"
        >
          <TierGrid
            objectives={objectives}
            categories={categories}
            tiers={TIERS}
            colorMode="tier"
            showComparison={showEquityComparison}
            selectedObjectives={selectedObjectives}
            onObjectiveClick={handleObjectiveClick}
            onCategoryClick={handleCategoryClick}
            onTierCategoryClick={handleTierCategoryClick}
            onShowOnMap={handleShowOnMap}
            showMapView={showMap}
          />
        </HydroclimateGate>
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
