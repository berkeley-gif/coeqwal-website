"use client"

import { useState, useEffect } from "react"
import { CallResponsePanel } from "@repo/ui"
import ScenarioCard from "./ScenarioCard"
import ClimateCard from "./ClimateCard"
import {
  Box,
  Typography,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ExpandMoreIcon,
} from "@repo/ui/mui"
import { useGeocoding, BOUNDING_BOXES, useBasinLookup, useMap } from "@repo/map"
import type { GeocodingFeature } from "@repo/map"
import { centralValleyBasins } from "@repo/data"
import { useCalSimToggle } from "./CalSimContext"
import bbox from "@turf/bbox"
import type { Feature, Polygon, MultiPolygon } from "geojson"

export default function MapOverlayPanels() {
  const theme = useTheme()
  const map = useMap()
  const { setGeocoderMarker } = useCalSimToggle()

  // Animation state for first panel entrance
  const [isFirstPanelVisible, setIsFirstPanelVisible] = useState(false)

  // Basin search state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<GeocodingFeature | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [basinInfo, setBasinInfo] = useState<{ name: string; properties: Record<string, unknown> } | null>(null)
  const [isSelectingResult, setIsSelectingResult] = useState(false) // Track if we're programmatically setting the query

  // Geocoding hook, uses token from map context
  const geocoding = useGeocoding({
    bbox: BOUNDING_BOXES.CALIFORNIA,  // California only
    types: ['place', 'address', 'poi'], // Allow addresses, cities, and POIs
    limit: 5,
    flyTo: false, // Handling the map movement manually, for this component's use case
  })

  // Basin lookup hook to cast the GeoJSON to the expected type
  const { findBasin } = useBasinLookup(centralValleyBasins as any)

  // Search when query changes (debounced)
  useEffect(() => {
    // Don't trigger search if we just selected a result
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
  }, [searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  // Show results when available
  useEffect(() => {
    setShowResults(geocoding.results.length > 0)
  }, [geocoding.results])

  // Handle location selection
  const handleSelectLocation = (feature: GeocodingFeature) => {
    setIsSelectingResult(true) // Prevent search from retriggering
    setSelectedLocation(feature)
    setSearchQuery(feature.place_name)
    setShowResults(false)

    // Set marker at the selected location
    const [lng, lat] = feature.center
    setGeocoderMarker([lng, lat])

    // Find which basin this location is in
    const basin = findBasin(lng, lat)
    setBasinInfo(basin)

    // If we found a basin, fit the map to the basin bounds
    if (basin) {
      // Find the basin feature in the GeoJSON
      const basinFeature = centralValleyBasins.features.find(
        (f) => f.properties?.name === basin.name
      ) as Feature<Polygon | MultiPolygon> | undefined

      if (basinFeature) {
        // Calculate the bounding box of the basin
        const [minLng, minLat, maxLng, maxLat] = bbox(basinFeature)
        
        // Fit the map to the basin bounds with some padding
        map.fitBounds(
          [[minLng, minLat], [maxLng, maxLat]],
          0, // pitch
          0, // bearing
          { top: 100, bottom: 100, left: 100, right: 100 }, // padding
          { duration: 1500 } // smooth transition
        )
      }
    }
  }

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("")
    setSelectedLocation(null)
    setBasinInfo(null)
    setGeocoderMarker(null)
    setIsSelectingResult(false)
    geocoding.clear()
    setShowResults(false)
  }

  // Intersection observer for first panel entrance animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target.id === "california-map" && entry.isIntersecting) {
            setIsFirstPanelVisible(true)
            console.log("Map entered viewport")
          }
        })
      },
      {
        threshold: 0.5, // Trigger when 50% of panel is visible
        rootMargin: "0px 0px -200px 0px", // Delay trigger until well into viewport
      },
    )

    // Observe the California map panel -> trigger when map becomes sticky
    const mapPanel = document.getElementById("california-map")
    if (mapPanel) {
      observer.observe(mapPanel)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <Box
      sx={{
        position: "relative",
        zIndex: (theme) => theme.zIndex.content, // Above the sticky map
        pointerEvents: "none", // Allow markers to be clickable through overlays
        marginTop: "-100vh", // Pull up to overlay the sticky map immediately
      }}
    >
      {/* Call: Question about California's water system */}
      <CallResponsePanel
        id="calsim-call"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
      >
        <Typography variant="h6" fontWeight={600} sx={{ lineHeight: 1.4 }}>
          Do you know that California has one of the most complex water systems
          in the world?
        </Typography>
      </CallResponsePanel>

      {/* Call: Rain and snowmelt statement */}
      <CallResponsePanel
        id="water-flow-call"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
      >
        {/* Eyebrow label */}
        <Typography
          variant="overline"
          sx={{
            color: theme.palette.blue.darkest,
            fontWeight: 600,
            letterSpacing: "0.1em",
            fontSize: "0.7rem",
          }}
        >
          THE JOURNEY
        </Typography>

        <Typography variant="body1" fontWeight={400} sx={{ lineHeight: 1.75 }}>
          Rain and snowmelt in the mountains flow into California&apos;s large{" "}
          <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
            Central Valley
          </Box>
          .
        </Typography>
      </CallResponsePanel>

      {/* Response: Sacramento and San Joaquin Rivers */}
      <CallResponsePanel
        id="rivers-flow-response"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
      >
        <Typography variant="body1" fontWeight={400} sx={{ lineHeight: 1.75 }}>
          From the north, the{" "}
          <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
            Sacramento River
          </Box>{" "}
          flows toward the{" "}
          <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
            Delta
          </Box>
          , where its waters mix with waters from the{" "}
          <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
            San Joaquin River
          </Box>{" "}
          flowing up from the south.
        </Typography>
      </CallResponsePanel>

      {/* Call: Water distribution statement */}
      <CallResponsePanel
        id="water-distribution-call"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
      >
        <Typography variant="body1" fontWeight={400} sx={{ lineHeight: 1.75 }}>
          Water is distributed from multiple points along the way, and pumped
          out from the{" "}
          <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
            Delta
          </Box>{" "}
          to points further south.
        </Typography>
      </CallResponsePanel>

      {/* Response: CalSim model detailed explanation */}
      <CallResponsePanel
        id="calsim-detailed-response"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
      >
        {/* Eyebrow label */}
        <Typography
          variant="overline"
          sx={{
            color: theme.palette.blue.darkest,
            fontWeight: 600,
            letterSpacing: "0.1em",
            fontSize: "0.7rem",
          }}
        >
          THE MODEL
        </Typography>

        <Typography variant="body1" fontWeight={400} sx={{ lineHeight: 1.75 }}>
          To plan and account for where the water goes, the federal{" "}
          <Box component="span" sx={{ fontWeight: 600 }}>
            U.S. Bureau of Reclamation
          </Box>{" "}
          and the state{" "}
          <Box component="span" sx={{ fontWeight: 600 }}>
            Department of Water Resources
          </Box>{" "}
          use a computer model called{" "}
          <Box component="span" sx={{ fontWeight: 600 }}>
            CalSim
          </Box>
          . The CalSim model tracks water flowing into reservoirs, how much is
          stored and released into rivers and canals, and where it gets
          delivered across the state.
        </Typography>
      </CallResponsePanel>

      {/* Call: COEQWAL project explanation */}
      <CallResponsePanel
        id="coeqwal-call"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
      >
        {/* Eyebrow label */}
        <Typography
          variant="overline"
          sx={{
            color: theme.palette.blue.darkest,
            fontWeight: 600,
            letterSpacing: "0.1em",
            fontSize: "0.7rem",
          }}
        >
          THE SCENARIOS
        </Typography>

        <Typography variant="body1" fontWeight={400} sx={{ lineHeight: 1.75 }}>
          The{" "}
          <Box component="span" sx={{ fontWeight: 600 }}>
            COEQWAL
          </Box>{" "}
          project has been given resources from the{" "}
          <Box component="span" sx={{ fontWeight: 600 }}>
            University of California
          </Box>{" "}
          and the{" "}
          <Box component="span" sx={{ fontWeight: 600 }}>
            Bay-Delta Science Program
          </Box>{" "}
          to run CalSim through a broad range of different water management
          practices and evaluate the results under current and future climate
          scenarios.
        </Typography>

        <Typography
          variant="body1"
          fontWeight={600}
          sx={{
            lineHeight: 1.75,
            mt: 2,
            color: theme.palette.blue.darkest,
          }}
        >
          We are making this data available to the public so that communities
          can better understand the range of possibilities, and the range of
          consequences, that different water management practices can bring.
        </Typography>
      </CallResponsePanel>

      {/* Response: FAQ Accordion */}
      <CallResponsePanel
        id="faq-accordion"
        side="right"
        variant="response"
        isVisible={isFirstPanelVisible}
        delay={0.3}
      >
        <Accordion
          disableGutters
          elevation={0}
          sx={{
            backgroundColor: "transparent",
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              mx: (theme) => theme.spacing(-3),
              px: (theme) => theme.spacing(3),
              fontWeight: 500,
              cursor: "pointer",
              borderRadius: theme.borderRadius.standard,
              transition: "all 0.2s ease",
              flexDirection: "row-reverse",
              justifyContent: "flex-end",
              alignItems: "flex-start",
              "& .MuiAccordionSummary-content": {
                margin: 0,
                marginLeft: theme.spacing(1.5),
              },
              "& .MuiAccordionSummary-expandIconWrapper": {
                marginRight: 0,
                marginTop: "5px",
              },
              "& .MuiSvgIcon-root": {
                color: "inherit",
              },
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                "& .MuiTypography-root": {
                  color: theme.palette.common.white,
                },
              },
            }}
          >
            <Typography
              variant="body1"
              fontWeight={500}
              sx={{ textAlign: "left" }}
            >
              Where is my basin?
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0 }}>
            <Typography
              variant="body2"
              sx={{ mb: theme.spacing(2), lineHeight: 1.6 }}
            >
              Enter your California address, city, or landmark
            </Typography>

            {/* Geocoder search input */}
            <Box sx={{ position: 'relative' }}>
              <Box
                component="input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a location in California"
                sx={{
                  width: '100%',
                  padding: theme.spacing(1.5),
                  paddingRight: searchQuery ? theme.spacing(6) : theme.spacing(1.5),
                  fontSize: '14px',
                  border: `1px solid ${theme.palette.grey[300]}`,
                  borderRadius: theme.borderRadius.standard,
                  backgroundColor: theme.palette.common.white,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  '&:focus': {
                    borderColor: theme.palette.primary.main,
                  },
                  '&::placeholder': {
                    color: theme.palette.grey[500],
                  }
                }}
              />

              {/* Clear/loading indicator */}
              {searchQuery && (
                <Box
                  sx={{
                    position: 'absolute',
                    right: theme.spacing(1.5),
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
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
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite',
                        '@keyframes spin': {
                          to: { transform: 'rotate(360deg)' },
                        },
                      }}
                    />
                  )}
                  {!geocoding.loading && (
                    <Box
                      component="button"
                      onClick={handleClearSearch}
                      sx={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        color: theme.palette.grey[600],
                        fontSize: '18px',
                        '&:hover': {
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
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    backgroundColor: theme.palette.common.white,
                    borderRadius: theme.borderRadius.standard,
                    boxShadow: theme.shadows[3],
                    maxHeight: 300,
                    overflowY: 'auto',
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
                        width: '100%',
                        padding: theme.spacing(1.5),
                        border: 'none',
                        borderBottom: index < geocoding.results.length - 1 
                          ? `1px solid ${theme.palette.grey[200]}` 
                          : 'none',
                        backgroundColor: theme.palette.common.white,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.15s',
                        '&:hover': {
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
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
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
                    display: 'block',
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
                    backgroundColor: 'rgba(58, 69, 116, 0.05)',
                    borderRadius: theme.borderRadius.standard,
                    border: `1px solid ${theme.palette.blue.light}`,
                  }}
                >
                  <Typography variant="caption" sx={{ color: theme.palette.blue.darkest, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    📍 Selected Location
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
                    {selectedLocation.text}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.grey[600], display: 'block', mt: 0.5 }}>
                    {selectedLocation.place_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.grey[500], display: 'block', mt: 1 }}>
                    Coordinates: {selectedLocation.center[1].toFixed(4)}°N, {selectedLocation.center[0].toFixed(4)}°W
                  </Typography>

                  {/* Basin info */}
                  <Box
                    sx={{
                      mt: 2,
                      pt: 2,
                      borderTop: `1px solid ${theme.palette.blue.light}`,
                    }}
                  >
                    {basinInfo ? (
                      <>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: theme.palette.blue.darkest, 
                            fontWeight: 600, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.1em',
                            display: 'block',
                            mb: 0.5,
                          }}
                        >
                          Water Basin
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: theme.palette.primary.main,
                          }}
                        >
                          {basinInfo.name}
                        </Typography>
                        {basinInfo.properties && 'fid' in basinInfo.properties && (
                          <Typography variant="caption" sx={{ color: theme.palette.grey[500], display: 'block', mt: 0.5 }}>
                            Basin ID: {String(basinInfo.properties.fid)}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Typography variant="caption" sx={{ color: theme.palette.grey[500], fontStyle: 'italic' }}>
                        Location is outside known basin boundaries
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion
          disableGutters
          elevation={0}
          sx={{
            backgroundColor: "transparent",
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              mx: (theme) => theme.spacing(-3),
              px: (theme) => theme.spacing(3),
              fontWeight: 500,
              cursor: "pointer",
              borderRadius: theme.borderRadius.standard,
              transition: "all 0.2s ease",
              flexDirection: "row-reverse",
              justifyContent: "flex-end",
              alignItems: "flex-start",
              "& .MuiAccordionSummary-content": {
                margin: 0,
                marginLeft: theme.spacing(1.5),
              },
              "& .MuiAccordionSummary-expandIconWrapper": {
                marginRight: 0,
                marginTop: "5px",
              },
              "& .MuiSvgIcon-root": {
                color: "inherit",
              },
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                "& .MuiTypography-root": {
                  color: theme.palette.common.white,
                },
              },
            }}
          >
            <Typography
              variant="body1"
              fontWeight={500}
              sx={{ textAlign: "left" }}
            >
              What is and where is &quot;The Delta&quot;?
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0 }}>
            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
              The Sacramento–San Joaquin Delta is the unique ecosystem of
              low-lying waterways and islands where the Sacramento and San
              Joaquin rivers meet, roughly between Sacramento, Stockton, and
              Antioch. Here river water mixes with salty incoming tides from San
              Francisco Bay. Pumps and canals send water from the Delta to
              cities and farms across the state.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          disableGutters
          elevation={0}
          sx={{
            backgroundColor: "transparent",
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              mx: (theme) => theme.spacing(-3),
              px: (theme) => theme.spacing(3),
              fontWeight: 500,
              cursor: "pointer",
              borderRadius: theme.borderRadius.standard,
              transition: "all 0.2s ease",
              flexDirection: "row-reverse",
              justifyContent: "flex-end",
              alignItems: "flex-start",
              "& .MuiAccordionSummary-content": {
                margin: 0,
                marginLeft: theme.spacing(1.5),
              },
              "& .MuiAccordionSummary-expandIconWrapper": {
                marginRight: 0,
                marginTop: "5px",
              },
              "& .MuiSvgIcon-root": {
                color: "inherit",
              },
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                "& .MuiTypography-root": {
                  color: theme.palette.common.white,
                },
              },
            }}
          >
            <Typography
              variant="body1"
              fontWeight={500}
              sx={{ textAlign: "left" }}
            >
              What are the major components of California&apos;s water system?
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0 }}>
            <Box
              sx={{
                p: theme.spacing(2),
                backgroundColor: theme.palette.common.white,
                borderRadius: theme.borderRadius.standard,
                border: `1px solid ${theme.palette.grey[300]}`,
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight={600}
                sx={{ mb: theme.spacing(1.5) }}
              >
                Map Legend
              </Typography>
              <Box
                component="ul"
                sx={{
                  listStyle: "none",
                  p: 0,
                  m: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: theme.spacing(1),
                }}
              >
                <Box
                  component="li"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: theme.palette.blue.bright,
                      borderRadius: "50%",
                    }}
                  />
                  <Typography variant="body2">Inflows</Typography>
                </Box>
                <Box
                  component="li"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: theme.palette.blue.darkest,
                      borderRadius: "50%",
                    }}
                  />
                  <Typography variant="body2">Major reservoirs</Typography>
                </Box>
                <Box
                  component="li"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Box
                    sx={{
                      width: 16,
                      height: 3,
                      backgroundColor: theme.palette.blue.bright,
                    }}
                  />
                  <Typography variant="body2">
                    Major rivers and tributaries
                  </Typography>
                </Box>
                <Box
                  component="li"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: theme.palette.brand.sky,
                      border: `2px solid ${theme.palette.blue.darkest}`,
                    }}
                  />
                  <Typography variant="body2">Delta</Typography>
                </Box>
                <Box
                  component="li"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Box
                    sx={{
                      width: 0,
                      height: 0,
                      borderLeft: "8px solid transparent",
                      borderRight: "8px solid transparent",
                      borderBottom: `16px solid ${theme.palette.accent.alert}`,
                    }}
                  />
                  <Typography variant="body2">
                    Major pumping stations
                  </Typography>
                </Box>
                <Box
                  component="li"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Box
                    sx={{
                      width: 16,
                      height: 3,
                      backgroundColor: theme.palette.grey[600],
                    }}
                  />
                  <Typography variant="body2">Major canals</Typography>
                </Box>
                <Box
                  component="li"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: theme.palette.accent.gold,
                      opacity: 0.6,
                    }}
                  />
                  <Typography variant="body2">Delivery areas</Typography>
                </Box>
                <Box
                  component="li"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: theme.palette.grey[500],
                      opacity: 0.5,
                    }}
                  />
                  <Typography variant="body2">Groundwater aquifers</Typography>
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </CallResponsePanel>

      {/* Explore the Scenarios panel, starting How to read CalSim */}
      <CallResponsePanel
        id="how-to-read-scenarios"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
      >
        {/* Eyebrow label */}
        <Typography
          variant="overline"
          sx={{
            color: theme.palette.blue.darkest,
            fontWeight: 600,
            letterSpacing: "0.1em",
            fontSize: "0.7rem",
          }}
        >
          EXPLORE THE SCENARIOS
        </Typography>

        <Typography variant="body1" fontWeight={400} sx={{ lineHeight: 1.75 }}>
          To help you understand how to &quot;read&quot; a CalSim scenario, we
          can start by exploring the data from the CalSim run for{" "}
          <Box component="span" sx={{ fontWeight: 500 }}>
            current water management operations
          </Box>
          .
        </Typography>
      </CallResponsePanel>

      {/* Baseline scenario overlay with Current Operations and Hydroclimate cards */}
      <CallResponsePanel
        id="baseline-scenario-overlay"
        side="right"
        variant="response"
        isVisible={isFirstPanelVisible}
        sx={{
          padding: (theme) => theme.spacing(2),
          marginBottom: "40vh",
          gap: (theme) => theme.spacing(1.5),
          maxWidth: "560px", // Wider for this card to accommodate contents
        }}
      >
        <ScenarioCard isMinimized={false} minimizedTitle="Current operations" />
        <ClimateCard isMinimized={false} selectedClimate={1} />
      </CallResponsePanel>
    </Box>
  )
}
