"use client"

import React from "react"
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  Chip,
  CircularProgress,
  Button,
} from "@repo/ui/mui"
import { Map, NavigationControl } from "@repo/map"
import { useScenarioExplorerStore } from "@repo/state"
import { getMapMetrics, outcomeCategories } from "../outcomeDefinitions"
import {
  fetchTierLocationData,
  type TierLocationResponse,
} from "../../../../../api/tierLocationApi"
import TierMarkers from "../../../components/TierMarkers"
import TierLegend from "../../../components/TierLegend"
import TemporalControls from "./TemporalControls"
import type { TemporalScale, AggregationType } from "../outcomeDefinitions"
import {
  captureMapScreenshot,
  getTimestampedFilename,
} from "../utils/exportUtils"

/**
 * MapView: Spatial visualization of outcomes
 * Shows metrics that have geographic locations
 */
export default function MapView() {
  const theme = useTheme()
  const { selectedScenarios, setActiveView } = useScenarioExplorerStore()
  const mapMetrics = getMapMetrics()

  const [selectedMetric, setSelectedMetric] = React.useState<string>(
    mapMetrics[0]?.id ?? "",
  )
  const [selectedScenario, setSelectedScenario] = React.useState<string>(
    selectedScenarios[0] ?? "",
  )

  // Sync selectedScenario with selectedScenarios when they change
  React.useEffect(() => {
    if (selectedScenarios.length > 0) {
      // If current selection is not in the list, use the first one
      if (!selectedScenarios.includes(selectedScenario)) {
        setSelectedScenario(selectedScenarios[0] ?? "")
      }
    } else {
      setSelectedScenario("")
    }
  }, [selectedScenarios, selectedScenario])

  // Temporal controls state
  const [selectedTemporal, setSelectedTemporal] =
    React.useState<TemporalScale>("annual")
  const [selectedAggregation, setSelectedAggregation] =
    React.useState<AggregationType | null>(null)
  const [showDryYearsOnly, setShowDryYearsOnly] = React.useState(false)

  // Map container ref for screenshot
  const mapContainerRef = React.useRef<HTMLDivElement>(null)

  // Fetch tier location data for map visualization
  const [tierLocationData, setTierLocationData] =
    React.useState<TierLocationResponse | null>(null)
  const [isLoadingMap, setIsLoadingMap] = React.useState(false)
  const [mapError, setMapError] = React.useState<string | null>(null)

  // Screenshot handler
  const handleScreenshot = async () => {
    try {
      await captureMapScreenshot(
        mapContainerRef.current,
        getTimestampedFilename("coeqwal-map", "png"),
      )
    } catch (err) {
      console.error("Failed to capture screenshot:", err)
      alert("Failed to capture screenshot. Please try again.")
    }
  }

  const metric = mapMetrics.find((m) => m.id === selectedMetric)
  const category = metric
    ? outcomeCategories.find((c) => c.id === metric.category)
    : null

  // Get strategy value from scenario ID
  const getStrategyFromScenario = (scenarioId: string): string => {
    const mapping: Record<string, string> = {
      s0020: "current-ops",
      s0021: "current-ops-wo-tucp",
      s0011: "current-ops-historical-ag",
    }
    return mapping[scenarioId] || "current-ops"
  }

  // Fetch tier location data when metric or scenario changes
  React.useEffect(() => {
    if (!metric || !selectedScenario || !metric.showOnMap || !metric.isTier) {
      setTierLocationData(null)
      return
    }

    let cancelled = false

    async function fetchData() {
      // Type guard: ensure metric is defined in this scope
      if (!metric) return

      try {
        setIsLoadingMap(true)
        setMapError(null)

        const strategy = getStrategyFromScenario(selectedScenario)

        // Map metric ID to outcome display name
        const outcomeMap: Record<string, string> = {
          "cws-delivery-tier": "Community deliveries",
          "ag-revenue-tier": "Agricultural revenue",
          "env-flow-tier": "Environmental flows",
          "env-delta-ecology-tier": "Delta estuary ecology",
          "salinity-in-delta-tier": "Freshwater for in-Delta uses",
          "salinity-exports-tier": "Freshwater for Delta exports",
          "reservoir-storage-tier": "Reservoir storage",
          "gw-storage-tier": "Groundwater storage",
          "salmon-tier": "Salmon abundance",
        }

        const outcomeDisplayName = outcomeMap[metric.id]

        if (!outcomeDisplayName) {
          console.warn(`No outcome mapping for metric: ${metric.id}`)
          setTierLocationData(null)
          return
        }

        const data = await fetchTierLocationData(strategy, outcomeDisplayName)

        if (!cancelled) {
          setTierLocationData(data)
        }
      } catch (err) {
        if (!cancelled) {
          setMapError(
            err instanceof Error ? err.message : "Failed to fetch map data",
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMap(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [metric, selectedScenario])

  // Empty state when no scenarios selected
  if (selectedScenarios.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          p: theme.spacing(theme.cards.spacing.standard),
          textAlign: "center",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.grey[600],
            mb: theme.spacing(2),
          }}
        >
          No scenarios selected
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.grey[500],
            mb: theme.spacing(3),
            maxWidth: "400px",
          }}
        >
          Select scenarios in List View to view their outcomes on the map.
        </Typography>
        <Button
          variant="contained"
          onClick={() => setActiveView("list")}
          sx={{
            backgroundColor: theme.palette.blue.darkest,
            color: theme.palette.common.white,
            textTransform: "none",
            "&:hover": {
              backgroundColor: theme.palette.blue.bright,
            },
          }}
        >
          Go to list view
        </Button>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        gap: theme.spacing(2),
      }}
    >
      {/* Left sidebar */}
      <Box
        sx={{
          width: theme.spacing(45),
          display: "flex",
          flexDirection: "column",
          gap: theme.spacing(2),
          overflowY: "auto",
          pr: theme.spacing(2),
        }}
      >
        {/* Metric selector */}
        <FormControl fullWidth>
          <InputLabel id="metric-select-label">Select outcome</InputLabel>
          <Select
            labelId="metric-select-label"
            value={selectedMetric}
            label="Select outcome"
            onChange={(e) => setSelectedMetric(e.target.value)}
          >
            {outcomeCategories.map((cat) => {
              const catMetrics = mapMetrics.filter((m) => m.category === cat.id)
              if (catMetrics.length === 0) return null

              return [
                <MenuItem key={`header-${cat.id}`} disabled>
                  <Typography
                    sx={{
                      fontWeight: theme.typography.fontWeightMedium,
                      color: theme.palette.text.primary,
                    }}
                  >
                    {cat.icon} {cat.name}
                  </Typography>
                </MenuItem>,
                ...catMetrics.map((m) => (
                  <MenuItem
                    key={m.id}
                    value={m.id}
                    sx={{ pl: theme.spacing(4) }}
                  >
                    {m.name}
                  </MenuItem>
                )),
              ]
            })}
          </Select>
        </FormControl>

        {/* Scenario selector (if multiple scenarios) */}
        {selectedScenarios.length > 1 && (
          <FormControl fullWidth>
            <InputLabel id="scenario-select-label">Select scenario</InputLabel>
            <Select
              labelId="scenario-select-label"
              value={selectedScenario}
              label="Select scenario"
              onChange={(e) => setSelectedScenario(e.target.value)}
            >
              {selectedScenarios.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Metric info card */}
        {metric && (
          <Box
            sx={{
              p: theme.spacing(2),
              backgroundColor: theme.palette.common.white,
              borderRadius: theme.borderRadius.rounded,
              border: theme.border.standard,
              borderColor: category ? category.color : theme.palette.grey[300],
            }}
          >
            {/* Category badge */}
            {category && (
              <Chip
                label={category.name}
                size="small"
                sx={{
                  mb: theme.spacing(1),
                  backgroundColor: category.color,
                  color: theme.palette.common.white,
                  fontWeight: theme.typography.fontWeightMedium,
                }}
              />
            )}

            {/* Metric name */}
            <Typography
              variant="h6"
              sx={{
                mb: theme.spacing(1),
                fontSize: theme.typography.h6.fontSize,
              }}
            >
              {metric.name}
            </Typography>

            {/* Description */}
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.grey[600],
                mb: theme.spacing(1.5),
              }}
            >
              {metric.description}
            </Typography>

            {/* Metadata */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing(0.5),
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontSize: theme.typography.compact.subtitle.fontSize }}
              >
                <strong>Unit:</strong> {metric.unit}
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontSize: theme.typography.compact.subtitle.fontSize }}
              >
                <strong>Spatial Type:</strong> {metric.spatialType}
              </Typography>
              {metric.spatialLocation && (
                <Typography
                  variant="body2"
                  sx={{ fontSize: theme.typography.compact.subtitle.fontSize }}
                >
                  <strong>Location:</strong> {metric.spatialLocation}
                </Typography>
              )}
            </Box>

            {/* Notes */}
            {metric.notes && (
              <Box
                sx={{
                  mt: theme.spacing(1.5),
                  p: theme.spacing(1),
                  backgroundColor: theme.palette.accent.gold,
                  borderRadius: theme.borderRadius.standard,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: theme.typography.compact.subtitle.fontSize,
                  }}
                >
                  ⚠️ {metric.notes}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Temporal controls */}
        {metric && metric.temporal.length > 0 && (
          <TemporalControls
            availableTemporal={metric.temporal}
            availableAggregations={metric.aggregations}
            selectedTemporal={selectedTemporal}
            selectedAggregation={selectedAggregation}
            onTemporalChange={(t) => setSelectedTemporal(t)}
            onAggregationChange={(a) => setSelectedAggregation(a)}
            showDryYearsOnly={showDryYearsOnly}
            onDryYearsToggle={() => setShowDryYearsOnly(!showDryYearsOnly)}
          />
        )}

        {/* Outcome legend */}
        {metric && metric.isTier && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                mb: theme.spacing(1.5),
                fontWeight: theme.typography.fontWeightMedium,
              }}
            >
              Outcome legend
            </Typography>
            <TierLegend outcome={metric.name} onClose={() => {}} />
          </Box>
        )}

        {/* Export button */}
        <Button
          variant="outlined"
          onClick={handleScreenshot}
          fullWidth
          sx={{ textTransform: "none" }}
        >
          📷 Export map screenshot
        </Button>
      </Box>

      {/* Right side - map */}
      <Box
        ref={mapContainerRef}
        sx={{
          flex: 1,
          position: "relative",
          borderRadius: theme.borderRadius.rounded,
          overflow: "hidden",
          backgroundColor: theme.palette.grey[100],
        }}
      >
        <Map
          mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""}
          mapStyle="mapbox://styles/mapbox/light-v11"
          initialViewState={{
            longitude: -118,
            latitude: 39,
            zoom: 5.8,
          }}
          minZoom={5.8}
          maxZoom={10}
          scrollZoom={true}
          touchZoom={true}
          doubleClickZoom={true}
          dragPan={true}
          dragRotate={false}
          touchRotate={false}
          keyboard={false}
          style={{ width: "100%", height: "100%" }}
          projection={{ name: "mercator" }}
          terrain={undefined}
        >
          <NavigationControl position="bottom-right" />

          {/* Render tier markers when data is available */}
          {tierLocationData &&
            tierLocationData.features &&
            tierLocationData.features.length > 0 && (
              <TierMarkers data={tierLocationData} />
            )}
        </Map>

        {/* Status overlay */}
        {(isLoadingMap || mapError || !tierLocationData) && (
          <Box
            sx={{
              position: "absolute",
              top: theme.spacing(2),
              left: theme.spacing(2),
              right: theme.spacing(2),
              p: theme.spacing(2),
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: theme.borderRadius.rounded,
              boxShadow: theme.shadow.medium,
            }}
          >
            {isLoadingMap && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: theme.spacing(2),
                }}
              >
                <CircularProgress size={20} />
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.primary }}
                >
                  Loading map data for <strong>{metric?.name}</strong>...
                </Typography>
              </Box>
            )}

            {mapError && (
              <Typography
                variant="body2"
                sx={{ color: theme.palette.accent.alert }}
              >
                ⚠️ {mapError}
              </Typography>
            )}

            {!isLoadingMap && !mapError && !tierLocationData && metric && (
              <Typography
                variant="body2"
                sx={{ color: theme.palette.grey[600] }}
              >
                {metric.isTier
                  ? "Select a scenario to view spatial data"
                  : "This metric does not have spatial data available"}
              </Typography>
            )}
          </Box>
        )}

        {/* Info overlay when data is loaded */}
        {tierLocationData && !isLoadingMap && !mapError && (
          <Box
            sx={{
              position: "absolute",
              bottom: theme.spacing(2),
              right: theme.spacing(2),
              p: theme.spacing(1.5),
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: theme.borderRadius.rounded,
              boxShadow: theme.shadow.subtle,
              maxWidth: theme.spacing(40),
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.primary,
                fontSize: theme.typography.compact.subtitle.fontSize,
              }}
            >
              <strong>{tierLocationData.metadata.feature_count}</strong>{" "}
              location
              {tierLocationData.metadata.feature_count !== 1 ? "s" : ""} •{" "}
              <strong>{metric?.name}</strong> • {selectedScenario}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
