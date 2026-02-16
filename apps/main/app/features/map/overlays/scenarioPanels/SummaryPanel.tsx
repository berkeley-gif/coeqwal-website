"use client"

/**
 * SummaryPanel - Scenario summary overlay
 *
 * Displays a summary of scenario outcomes with tier glyphs.
 * Used in both Learn map and Explore views. Note: this feature is
 * experimental and unfinished.
 */

import { useEffect, useState, useCallback } from "react"
import {
  Box,
  Typography,
  CircularProgress,
  useTheme,
  Theme,
  SxProps,
} from "@repo/ui/mui"
import { TierChip, LocationChip } from "@repo/ui"
import { motion, AnimatePresence } from "@repo/motion"
import {
  generateOutcomeSummary,
  generateOutcomeInsight,
  OutcomeSummary,
  AtRiskLocation,
  DemandUnitProperties,
} from "../../../summary/summaryGenerator"
import {
  TIER_LABELS,
  TierLevel,
  getTierColorsFromTheme,
} from "../../../../content/tiers"
import { fetchTierLocations } from "../../visualizationLayers/hooks/useTierData"
import { fetchTierLocationData } from "@repo/data/coeqwal"
import { getOutcomeName } from "../../../../content/outcomes"
import { useActiveOutcomeVisualization } from "../../store"
import { useMap } from "@repo/map"

// ============================================================================
// Styles
// ============================================================================

/** Common flex wrapper for chips */
const flexWrapStyles: SxProps<Theme> = {
  display: "flex",
  flexWrap: "wrap",
  gap: 0.5,
}

// ============================================================================
// Component
// ============================================================================

interface SummaryPanelProps {
  scenarioId?: string
  /** Optional outcome code override - if not provided, reads from store (Learn mode) */
  outcomeCode?: string | null
  /** Variant: 'overlay' for map overlay (narrow), 'inline' for strategy grid (full width) */
  variant?: "overlay" | "inline"
}

