"use client"

/**
 * GeocodingPanel - "Find my basin"  (Learn Map)
 *
 * Allows users to search for California locations and discover which basin they're in.
 * Integrates with Mapbox geocoding API and basin lookup functionality.
 */

import { useState, useEffect, useRef } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { StyledTextInput } from "@repo/ui"
import { useMap, useGeocoding, useBasinLookup, BOUNDING_BOXES } from "@repo/map"
import type { GeocodingFeature } from "@repo/map"
import { bbox } from "@turf/turf"
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from "geojson"
import { CENTRAL_VALLEY_VIEW } from "../config/cameraPresets"

interface GeocodingPanelProps {
  /** Basin GeoJSON data for lookup */
  basinsData: FeatureCollection<Polygon | MultiPolygon> | null | undefined
  /** Callback when geocoder marker should be set/cleared */
  onMarkerChange: (coords: [number, number] | null) => void
  /** External trigger to clear/reset the panel */
  resetTrigger?: number
}

export function GeocodingPanel({
  basinsData,
  onMarkerChange,
  resetTrigger,
}: GeocodingPanelProps) {
  const theme = useTheme()
  const map = useMap()

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] =
    useState<GeocodingFeature | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [basinInfo, setBasinInfo] = useState<{
    name: string
    properties: Record<string, unknown>
  } | null>(null)
  const [isSelectingResult, setIsSelectingResult] = useState(false)

  // Geocoding hook
  const geocoding = useGeocoding({
    bbox: BOUNDING_BOXES.CALIFORNIA,
    countries: ["us"],
    types: ["place", "address", "poi"],
    limit: 5,
    flyTo: false, // Handling map movement manually
  })

  // Basin lookup hook
  const { findBasin } = useBasinLookup(basinsData)

  // Search when query changes (debounced)
  useEffect(() => {
    if (isSelectingResult) {
      setIsSelectingResult(false)
      return
    }

    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        geocoding.search(searchQuery)
      }, 300) // 300ms debounce
      return () => clearTimeout(timeoutId)
    } else {
      geocoding.clear()
      setShowResults(false)
      setSelectedLocation(null)
      setBasinInfo(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // Show results when available
  useEffect(() => {
    setShowResults(geocoding.results.length > 0)
  }, [geocoding.results])

  // Handle location selection
  const handleSelectLocation = (feature: GeocodingFeature) => {
    setIsSelectingResult(true)
    setSelectedLocation(feature)
    setSearchQuery(feature.place_name)
    setShowResults(false)

    // Set marker at selected location
    const [lng, lat] = feature.center
    onMarkerChange([lng, lat])

    // Find which basin this location is in
    const basin = findBasin(lng, lat)
    setBasinInfo(basin)

    // Zoom to basin or location
    if (basin && basinsData) {
      const basinFeature = basinsData.features.find(
        (f) => f.properties?.name === basin.name,
      ) as Feature<Polygon | MultiPolygon> | undefined

      if (basinFeature) {
        const [minLng, minLat, maxLng, maxLat] = bbox(basinFeature)
        map.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          0, // pitch
          0, // bearing
          { top: 100, bottom: 100, left: 100, right: 100 }, // padding
          { duration: 1500 },
        )
      }
    } else {
      // No basin found, zoom to location
      map.flyTo({
        longitude: lng,
        latitude: lat,
        zoom: 7,
        transitionOptions: { duration: 1500 },
      })
    }
  }

  // Clear search and reset map view
  const handleClearSearch = () => {
    setSearchQuery("")
    setSelectedLocation(null)
    setBasinInfo(null)
    onMarkerChange(null)
    setIsSelectingResult(false)
    geocoding.clear()
    setShowResults(false)

    // Zoom back out to Central Valley view
    map.flyTo({
      longitude: CENTRAL_VALLEY_VIEW.longitude,
      latitude: CENTRAL_VALLEY_VIEW.latitude,
      zoom: CENTRAL_VALLEY_VIEW.zoom,
      transitionOptions: { duration: 1500 },
    })
  }

  // Track previous reset trigger to only reset on actual changes
  const prevResetTriggerRef = useRef(resetTrigger)

  // Reset panel when triggered externally (counter increments)
  useEffect(() => {
    if (
      resetTrigger !== undefined &&
      resetTrigger !== prevResetTriggerRef.current
    ) {
      prevResetTriggerRef.current = resetTrigger
      handleClearSearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger])

  return (
    <Box
      sx={{
        backgroundColor: theme.background.whiteOverlay[95],
        borderRadius: theme.borderRadius.none,
        padding: theme.space.panel.xs,
        boxShadow: theme.shadow.sm,
        pointerEvents: "auto",
      }}
    >
      <Typography
        variant="body1"
        sx={{ mb: theme.space.component.lg, color: theme.palette.grey[900] }}
      >
        Find my basin
      </Typography>

      {/* Search input */}
      <Box sx={{ position: "relative" }}>
        <StyledTextInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Enter your California address, city, or landmark"
          loading={geocoding.loading}
          showClearButton
          onClear={handleClearSearch}
        />

        {/* Results dropdown */}
        {showResults && geocoding.results.length > 0 && (
          <Box
            sx={{
              position: "absolute",
              top: `calc(100% + ${theme.spacing(0.5)})`,
              left: 0,
              right: 0,
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.borderRadius.md,
              boxShadow: theme.shadow.md,
              maxHeight: 300,
              overflowY: "auto",
              zIndex: theme.zIndex.dropdown,
              border: theme.border.medium,
            }}
          >
            {geocoding.results.map((feature, index) => (
              <Box
                key={feature.id || index}
                component="button"
                onClick={() => handleSelectLocation(feature)}
                sx={{
                  width: "100%",
                  padding: theme.spacing(1.5),
                  border: "none",
                  borderBottom:
                    index < geocoding.results.length - 1
                      ? theme.border.light
                      : "none",
                  backgroundColor: theme.palette.background.paper,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: theme.transition.quick,
                  "&:hover": {
                    backgroundColor: theme.palette.grey[100],
                  },
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ mb: theme.space.component.xs }}
                >
                  {feature.text}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.grey[600],
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {feature.place_name}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Error message */}
        {geocoding.error && (
          <Typography
            variant="caption"
            sx={{
              mt: theme.space.component.sm,
              padding: theme.space.component.sm,
              backgroundColor: theme.palette.error.light,
              color: theme.palette.error.dark,
              borderRadius: theme.borderRadius.md,
            }}
          >
            {geocoding.error.message}
          </Typography>
        )}

        {/* Selected location display */}
        {selectedLocation && !showResults && (
          <Box
            sx={{
              mt: theme.space.component.lg,
              p: theme.space.component.lg,
              backgroundColor: theme.palette.grey[50],
              borderRadius: theme.borderRadius.md,
              border: theme.border.focusLight,
            }}
          >
            <Typography
              variant="overline"
              sx={{
                color: theme.palette.blue.darkest,
                fontWeight: theme.typography.fontWeightSemiBold,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <Box component="span" sx={{ fontSize: "1.25rem" }}>
                📍
              </Box>
              Selected Location
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{ mt: theme.space.component.xs }}
            >
              {selectedLocation.text}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.grey[600] }}
            >
              {selectedLocation.place_name}
            </Typography>

            {basinInfo ? (
              <Box
                sx={{
                  mt: theme.space.component.md,
                  pt: theme.space.component.md,
                  borderTop: theme.border.medium,
                }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    color: theme.palette.blue.dark,
                    fontWeight: theme.typography.fontWeightSemiBold,
                  }}
                >
                  Basin
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{ mt: theme.space.component.xs }}
                >
                  {basinInfo.name}
                </Typography>
              </Box>
            ) : (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: theme.space.component.md,
                  pt: theme.space.component.md,
                  borderTop: theme.border.medium,
                  color: theme.palette.grey[600],
                  fontStyle: "italic",
                }}
              >
                This location is not within a Central Valley basin, but your
                water may still come from the Central Valley.
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}
