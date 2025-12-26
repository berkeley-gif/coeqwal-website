"use client"

/**
 * SummaryPanel - Scenario summary overlay
 *
 * Displays a summary of scenario outcomes with tier glyphs.
 * Used in both Learn map and Explore views.
 */

/* eslint-disable react/prop-types */ // TypeScript handles prop validation

import { useEffect, useState, useCallback } from "react"
import { Box, Typography, Chip, CircularProgress, useTheme } from "@repo/ui/mui"
import { motion, AnimatePresence } from "@repo/motion"
import {
  generateOutcomeSummary,
  generateOutcomeInsight,
  OutcomeSummary,
  AtRiskLocation,
  DemandUnitProperties,
} from "../../summary/summaryGenerator"
import {
  TIER_LABELS,
  TierLevel,
  getTierColorsFromTheme,
} from "../../../content/tiers"
import { fetchTierLocations } from "../hooks/useOutcomeMapLayer"
import { fetchTierLocationData } from "../../../lib/api/tierLocationApi"
import {
  STRATEGY_TO_SCENARIO_ID,
  DISPLAY_NAME_TO_API_SHORT_CODE,
} from "../../../lib/constants/outcomeMappings"
import { useSelectedOutcome } from "../store"
import { useMap } from "@repo/map"

interface SummaryPanelProps {
  strategy?: string
  /** Optional outcome override - if not provided, reads from store (Learn mode) */
  outcome?: string | null
  /** Variant: 'overlay' for map overlay (narrow), 'inline' for strategy grid (full width) */
  variant?: "overlay" | "inline"
}

