"use client"

/**
 * EquityPanel - Tier Grid.
 *
 * Displays water tier allocations across different categories and scenarios
 * using an interactive tier-based grid visualization.
 */

import { useMemo, useState, useCallback, useEffect, use } from "react"
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
import { useScenarioExplorerStore } from "../store"
import { mapActions, useMapStore } from "../../map/store"
import { getTierColorsFromTheme } from "../../../content/tiers"
import { getOutcomeLocationCoordinates } from "../../map/config/outcomeLocations"
import { useResolvedScenarioTiers } from "../hooks/useResolvedScenarioTiers"
import { OUTCOME_NAMES, type OutcomeCode } from "../../../content/outcomes"
import {
  OUTCOME_LAYER_REGISTRY,
  RESERVOIR_CALSIM_TO_GNISIDLABEL,
} from "../../map/config/outcomeLayerRegistry"
import { useMap, Marker } from "@repo/map"
import { useTierLocationAssignments } from "@repo/data/coeqwal/hooks"
import type { TierLocationAssignmentsResponse } from "@repo/data/coeqwal"

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
 * Get the centroid for a polygon feature from Mapbox
 */
function getPolygonCentroidFromMapbox(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
  outcomeCode: string,
  locationId: string,
): [number, number] | null {
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

    if (geometry.type === "Polygon" && geometry.coordinates) {
      return calculatePolygonCentroid(geometry.coordinates as number[][][])
    } else if (geometry.type === "MultiPolygon" && geometry.coordinates) {
      return calculateMultiPolygonCentroid(
        geometry.coordinates as number[][][][],
      )
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

  // Get currently selected scenarios and comparison mode from the store
  const { selectedScenarios, showEquityComparison, showMap } =
    useScenarioExplorerStore()

  const { outcomeNames, idMapping } = useResolvedScenarioTiers()

  // Resolve scenario ID to the right hydro-climate
  const firstSelected = selectedScenarios[0]
  const currentScenario = firstSelected
    ? idMapping[firstSelected] || firstSelected
    : "s0020"

  const baselineScenario = idMapping["s0020"] || "s0020"

  // Call useTierLocationAssignments for each outcome (not in a loop - follows Rules of Hooks)
  const cwsDel = useTierLocationAssignments(currentScenario, "CWS_DEL")
  const agRev = useTierLocationAssignments(currentScenario, "AG_REV")
  const envFlows = useTierLocationAssignments(currentScenario, "ENV_FLOWS")
  const resStor = useTierLocationAssignments(currentScenario, "RES_STOR")
  const gwStor = useTierLocationAssignments(currentScenario, "GW_STOR")
  const deltaEco = useTierLocationAssignments(currentScenario, "DELTA_ECO")
  const fwExp = useTierLocationAssignments(currentScenario, "FW_EXP")
  const fwDeltaUses = useTierLocationAssignments(
    currentScenario,
    "FW_DELTA_USES",
  )
  const wrcSalmonAb = useTierLocationAssignments(
    currentScenario,
    "WRC_SALMON_AB",
  )

  // Baseline data for comparison
  const baselineCwsDel = useTierLocationAssignments(
    showEquityComparison ? baselineScenario : null,
    "CWS_DEL",
  )
  const baselineAgRev = useTierLocationAssignments(
    showEquityComparison ? baselineScenario : null,
    "AG_REV",
  )
  const baselineEnvFlows = useTierLocationAssignments(
    showEquityComparison ? baselineScenario : null,
    "ENV_FLOWS",
  )
  const baselineResStor = useTierLocationAssignments(
    showEquityComparison ? baselineScenario : null,
    "RES_STOR",
  )
  const baselineGwStor = useTierLocationAssignments(
    showEquityComparison ? baselineScenario : null,
    "GW_STOR",
  )
  const baselineDeltaEco = useTierLocationAssignments(
    showEquityComparison ? baselineScenario : null,
    "DELTA_ECO",
  )
  const baselineFwExp = useTierLocationAssignments(
    showEquityComparison ? baselineScenario : null,
    "FW_EXP",
  )
  const baselineFwDeltaUses = useTierLocationAssignments(
    showEquityComparison ? baselineScenario : null,
    "FW_DELTA_USES",
  )
  const baselineWrcSalmonAb = useTierLocationAssignments(
    showEquityComparison ? baselineScenario : null,
    "WRC_SALMON_AB",
  )

  // Map outcome codes to their data
  const tierDataByCode: Record<
    string,
    TierLocationAssignmentsResponse | undefined
  > = useMemo(
    () => ({
      CWS_DEL: cwsDel.data,
      AG_REV: agRev.data,
      ENV_FLOWS: envFlows.data,
      RES_STOR: resStor.data,
      GW_STOR: gwStor.data,
      DELTA_ECO: deltaEco.data,
      FW_EXP: fwExp.data,
      FW_DELTA_USES: fwDeltaUses.data,
      WRC_SALMON_AB: wrcSalmonAb.data,
    }),
    [
      cwsDel.data,
      agRev.data,
      envFlows.data,
      resStor.data,
      gwStor.data,
      deltaEco.data,
      fwExp.data,
      fwDeltaUses.data,
      wrcSalmonAb.data,
    ],
  )

  const baselineTierDataByCode: Record<
    string,
    TierLocationAssignmentsResponse | undefined
  > = useMemo(
    () => ({
      CWS_DEL: baselineCwsDel.data,
      AG_REV: baselineAgRev.data,
      ENV_FLOWS: baselineEnvFlows.data,
      RES_STOR: baselineResStor.data,
      GW_STOR: baselineGwStor.data,
      DELTA_ECO: baselineDeltaEco.data,
      FW_EXP: baselineFwExp.data,
      FW_DELTA_USES: baselineFwDeltaUses.data,
      WRC_SALMON_AB: baselineWrcSalmonAb.data,
    }),
    [
      baselineCwsDel.data,
      baselineAgRev.data,
      baselineEnvFlows.data,
      baselineResStor.data,
      baselineGwStor.data,
      baselineDeltaEco.data,
      baselineFwExp.data,
      baselineFwDeltaUses.data,
      baselineWrcSalmonAb.data,
    ],
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

  // Watch for map location highlights being cleared to deselect all objectives
  const locationHighlights = useMapStore((state) => state.locationHighlights)

  useEffect(() => {
    // When location highlights are cleared (empty array), clear selections
    if (locationHighlights.length === 0) {
      setSelectedObjectives([])
    }
  }, [locationHighlights])

  // Transform tier location data to tier grid format
  const { objectives, categories } = useMemo(() => {
    if (outcomeNames.length === 0) {
      return { objectives: [], categories: [] }
    }

    const result: TierGridProps["objectives"] = []
    const categorySet = new Set<string>()
    let globalId = 0

    // Build baseline tier map
    const baselineTierMap = new Map<string, number>()
    if (showEquityComparison) {
      outcomeNames.forEach((outcome) => {
        const baselineData = baselineTierDataByCode[outcome.shortCode]
        if (baselineData) {
          baselineData.locations.forEach((location) => {
            baselineTierMap.set(location.location_id, location.tier_level)
          })
        }
      })
    }

    // Process each outcome
    outcomeNames.forEach((outcome) => {
      const tierCode = outcome.shortCode
      const currentData = tierDataByCode[tierCode]

      if (!currentData) return

      const categoryName = outcome.displayName
      categorySet.add(categoryName)

      currentData.locations.forEach((location) => {
        const currentTierLevel = location.tier_level
        const baselineTierLevel = showEquityComparison
          ? (baselineTierMap.get(location.location_id) ?? currentTierLevel)
          : currentTierLevel

        result.push({
          id: globalId++,
          tier: `Tier ${currentTierLevel}`,
          baselineTier: `Tier ${baselineTierLevel}`,
          category: categoryName,
          locationId: location.location_id,
          locationName: location.location_name,
          tierLevel: currentTierLevel,
          tierCode: tierCode,
        })
      })
    })

    return {
      objectives: result,
      categories: Array.from(categorySet),
    }
  }, [
    outcomeNames,
    tierDataByCode,
    baselineTierDataByCode,
    showEquityComparison,
  ])

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
        let markerColor: string
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
        markerColor = tierColors[obj.tierLevel as 1 | 2 | 3 | 4]

        // Get coordinates - try polygon centroid first, fallback to hardcoded
        let coords: [number, number] | null = null
        if (obj.tierCode && map) {
          // Try to get centroid from polygon layer
          coords = getPolygonCentroidFromMapbox(
            map,
            obj.tierCode,
            obj.locationId,
          )
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
              {obj.locationName}
            </Box>
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
              {obj.locationName}
            </Box>
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
  }, [currentScenario, showEquityComparison, objectives])

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