export function SummaryPanel({
  scenarioId = "s0020",
  outcomeCode: outcomeCodeProp,
  variant = "overlay",
}: SummaryPanelProps) {
  const theme = useTheme()
  const mapAPI = useMap()
  const activeVisualization = useActiveOutcomeVisualization()

  // Get outcome code - prefer prop, fall back to store
  const selectedOutcomeCode =
    outcomeCodeProp ?? activeVisualization?.outcomeCode ?? null

  // Display name for UI
  const selectedOutcome = selectedOutcomeCode
    ? getOutcomeName(selectedOutcomeCode)
    : null

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
    if (!selectedOutcomeCode) {
      setOutcomeSummary(null)
      return
    }

    // Capture non-null values for use in async function
    const outcome = selectedOutcome!
    const tierCode = selectedOutcomeCode

    let cancelled = false

    async function loadSummary() {
      setIsLoading(true)

      try {
        if (!scenarioId || !tierCode) return

        const tierData = await fetchTierLocations(scenarioId, tierCode)

        if (cancelled) return

        // Also fetch GeoJSON data for reliable coordinates and API names
        const apiNamesMap = new Map<string, string>()
        try {
          const geoJsonData = await fetchTierLocationData(scenarioId, tierCode)
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
        // to enrich the summary with actual location names from Mapbox
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
  }, [selectedOutcomeCode, selectedOutcome, scenarioId, mapAPI])

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
      const featureProps = featurePropsMap?.get(location.duId)
      const lng = featureProps?.longitude
      const lat = featureProps?.latitude
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
          : `${theme.palette.common.white}F2`,
        borderRadius: isInline ? theme.borderRadius.md : 0,
        padding: isInline ? theme.space.card.xs : theme.space.card.sm,
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
        pointerEvents: "auto",
      }}
    >
      {/* Panel title - matches KeyOutcomesPanel styling (hidden for inline variant) */}
      {!isInline && (
        <>
          <Typography
            variant="subtitle2"
            sx={{
              mb: theme.space.component.xs,
              color: theme.palette.grey[900],
            }}
          >
            Scenario summary
          </Typography>

          {/* Base scenario summary - always shown (only for overlay) */}
          <Typography
            variant="dashboard"
            sx={{
              color: theme.palette.grey[700],
              mb: theme.space.component.lg,
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
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: theme.space.gap.sm,
                py: theme.space.component.sm,
              }}
            >
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
                variant="outcomeHeader"
                sx={{
                  color: theme.palette.blue.medium,
                  mb: theme.space.component.sm,
                }}
              >
                {selectedOutcome}
              </Typography>

              {/* Generated insight */}
              <Typography
                variant="dashboard"
                sx={{
                  color: theme.palette.grey[700],
                  mb: theme.space.component.md,
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
                    gap: theme.space.gap.lg,
                    alignItems: "flex-start",
                  }}
                >
                  {/* Tier breakdown chips */}
                  <Box sx={{ ...flexWrapStyles, alignItems: "center" }}>
                    {Object.entries(outcomeSummary.tierBreakdown).map(
                      ([tier, data]) => {
                        const tierNum = parseInt(
                          tier.replace("tier", ""),
                        ) as TierLevel
                        return (
                          <TierChip
                            key={tier}
                            label={`${TIER_LABELS[tierNum]}: ${data.count}`}
                            color={tierColors[tierNum]}
                          />
                        )
                      },
                    )}
                  </Box>

                  {/* Critical locations inline */}
                  {outcomeSummary.criticalLocations.length > 0 && (
                    <Box sx={{ ...flexWrapStyles, alignItems: "center" }}>
                      <Typography
                        variant="smallSectionLabel"
                        component="span"
                        sx={{ color: tierColors[4], mr: 0.5 }}
                      >
                        Critical:
                      </Typography>
                      {outcomeSummary.criticalLocations
                        .slice(0, 6)
                        .map((loc) => (
                          <LocationChip
                            key={loc.duId}
                            label={loc.primaryName}
                            onClick={() => handleLocationClick(loc)}
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
                    <Box sx={{ ...flexWrapStyles, alignItems: "center" }}>
                      <Typography
                        variant="smallSectionLabel"
                        component="span"
                        sx={{ color: tierColors[3], mr: 0.5 }}
                      >
                        At-risk:
                      </Typography>
                      {outcomeSummary.atRiskLocations.slice(0, 4).map((loc) => (
                        <LocationChip
                          key={loc.duId}
                          label={loc.primaryName}
                          onClick={() => handleLocationClick(loc)}
                          variant="muted"
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
                  <Box sx={{ ...flexWrapStyles, mb: theme.space.component.md }}>
                    {Object.entries(outcomeSummary.tierBreakdown).map(
                      ([tier, data]) => {
                        const tierNum = parseInt(
                          tier.replace("tier", ""),
                        ) as TierLevel
                        return (
                          <TierChip
                            key={tier}
                            label={`${TIER_LABELS[tierNum]}: ${data.count}`}
                            color={tierColors[tierNum]}
                          />
                        )
                      },
                    )}
                  </Box>

                  {/* Critical locations with zoom links */}
                  {outcomeSummary.criticalLocations.length > 0 && (
                    <Box sx={{ mb: theme.space.component.md }}>
                      <Typography
                        variant="smallSectionLabel"
                        sx={{
                          color: tierColors[4],
                          mb: theme.space.component.xs,
                        }}
                      >
                        Critical locations:
                      </Typography>
                      <Box sx={flexWrapStyles}>
                        {outcomeSummary.criticalLocations
                          .slice(0, 8)
                          .map((loc) => (
                            <LocationChip
                              key={loc.duId}
                              label={loc.primaryName}
                              onClick={() => handleLocationClick(loc)}
                            />
                          ))}
                        {outcomeSummary.criticalLocations.length > 8 && (
                          <Typography
                            variant="compactMicro"
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
                        variant="smallSectionLabel"
                        sx={{ color: tierColors[3], mb: 0.5 }}
                      >
                        At-risk locations (
                        {outcomeSummary.atRiskLocations.length}):
                      </Typography>
                      <Box sx={flexWrapStyles}>
                        {outcomeSummary.atRiskLocations
                          .slice(0, 5)
                          .map((loc) => (
                            <LocationChip
                              key={loc.duId}
                              label={loc.primaryName}
                              onClick={() => handleLocationClick(loc)}
                              variant="muted"
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