export function SummaryPanel({
  strategy = "current-ops",
  outcome: outcomeProp,
  variant = "overlay",
}: SummaryPanelProps) {
  const theme = useTheme()
  const mapAPI = useMap()
  const storeOutcome = useSelectedOutcome()

  // Use prop if provided (Explore mode), otherwise use store (Learn mode)
  const selectedOutcome = outcomeProp !== undefined ? outcomeProp : storeOutcome

  // Get tier colors from theme
  const tierColors = getTierColorsFromTheme(theme)

  const [isLoading, setIsLoading] = useState(false)
  const [outcomeSummary, setOutcomeSummary] = useState<OutcomeSummary | null>(
    null,
  )
  const [featurePropsMap, setFeaturePropsMap] = useState<Map<
    string,
    DemandUnitProperties
  > | null>(null)
  // Store coordinates from GeoJSON API (more reliable than Mapbox query)
  const [geoJsonCoords, setGeoJsonCoords] = useState<
    Map<string, [number, number]>
  >(new Map())

  // Fetch tier data and generate summary when outcome changes
  useEffect(() => {
    if (!selectedOutcome) {
      setOutcomeSummary(null)
      return
    }

    // Capture non-null value for use in async function
    const outcome = selectedOutcome

    let cancelled = false

    async function loadSummary() {
      setIsLoading(true)

      try {
        const scenarioId = STRATEGY_TO_SCENARIO_ID[strategy]
        if (!scenarioId) return

        // Get tier code from outcome using the mapping
        const tierCode = DISPLAY_NAME_TO_API_SHORT_CODE[outcome]
        if (!tierCode) return

        const tierData = await fetchTierLocations(scenarioId, tierCode)

        if (cancelled) return

        // Also fetch GeoJSON data for reliable coordinates and API names
        const apiNamesMap = new Map<string, string>()
        try {
          const geoJsonData = await fetchTierLocationData(strategy, outcome)
          if (!cancelled) {
            const coordsMap = new Map<string, [number, number]>()

            geoJsonData.features.forEach((feature) => {
              const locationId = feature.properties.location_id
              const locationName = feature.properties.location_name

              // Store API location_name (can be used as fallback)
              if (locationName && locationName !== locationId) {
                apiNamesMap.set(locationId, locationName)
              }

              if (feature.geometry.type === "Point") {
                const coords = feature.geometry.coordinates as number[]
                coordsMap.set(locationId, [coords[0]!, coords[1]!])
              } else if (feature.geometry.type === "Polygon") {
                // Calculate centroid for polygon
                const ring = (feature.geometry.coordinates as number[][][])[0]
                if (ring && ring.length > 0) {
                  let sumLng = 0,
                    sumLat = 0
                  ring.forEach((pt) => {
                    sumLng += pt[0]!
                    sumLat += pt[1]!
                  })
                  coordsMap.set(locationId, [
                    sumLng / ring.length,
                    sumLat / ring.length,
                  ])
                }
              } else if (feature.geometry.type === "MultiPolygon") {
                // Use first polygon's centroid
                const ring = (
                  feature.geometry.coordinates as number[][][][]
                )[0]?.[0]
                if (ring && ring.length > 0) {
                  let sumLng = 0,
                    sumLat = 0
                  ring.forEach((pt) => {
                    sumLng += pt[0]!
                    sumLat += pt[1]!
                  })
                  coordsMap.set(locationId, [
                    sumLng / ring.length,
                    sumLat / ring.length,
                  ])
                }
              }
            })
            setGeoJsonCoords(coordsMap)
          }
        } catch {
          // Silently handle GeoJSON fetch errors
        }

        // Try to get feature properties from the map for location names
        // This enriches the summary with actual location names from Mapbox
        // Note: querySourceFeatures only returns features from currently loaded tiles
        // Small polygons may not be in tiles at lower zoom levels
        const propsMap = await new Promise<Map<string, DemandUnitProperties>>(
          (resolve) => {
            mapAPI.withMap((mapRef) => {
              const map = mapRef.getMap()

              const queryFeatures = () => {
                const resultMap = new Map<string, DemandUnitProperties>()

                // Query source features to get properties
                const features = map.querySourceFeatures("composite", {
                  sourceLayer: "demand_units",
                })

                features.forEach((f) => {
                  const duId = f.properties?.DU_ID
                  if (duId) {
                    // Get centroid for coordinates (simplified - just use first point)
                    let coords: [number, number] = [0, 0]
                    if (
                      f.geometry.type === "Polygon" &&
                      f.geometry.coordinates?.[0]?.[0]
                    ) {
                      coords = f.geometry.coordinates[0][0] as [number, number]
                    } else if (
                      f.geometry.type === "MultiPolygon" &&
                      f.geometry.coordinates?.[0]?.[0]?.[0]
                    ) {
                      coords = f.geometry.coordinates[0][0][0] as [
                        number,
                        number,
                      ]
                    }

                    // Only use names if they're real (not empty or whitespace)
                    const subName = f.properties?.Sub_Name?.trim()
                    const urbName = f.properties?.Urb_Name?.trim()
                    const modName = f.properties?.Mod_Name?.trim()

                    resultMap.set(duId, {
                      DU_ID: duId,
                      Urb_Name: urbName && urbName !== "" ? urbName : null,
                      Mod_Name: modName && modName !== "" ? modName : null,
                      Sub_Name: subName && subName !== "" ? subName : null,
                      Type: f.properties?.Type || null,
                      Comments: f.properties?.Comments || null,
                      Class: f.properties?.Class || "Unknown",
                      longitude: coords[0],
                      latitude: coords[1],
                    })
                  }
                })

                return resultMap
              }

              // Query immediately - don't wait for tiles, they may never load for small features
              // The source metadata loads quickly, but individual tile data depends on zoom/viewport
              resolve(queryFeatures())
            })
          },
        )

        if (!cancelled) {
          setFeaturePropsMap(propsMap)
        }

        // Generate summary using Mapbox props + API names as fallback
        const summary = generateOutcomeSummary(
          outcome,
          tierData,
          propsMap,
          apiNamesMap,
        )

        if (!cancelled) {
          setOutcomeSummary(summary)
        }
      } catch {
        // Silently handle errors
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadSummary()

    return () => {
      cancelled = true
    }
  }, [selectedOutcome, strategy, mapAPI])

  // Handle clicking on a location to zoom to it
  const handleLocationClick = useCallback(
    (location: AtRiskLocation) => {
      // Priority: 1. GeoJSON coords (most reliable), 2. location.coordinates, 3. featurePropsMap
      const geoCoords = geoJsonCoords.get(location.duId)
      if (geoCoords) {
        mapAPI.withMap((mapRef) => {
          const map = mapRef.getMap()
          map.flyTo({
            center: geoCoords,
            zoom: 10,
            duration: 1500,
          })
        })
        return
      }

      if (location.coordinates) {
        mapAPI.withMap((mapRef) => {
          const map = mapRef.getMap()
          map.flyTo({
            center: location.coordinates!,
            zoom: 10,
            duration: 1500,
          })
        })
        return
      }

      // Fallback: Try feature props map
      const props = featurePropsMap?.get(location.duId)
      const lng = props?.longitude
      const lat = props?.latitude
      if (lng !== undefined && lat !== undefined && (lng !== 0 || lat !== 0)) {
        mapAPI.withMap((mapRef) => {
          const map = mapRef.getMap()
          map.flyTo({
            center: [lng, lat],
            zoom: 10,
            duration: 1500,
          })
        })
      }
    },
    [mapAPI, featurePropsMap, geoJsonCoords],
  )

  const isInline = variant === "inline"

  return (
    <Box
      sx={{
        // Match the styling of other panels (StrategyRow, KeyOperationsPanel, KeyOutcomesPanel)
        backgroundColor: isInline
          ? theme.palette.grey[50]
          : "rgba(255, 255, 255, 0.95)",
        borderRadius: isInline ? theme.borderRadius.md : 0,
        // Use semantic panel spacing tokens
        padding: isInline
          ? theme.spacingTokens.panel.xs
          : theme.spacingTokens.panel.sm,
        boxShadow: isInline ? theme.shadow.none : theme.shadow.sm,
        width: "100%",
        maxWidth: isInline
          ? "100%"
          : {
              xs: "100%",
              sm: "360px",
              md: "420px",
              lg: "460px",
              xl: "500px",
            },
        boxSizing: "border-box",
        pointerEvents: "auto",
      }}
    >
      {/* Panel title - matches KeyOutcomesPanel styling (hidden for inline variant) */}
      {!isInline && (
        <>
          <Typography
            variant="body2"
            sx={{
              mb: 0.5,
              fontWeight: theme.typography.fontWeightMedium,
              color: theme.palette.grey[900],
            }}
          >
            Scenario summary
          </Typography>

          {/* Base scenario summary - always shown (only for overlay) */}
          <Typography
            variant="body2"
            sx={{
              ...theme.typography.nav,
              lineHeight: 1.5, // Intentionally more relaxed than nav default for readability
              color: theme.palette.grey[700],
              mb: 2,
            }}
          >
            Overall, this scenario favors community and agricultural water
            deliveries, though not every community is served equally. Freshwater
            for Delta exports is preserved, though Delta estuary ecology is at
            risk. Winter-run Chinook Salmon are red-lining.
          </Typography>
        </>
      )}

      {/* Outcome-specific insights */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
              <CircularProgress
                size={14}
                sx={{ color: theme.palette.blue.bright }}
              />
              <Typography
                variant="compactCaption"
                sx={{ color: theme.palette.grey[500] }}
              >
                Analyzing {selectedOutcome}...
              </Typography>
            </Box>
          </motion.div>
        )}

        {!isLoading && outcomeSummary && selectedOutcome && (
          <motion.div
            key={selectedOutcome}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <Box
              sx={{
                borderTop: isInline ? "none" : theme.border.light,
                pt: isInline ? 0 : 2,
              }}
            >
              {/* Outcome name header */}
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.blue.medium,
                  fontWeight: theme.typography.fontWeightSemiBold,
                  fontSize: isInline
                    ? theme.typography.body2.fontSize
                    : "0.7rem",
                  letterSpacing: "0.5px",
                  display: "block",
                  mb: isInline ? 0.5 : 1,
                }}
              >
                {selectedOutcome}
              </Typography>

              {/* Generated insight */}
              <Typography
                variant="body2"
                sx={{
                  ...theme.typography.nav,
                  lineHeight: 1.5, // Intentionally more relaxed than nav default for readability
                  color: theme.palette.grey[700],
                  mb: 1.5,
                }}
              >
                {generateOutcomeInsight(selectedOutcome, outcomeSummary)}
              </Typography>

              {/* Inline layout: horizontal arrangement of tier chips and locations */}
              {isInline ? (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                    alignItems: "flex-start",
                  }}
                >
                  {/* Tier breakdown chips */}
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.5,
                      alignItems: "center",
                    }}
                  >
                    {Object.entries(outcomeSummary.tierBreakdown).map(
                      ([tier, data]) => {
                        const tierNum = parseInt(
                          tier.replace("tier", ""),
                        ) as TierLevel
                        return (
                          <Chip
                            key={tier}
                            size="small"
                            label={`${TIER_LABELS[tierNum]}: ${data.count}`}
                            sx={{
                              ...theme.typography.compact.micro,
                              backgroundColor: `${tierColors[tierNum]}15`,
                              color: tierColors[tierNum],
                              borderColor: `${tierColors[tierNum]}40`,
                              border: "1px solid",
                              fontWeight: theme.typography.fontWeightMedium,
                              height: 22,
                              "& .MuiChip-label": { px: 1 },
                            }}
                          />
                        )
                      },
                    )}
                  </Box>

                  {/* Critical locations inline */}
                  {outcomeSummary.criticalLocations.length > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="nav"
                        component="span"
                        sx={{
                          color: tierColors[4],
                          fontWeight: theme.typography.fontWeightSemiBold,
                          mr: 0.5,
                        }}
                      >
                        Critical:
                      </Typography>
                      {outcomeSummary.criticalLocations
                        .slice(0, 6)
                        .map((loc) => (
                          <Chip
                            key={loc.duId}
                            size="small"
                            label={loc.primaryName}
                            onClick={() => handleLocationClick(loc)}
                            sx={{
                              ...theme.typography.compact.micro,
                              cursor: "pointer",
                              backgroundColor: "transparent",
                              color: theme.palette.grey[700],
                              border: theme.border.medium,
                              height: 22,
                              "&:hover": {
                                backgroundColor: theme.palette.blue.bright,
                                color: theme.palette.common.white,
                                borderColor: theme.palette.blue.bright,
                              },
                              "& .MuiChip-label": { px: 0.75 },
                            }}
                          />
                        ))}
                      {outcomeSummary.criticalLocations.length > 6 && (
                        <Typography
                          variant="compactMicro"
                          sx={{ color: theme.palette.grey[500] }}
                        >
                          +{outcomeSummary.criticalLocations.length - 6} more
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* At-risk locations inline */}
                  {outcomeSummary.atRiskLocations.length > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="nav"
                        component="span"
                        sx={{
                          color: tierColors[3],
                          fontWeight: theme.typography.fontWeightSemiBold,
                          mr: 0.5,
                        }}
                      >
                        At-risk:
                      </Typography>
                      {outcomeSummary.atRiskLocations.slice(0, 4).map((loc) => (
                        <Chip
                          key={loc.duId}
                          size="small"
                          label={loc.primaryName}
                          onClick={() => handleLocationClick(loc)}
                          sx={{
                            ...theme.typography.compact.micro,
                            cursor: "pointer",
                            backgroundColor: "transparent",
                            color: theme.palette.grey[600],
                            border: theme.border.medium,
                            height: 18,
                            "&:hover": {
                              backgroundColor: theme.palette.blue.bright,
                              color: theme.palette.common.white,
                              borderColor: theme.palette.blue.bright,
                            },
                            "& .MuiChip-label": { px: 0.75 },
                          }}
                        />
                      ))}
                      {outcomeSummary.atRiskLocations.length > 4 && (
                        <Typography
                          variant="compactMicro"
                          sx={{ color: theme.palette.grey[500] }}
                        >
                          +{outcomeSummary.atRiskLocations.length - 4} more
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              ) : (
                /* Overlay layout: vertical arrangement */
                <>
                  {/* Tier breakdown chips */}
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.5,
                      mb: 1.5,
                    }}
                  >
                    {Object.entries(outcomeSummary.tierBreakdown).map(
                      ([tier, data]) => {
                        const tierNum = parseInt(
                          tier.replace("tier", ""),
                        ) as TierLevel
                        return (
                          <Chip
                            key={tier}
                            size="small"
                            label={`${TIER_LABELS[tierNum]}: ${data.count}`}
                            sx={{
                              ...theme.typography.compact.micro,
                              backgroundColor: `${tierColors[tierNum]}15`,
                              color: tierColors[tierNum],
                              borderColor: `${tierColors[tierNum]}40`,
                              border: "1px solid",
                              fontWeight: theme.typography.fontWeightMedium,
                              height: 22,
                              "& .MuiChip-label": {
                                px: 1,
                              },
                            }}
                          />
                        )
                      },
                    )}
                  </Box>

                  {/* Critical locations with zoom links */}
                  {outcomeSummary.criticalLocations.length > 0 && (
                    <Box sx={{ mb: 1.5 }}>
                      <Typography
                        variant="nav"
                        sx={{
                          color: tierColors[4],
                          fontWeight: theme.typography.fontWeightSemiBold,
                          display: "block",
                          mb: 0.5,
                        }}
                      >
                        Critical locations:
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {outcomeSummary.criticalLocations
                          .slice(0, 8)
                          .map((loc) => (
                            <Chip
                              key={loc.duId}
                              size="small"
                              label={loc.primaryName}
                              onClick={() => handleLocationClick(loc)}
                              sx={{
                                ...theme.typography.nav,
                                cursor: "pointer",
                                backgroundColor: "transparent",
                                color: theme.palette.grey[700],
                                border: theme.border.medium,
                                height: 24,
                                "&:hover": {
                                  backgroundColor: theme.palette.blue.bright,
                                  color: theme.palette.common.white,
                                  borderColor: theme.palette.blue.bright,
                                },
                                "& .MuiChip-label": {
                                  px: 1,
                                },
                              }}
                            />
                          ))}
                        {outcomeSummary.criticalLocations.length > 8 && (
                          <Typography
                            variant="nav"
                            sx={{
                              color: theme.palette.grey[500],
                              alignSelf: "center",
                            }}
                          >
                            +{outcomeSummary.criticalLocations.length - 8} more
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* At-risk locations */}
                  {outcomeSummary.atRiskLocations.length > 0 && (
                    <Box>
                      <Typography
                        variant="compactMicro"
                        sx={{
                          color: tierColors[3],
                          fontWeight: theme.typography.fontWeightSemiBold,
                          display: "block",
                          mb: 0.5,
                        }}
                      >
                        At-risk locations (
                        {outcomeSummary.atRiskLocations.length}):
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {outcomeSummary.atRiskLocations
                          .slice(0, 5)
                          .map((loc) => (
                            <Chip
                              key={loc.duId}
                              size="small"
                              label={loc.primaryName}
                              onClick={() => handleLocationClick(loc)}
                              sx={{
                                ...theme.typography.compact.micro,
                                cursor: "pointer",
                                backgroundColor: "transparent",
                                color: theme.palette.grey[600],
                                border: theme.border.medium,
                                height: 18,
                                "&:hover": {
                                  backgroundColor: theme.palette.blue.bright,
                                  color: theme.palette.common.white,
                                  borderColor: theme.palette.blue.bright,
                                },
                                "& .MuiChip-label": {
                                  px: 0.75,
                                },
                              }}
                            />
                          ))}
                        {outcomeSummary.atRiskLocations.length > 5 && (
                          <Typography
                            variant="compactMicro"
                            sx={{
                              color: theme.palette.grey[500],
                              alignSelf: "center",
                            }}
                          >
                            +{outcomeSummary.atRiskLocations.length - 5} more
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt to select an outcome - shown when no outcome is selected (overlay only) */}
      {!isInline && !selectedOutcome && !isLoading && (
        <Typography
          variant="compactCaption"
          sx={{
            color: theme.palette.grey[500],
            fontStyle: "italic",
            display: "block",
            borderTop: theme.border.light,
            pt: 1.5,
          }}
        >
          Click on an outcome chart above to see detailed analysis.
        </Typography>
      )}
    </Box>
  )
}

export default SummaryPanel
