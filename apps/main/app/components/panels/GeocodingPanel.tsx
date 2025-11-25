/**
 * GeocodingPanel - "Find My Basin" Interactive Component
 * 
 * Allows users to search for California locations and discover which basin they're in.
 * Integrates with Mapbox geocoding API and basin lookup functionality.
 */

import { useState, useEffect } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useMap, useGeocoding, useBasinLookup, BOUNDING_BOXES } from "@repo/map"
import type { GeocodingFeature } from "@repo/map"
import { bbox } from "@turf/turf"
import type { Feature, Polygon, MultiPolygon } from "geojson"

interface GeocodingPanelProps {
  /** Basin GeoJSON data for lookup */
  basinsData: any
  /** Callback when geocoder marker should be set/cleared */
  onMarkerChange: (coords: [number, number] | null) => void
  /** External trigger to clear/reset the panel */
  resetTrigger?: number
}

export function GeocodingPanel({ basinsData, onMarkerChange, resetTrigger }: GeocodingPanelProps) {
  const theme = useTheme()
  const map = useMap()
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<GeocodingFeature | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [basinInfo, setBasinInfo] = useState<{ name: string; properties: Record<string, unknown> } | null>(null)
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
    if (basin) {
      const basinFeature = basinsData.features.find(
        (f: any) => f.properties?.name === basin.name,
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

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("")
    setSelectedLocation(null)
    setBasinInfo(null)
    onMarkerChange(null)
    setIsSelectingResult(false)
    geocoding.clear()
    setShowResults(false)
  }

  // Reset panel when triggered externally
  useEffect(() => {
    if (resetTrigger !== undefined) {
      handleClearSearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger])

  return (
    <Box
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 0,
        padding: { xs: 2, sm: 2.5, md: 3 },
        boxShadow: theme.shadows[2],
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <Typography variant="body1" sx={{ mb: 2, color: theme.palette.grey[900] }}>
        Find my basin
      </Typography>

      {/* Search input */}
      <Box sx={{ position: "relative" }}>
        <Box
          component="input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Enter your California address, city, or landmark"
          sx={{
            width: "100%",
            padding: theme.spacing(1.5),
            paddingRight: searchQuery ? theme.spacing(6) : theme.spacing(1.5),
            fontSize: "14px",
            border: `1px solid ${theme.palette.grey[300]}`,
            borderRadius: theme.borderRadius.standard,
            backgroundColor: theme.palette.common.white,
            outline: "none",
            transition: "border-color 0.2s",
            "&:focus": {
              borderColor: theme.palette.primary.main,
            },
            "&::placeholder": {
              color: theme.palette.grey[500],
            },
          }}
        />

        {/* Clear/loading indicator */}
        {searchQuery && (
          <Box
            sx={{
              position: "absolute",
              right: theme.spacing(1.5),
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            {geocoding.loading && (
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  border: `2px solid ${theme.palette.grey[300]}`,
                  borderTopColor: theme.palette.primary.main,
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite",
                  "@keyframes spin": {
                    to: { transform: "rotate(360deg)" },
                  },
                }}
              />
            )}
            {!geocoding.loading && (
              <Box
                component="button"
                onClick={handleClearSearch}
                sx={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0.5,
                  display: "flex",
                  alignItems: "center",
                  color: theme.palette.grey[600],
                  fontSize: "18px",
                  "&:hover": {
                    color: theme.palette.grey[800],
                  },
                }}
                aria-label="Clear search"
              >
                ×
              </Box>
            )}
          </Box>
        )}

        {/* Results dropdown */}
        {showResults && geocoding.results.length > 0 && (
          <Box
            sx={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              backgroundColor: theme.palette.common.white,
              borderRadius: theme.borderRadius.standard,
              boxShadow: theme.shadows[3],
              maxHeight: 300,
              overflowY: "auto",
              zIndex: 10,
              border: `1px solid ${theme.palette.grey[300]}`,
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
                      ? `1px solid ${theme.palette.grey[200]}`
                      : "none",
                  backgroundColor: theme.palette.common.white,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.15s",
                  "&:hover": {
                    backgroundColor: theme.palette.grey[100],
                  },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.25 }}>
                  {feature.text}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.grey[600],
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "block",
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
              display: "block",
              mt: 1,
              padding: theme.spacing(1),
              backgroundColor: theme.palette.error.light,
              color: theme.palette.error.dark,
              borderRadius: theme.borderRadius.standard,
            }}
          >
            {geocoding.error.message}
          </Typography>
        )}

        {/* Selected location display */}
        {selectedLocation && !showResults && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: "rgba(58, 69, 116, 0.05)",
              borderRadius: theme.borderRadius.standard,
              border: `1px solid ${theme.palette.blue.light}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.blue.darkest,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              📍 Selected Location
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
              {selectedLocation.text}
            </Typography>
            <Typography variant="caption" sx={{ display: "block", color: theme.palette.grey[600] }}>
              {selectedLocation.place_name}
            </Typography>

            {basinInfo ? (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${theme.palette.grey[300]}` }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.blue.dark,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Basin
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {basinInfo.name}
                </Typography>
              </Box>
            ) : (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 1.5,
                  pt: 1.5,
                  borderTop: `1px solid ${theme.palette.grey[300]}`,
                  color: theme.palette.grey[600],
                  fontStyle: "italic",
                }}
              >
                This location is not within a Central Valley basin
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}

