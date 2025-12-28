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
import { Map, NavigationControl, MapProvider } from "@repo/map"
import { useScenarioExplorerStore } from "../../store"
import {
  getMapMetrics,
  outcomeCategories,
  getOutcomeCategoryColor,
} from "../../config/outcomeDefinitions"
import {
  fetchTierLocationData,
  type TierLocationResponse,
} from "../../../../lib/api/tierLocationApi"
import { getDisplayNameFromMetricId } from "../../../../lib/constants/outcomeMappings"
import TierMarkers from "../../../map/visualizationLayers/components/TierMarkers"
import { TierLegend } from "../../../scenarios/components"
import TemporalControls from "./TemporalControls"
import type {
  TemporalScale,
  AggregationType,
} from "../../config/outcomeDefinitions"
import {
  captureMapScreenshot,
  getTimestampedFilename,
} from "../utils/exportUtils"

/**
 * MapView: Spatial visualization of outcomes
 */
function MapViewContent() {
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

        // Get UI display name, which will be converted to API name in tierLocationApi
        const outcomeDisplayName = getDisplayNameFromMetricId(metric.id)

        if (!outcomeDisplayName) {
          console.warn(`No outcome mapping for metric: ${metric.id}`)
          setTierLocationData(null)
          return
        }

        // Use scenarioId directly (no need for strategy conversion)
        const data = await fetchTierLocationData(
          selectedScenario,
          outcomeDisplayName,
        )

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
          p: theme.space.component.xl,
          textAlign: "center",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.grey[600],
            mb: theme.space.component.lg,
          }}
        >
          No scenarios selected
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.grey[500],
            mb: theme.space.section.sm,
            maxWidth: theme.layout.maxWidth.md,
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
        gap: theme.space.gap.lg,
      }}
    >
      {/* Left sidebar */}
      <Box
        sx={{
          width: "360px",
          display: "flex",
          flexDirection: "column",
          gap: theme.space.gap.lg,
          overflowY: "auto",
          pr: theme.space.component.lg,
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
                    sx={{ pl: theme.space.section.md }}
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
              p: theme.space.component.lg,
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.borderRadius.md,
              border: category
                ? `1px solid ${getOutcomeCategoryColor(theme, category.id)}`
                : theme.border.medium,
            }}
          >
            {/* Category badge */}
            {category && (
              <Chip
                label={category.name}
                size="small"
                sx={{
                  mb: theme.space.component.sm,
                  backgroundColor: getOutcomeCategoryColor(theme, category.id),
                  color: theme.palette.common.white,
                  fontWeight: theme.typography.fontWeightMedium,
                }}
              />
            )}

            {/* Metric name */}
            <Typography
              variant="h6"
              sx={{
                mb: theme.space.component.sm,
              }}
            >
              {metric.name}
            </Typography>

            {/* Description */}
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.grey[600],
                mb: theme.space.component.md,
              }}
            >
              {metric.description}
            </Typography>

            {/* Metadata */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: theme.space.gap.xs,
              }}
            >
              <Typography variant="compactSubtitle">
                <strong>Unit:</strong> {metric.unit}
              </Typography>
              <Typography variant="compactSubtitle">
                <strong>Spatial Type:</strong> {metric.spatialType}
              </Typography>
              {metric.spatialLocation && (
                <Typography variant="compactSubtitle">
                  <strong>Location:</strong> {metric.spatialLocation}
                </Typography>
              )}
            </Box>

            {/* Notes */}
            {metric.notes && (
              <Box
                sx={{
                  mt: theme.space.component.md,
                  p: theme.space.component.sm,
                  backgroundColor: theme.palette.accent.gold,
                  borderRadius: theme.borderRadius.md,
                }}
              >
                <Typography variant="compactSubtitle">
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
              sx={{ mb: theme.space.component.md }}
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
          borderRadius: theme.borderRadius.md,
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
            zoom: 4,
          }}
          minZoom={4}
          maxZoom={18}
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
              top: theme.space.component.lg,
              left: theme.space.component.lg,
              right: theme.space.component.lg,
              p: theme.space.component.lg,
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: theme.borderRadius.md,
              boxShadow: theme.shadow.sm,
            }}
          >
            {isLoadingMap && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: theme.space.gap.lg,
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
              bottom: theme.space.component.lg,
              right: theme.space.component.lg,
              p: theme.space.component.md,
              backgroundColor: theme.background.whiteOverlay[95],
              borderRadius: theme.borderRadius.md,
              boxShadow: theme.shadow.subtle,
              maxWidth: "320px",
            }}
          >
            <Typography
              variant="compactSubtitle"
              sx={{ color: theme.palette.text.primary }}
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

// Exported wrapper that provides its own MapProvider context
export default function MapView() {
  return (
    <MapProvider>
      <MapViewContent />
    </MapProvider>
  )
}
