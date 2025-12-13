"use client"
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
import { STRATEGY_TO_SCENARIO_ID } from "../../../lib/constants/outcomeMappings"
import { useSelectedOutcome } from "../store"
import { useMap } from "@repo/map"

interface SummaryPanelProps {
  strategy?: string
}

export function SummaryPanel({ strategy = "current-ops" }: SummaryPanelProps) {
  const theme = useTheme()
  const mapAPI = useMap()
  const selectedOutcome = useSelectedOutcome()

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

  // Fetch tier data and generate summary when outcome changes
  useEffect(() => {
    if (!selectedOutcome) {
      setOutcomeSummary(null)
      return
    }

    let cancelled = false

    async function loadSummary() {
      setIsLoading(true)

      try {
        const scenarioId = STRATEGY_TO_SCENARIO_ID[strategy]
        if (!scenarioId) return

        // Get tier code from outcome
        const tierCode =
          selectedOutcome === "Community deliveries"
            ? "CWS_DEL"
            : selectedOutcome === "Agricultural revenue"
              ? "AG_REV"
              : null

        if (!tierCode) return

        const tierData = await fetchTierLocations(scenarioId, tierCode)

        if (cancelled) return

        // Try to get feature properties from the map for location names
        // This enriches the summary with actual location names from Mapbox
        let propsMap: Map<string, DemandUnitProperties> | undefined

        mapAPI.withMap((mapRef) => {
          const map = mapRef.getMap()
          propsMap = new Map<string, DemandUnitProperties>()

          // Query source features to get properties
          const features = map.querySourceFeatures("composite", {
            sourceLayer: "demand_units",
          })

          features.forEach((f) => {
            const duId = f.properties?.DU_ID
            if (
              duId &&
              (f.geometry.type === "Polygon" ||
                f.geometry.type === "MultiPolygon")
            ) {
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
                coords = f.geometry.coordinates[0][0][0] as [number, number]
              }

              propsMap!.set(duId, {
                DU_ID: duId,
                Urb_Name: f.properties?.Urb_Name || null,
                Mod_Name: f.properties?.Mod_Name || null,
                Sub_Name: f.properties?.Sub_Name || null,
                Type: f.properties?.Type || null,
                Comments: f.properties?.Comments || null,
                Class: f.properties?.Class || "Unknown",
                longitude: coords[0],
                latitude: coords[1],
              })
            }
          })
        })

        if (!cancelled) {
          setFeaturePropsMap(propsMap ?? null)
        }

        // Generate summary using the freshly fetched props map
        const summary = generateOutcomeSummary(
          selectedOutcome!,
          tierData,
          propsMap,
        )

        if (!cancelled) {
          setOutcomeSummary(summary)
        }
      } catch (err) {
        console.error("Error loading summary:", err)
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
      if (!location.coordinates) {
        // Try to find coordinates from feature props map
        const props = featurePropsMap?.get(location.duId)
        const lng = props?.longitude
        const lat = props?.latitude
        if (lng !== undefined && lat !== undefined) {
          mapAPI.withMap((mapRef) => {
            const map = mapRef.getMap()
            map.flyTo({
              center: [lng, lat],
              zoom: 10,
              duration: 1500,
            })
          })
        }
        return
      }

      mapAPI.withMap((mapRef) => {
        const map = mapRef.getMap()
        map.flyTo({
          center: location.coordinates!,
          zoom: 10,
          duration: 1500,
        })
      })
    },
    [mapAPI, featurePropsMap],
  )

  return (
    <Box
      sx={{
        // Match the styling of other panels (StrategyRow, KeyOperationsPanel, KeyOutcomesPanel)
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 0,
        padding: { xs: 2, sm: 2.5, md: 3 },
        boxShadow: theme.shadows[2],
        width: "100%",
        maxWidth: { xs: "100%", sm: "360px", md: "420px", lg: "460px", xl: "500px" },
        boxSizing: "border-box",
        pointerEvents: "auto",
      }}
    >
      {/* Panel title - matches KeyOutcomesPanel styling */}
      <Typography
        variant="subtitle2"
        sx={{
          mb: 0.5,
          fontSize: theme.typography.body2.fontSize,
          fontWeight: theme.typography.fontWeightMedium,
          color: theme.palette.grey[900],
        }}
      >
        Scenario summary
      </Typography>

      {/* Base scenario summary - always shown */}
      <Typography
        variant="body2"
        sx={{
          color: theme.palette.grey[700],
          lineHeight: 1.5,
          fontSize: theme.typography.nav.fontSize,
          mb: 2,
        }}
      >
        Overall, this scenario favors community and agricultural water
        deliveries, though not every community is served equally. Freshwater for
        Delta exports is preserved, though Delta estuary ecology is at risk.
        Winter-run Chinook Salmon are red-lining.
      </Typography>

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
                variant="caption"
                sx={{
                  color: theme.palette.grey[500],
                  fontSize: "0.75rem",
                }}
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
                borderTop: `1px solid ${theme.palette.grey[200]}`,
                pt: 2,
              }}
            >
              {/* Outcome name header */}
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.blue.medium,
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  letterSpacing: "0.5px",
                  display: "block",
                  mb: 1,
                }}
              >
                {selectedOutcome}
              </Typography>

              {/* Generated insight */}
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.grey[700],
                  lineHeight: 1.5,
                  fontSize: theme.typography.nav.fontSize,
                  mb: 1.5,
                }}
              >
                {generateOutcomeInsight(selectedOutcome, outcomeSummary)}
              </Typography>

              {/* Tier breakdown chips */}
              <Box
                sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}
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
                          backgroundColor: `${tierColors[tierNum]}15`,
                          color: tierColors[tierNum],
                          borderColor: `${tierColors[tierNum]}40`,
                          border: "1px solid",
                          fontSize: "0.65rem",
                          fontWeight: 500,
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
                    variant="caption"
                    sx={{
                      color: tierColors[4],
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      display: "block",
                      mb: 0.5,
                    }}
                  >
                    Critical locations:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {outcomeSummary.criticalLocations.slice(0, 8).map((loc) => (
                      <Chip
                        key={loc.duId}
                        size="small"
                        label={loc.primaryName}
                        onClick={() => handleLocationClick(loc)}
                        sx={{
                          cursor: "pointer",
                          backgroundColor: "transparent",
                          color: theme.palette.grey[700],
                          border: `1px solid ${theme.palette.grey[300]}`,
                          fontSize: "0.6rem",
                          height: 20,
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
                    {outcomeSummary.criticalLocations.length > 8 && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.grey[500],
                          fontSize: "0.6rem",
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
                    variant="caption"
                    sx={{
                      color: tierColors[3],
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      display: "block",
                      mb: 0.5,
                    }}
                  >
                    At-risk locations ({outcomeSummary.atRiskLocations.length}):
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {outcomeSummary.atRiskLocations.slice(0, 5).map((loc) => (
                      <Chip
                        key={loc.duId}
                        size="small"
                        label={loc.primaryName}
                        onClick={() => handleLocationClick(loc)}
                        sx={{
                          cursor: "pointer",
                          backgroundColor: "transparent",
                          color: theme.palette.grey[600],
                          border: `1px solid ${theme.palette.grey[300]}`,
                          fontSize: "0.6rem",
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
                        variant="caption"
                        sx={{
                          color: theme.palette.grey[500],
                          fontSize: "0.6rem",
                          alignSelf: "center",
                        }}
                      >
                        +{outcomeSummary.atRiskLocations.length - 5} more
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt to select an outcome - shown when no outcome is selected */}
      {!selectedOutcome && !isLoading && (
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.grey[500],
            fontStyle: "italic",
            fontSize: "0.75rem",
            display: "block",
            borderTop: `1px solid ${theme.palette.grey[200]}`,
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
