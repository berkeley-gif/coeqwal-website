"use client"

import { useState, useEffect, useMemo, useRef } from "react"
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
import { CENTRAL_VALLEY_VIEW } from "./CaliforniaMapPanel"
import bbox from "@turf/bbox"
import type { Feature, Polygon, MultiPolygon } from "geojson"
import { useLearnScrollChoreography } from "../hooks/useLearnScrollChoreography"

export default function MapOverlayPanels() {
  const theme = useTheme()
  const map = useMap()
  const {
    setGeocoderMarker,
    showBasins,
    toggleBasins,
    showRivers,
    toggleRivers,
    setRiversAnimationProgress,
    showInflowArrows,
    toggleInflowArrows,
    inflowArrowsOpacity,
    setInflowArrowsOpacity,
    setActivePanel,
  } = useCalSimToggle()

  // Animation state for first panel entrance
  const [isFirstPanelVisible, setIsFirstPanelVisible] = useState(false)

  // State for basin search accordion
  const [isBasinAccordionExpanded, setIsBasinAccordionExpanded] =
    useState(false)

  // Learn section scroll choreography – refs for stable callbacks
  const mapRef = useRef(map)
  const fadeAnimationRef = useRef<number | null>(null) // inflow/basins fade-out
  const labelFadeAnimationRef = useRef<number | null>(null) // label fade-ins
  const arrowFadeAnimationRef = useRef<number | null>(null) // arrow fade-in

  const toggleBasinsOnRef = useRef(toggleBasins)
  const showBasinsRef = useRef(showBasins)
  const toggleRiversOnRef = useRef(toggleRivers)
  const showRiversRef = useRef(showRivers)
  const toggleInflowArrowsOnRef = useRef(toggleInflowArrows)
  const showInflowArrowsRef = useRef(showInflowArrows)
  const inflowArrowsOpacityRef = useRef(inflowArrowsOpacity)

  // Keep refs in sync
  useEffect(() => {
    mapRef.current = map
    toggleBasinsOnRef.current = toggleBasins
    showBasinsRef.current = showBasins
    toggleRiversOnRef.current = toggleRivers
    showRiversRef.current = showRivers
    toggleInflowArrowsOnRef.current = toggleInflowArrows
    showInflowArrowsRef.current = showInflowArrows
    inflowArrowsOpacityRef.current = inflowArrowsOpacity
  }, [
    map,
    toggleBasins,
    showBasins,
    toggleRivers,
    showRivers,
    toggleInflowArrows,
    showInflowArrows,
    inflowArrowsOpacity,
  ])

  // Scroll-driven map choreography
  useLearnScrollChoreography(
    useMemo(
      () => [
        {
          panelId: "calsim-call",
          position: 0,
          debugLabel: "Panel 1: California",
          layers: [
            {
              layerId: "california-label",
              visibility: "visible" as const,
              textOpacity: 0.9,
            },
            {
              layerId: "central-valley-label",
              visibility: "none" as const,
              textOpacity: 0,
            },
            {
              layerId: "central-valley-polygon",
              visibility: "none" as const,
              lineOpacity: 0,
            },
          ],
        },
        {
          panelId: "central-valley-importance",
          position: 1,
          debugLabel: "Panel 2: Central Valley",
          layers: [
            {
              layerId: "california-label",
              visibility: "none" as const,
              textOpacity: 0, // fade out quickly / be gone
            },
            {
              layerId: "central-valley-label",
              visibility: "visible" as const,
              textOpacity: 0, // start at 0, we animate to 1 in onEnter
              textAllowOverlap: true,
            },
            {
              layerId: "central-valley-polygon",
              visibility: "visible" as const,
              lineOpacity: 0, // start at 0, we animate to 1 in onEnter
              lineWidth: 2,
              lineJoin: "round" as const,
            },
          ],
          // Hide basins when entering Panel 2 (from Panel 3 when scrolling up)
          onEnter: () => {
            if (showBasinsRef.current) toggleBasinsOnRef.current()

            // Smooth, slower fade-in for both the Central Valley label and polygon
            if (!mapRef.current) return

            const localMap = mapRef.current

            // Cancel any existing label fade
            if (labelFadeAnimationRef.current !== null) {
              cancelAnimationFrame(labelFadeAnimationRef.current)
              labelFadeAnimationRef.current = null
            }

            const duration = 1500 // 1.5s for a gentle fade-in
            const startTime = performance.now()

            // Ensure starting at 0 opacity for both layers
            try {
              localMap.setPaintProperty(
                "central-valley-label",
                "text-opacity",
                0,
              )
              localMap.setPaintProperty(
                "central-valley-polygon",
                "line-opacity",
                0,
              )
            } catch {
              // Layer might not be ready yet; fail silently
            }

            const animate = (currentTime: number) => {
              const elapsed = currentTime - startTime
              const progress = Math.min(elapsed / duration, 1)
              const rawEased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
              // Clamp to [0, 0.9] to avoid floating-point precision errors
              const eased = Math.max(0, Math.min(0.9, rawEased * 0.9))

              try {
                localMap.setPaintProperty(
                  "central-valley-label",
                  "text-opacity",
                  eased,
                )
                localMap.setPaintProperty(
                  "central-valley-polygon",
                  "line-opacity",
                  eased,
                )
              } catch {
                // If layer isn't available mid-animation, just stop
                labelFadeAnimationRef.current = null
                return
              }

              if (progress < 1) {
                labelFadeAnimationRef.current =
                  requestAnimationFrame(animate)
              } else {
                labelFadeAnimationRef.current = null
              }
            }

            labelFadeAnimationRef.current = requestAnimationFrame(animate)
          },
          onExit: () => {
            // Just in case we leave mid-fade
            if (labelFadeAnimationRef.current !== null) {
              cancelAnimationFrame(labelFadeAnimationRef.current)
              labelFadeAnimationRef.current = null
            }
          },
        },
        {
          panelId: "central-valley-basins",
          position: 2,
          debugLabel: "Panel 3: Basins",
          layers: [
            {
              layerId: "california-label",
              visibility: "none" as const,
              textOpacity: 0,
            },
            {
              layerId: "central-valley-label",
              visibility: "none" as const,
              textOpacity: 0,
            },
            {
              layerId: "central-valley-polygon",
              visibility: "none" as const,
              lineOpacity: 0,
            },
            {
              layerId: "inflow-watersheds",
              visibility: "none" as const,
              fillOpacity: 0,
            },
          ],
          // Show basins when entering Panel 3. They stay visible through Panel 5
          onEnter: () => {
            if (!showBasinsRef.current) toggleBasinsOnRef.current()
          },
        },
        {
          panelId: "water-flow-call",
          position: 2.5,
          debugLabel: "Panel 4: Watersheds",
          layers: [
            {
              layerId: "california-label",
              visibility: "none" as const,
              textOpacity: 0,
            },
            {
              layerId: "central-valley-label",
              visibility: "none" as const,
              textOpacity: 0,
            },
            {
              layerId: "central-valley-polygon",
              visibility: "none" as const,
              lineOpacity: 0,
            },
            {
              layerId: "inflow-watersheds",
              visibility: "visible" as const,
              fillOpacity: 0.4,
            },
          ],
          // Show inflow watersheds polygon (arrows come later at Panel 4.5)
          onEnter: () => {
            // Cancel any ongoing fade animations
            if (fadeAnimationRef.current !== null) {
              cancelAnimationFrame(fadeAnimationRef.current)
              fadeAnimationRef.current = null
            }
            
            // Restore basins if returning from Panel 5
            if (!showBasinsRef.current) toggleBasinsOnRef.current()
            // Restore opacity for all layers when scrolling back up
            if (mapRef.current) {
              mapRef.current.setPaintProperty(
                "inflow-watersheds",
                "fill-opacity",
                0.4,
              )
              mapRef.current.setPaintProperty(
                "basins-outline-layer",
                "line-opacity",
                0.8,
              )
              mapRef.current.setPaintProperty(
                "basins-labels",
                "text-opacity",
                0.9,
              )
            }
          },
        },
        {
          panelId: "arrows-trigger",
          position: 2.6,
          debugLabel: "Panel 4.25: arrow trigger (midway through Panel 4)",
          layers: [
            {
              layerId: "california-label",
              visibility: "none" as const,
              textOpacity: 0,
            },
            {
              layerId: "central-valley-label",
              visibility: "none" as const,
              textOpacity: 0,
            },
            {
              layerId: "central-valley-polygon",
              visibility: "none" as const,
              lineOpacity: 0,
            },
            {
              layerId: "inflow-watersheds",
              visibility: "visible" as const,
              fillOpacity: 0.4,
            },
          ],
          // Fade arrows IN when entering arrow trigger zone
          onEnter: () => {
            // Cancel any ongoing arrow fade animation
            if (arrowFadeAnimationRef.current !== null) {
              cancelAnimationFrame(arrowFadeAnimationRef.current)
              arrowFadeAnimationRef.current = null
            }

            if (!showInflowArrowsRef.current) toggleInflowArrowsOnRef.current()
            
            // Animate arrow fade-in from current opacity to 1
            const fadeDuration = 800
            const startTime = performance.now()
            const startOpacity = inflowArrowsOpacityRef.current // Get current opacity
            
            const animateArrowFadeIn = (now: number) => {
              const elapsed = now - startTime
              const progress = Math.min(elapsed / fadeDuration, 1)
              const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
              const value = Math.max(0, Math.min(1, startOpacity + (1 - startOpacity) * eased)) // Clamp
              
              setInflowArrowsOpacity(value)
              
              if (progress < 1) {
                arrowFadeAnimationRef.current = requestAnimationFrame(animateArrowFadeIn)
              } else {
                arrowFadeAnimationRef.current = null
              }
            }
            
            arrowFadeAnimationRef.current = requestAnimationFrame(animateArrowFadeIn)
          },
          // Fade arrows OUT when scrolling back up to Panel 3
          onExit: (direction?: "up" | "down") => {
            if (direction === "up") {
              // Cancel any ongoing arrow fade animation
              if (arrowFadeAnimationRef.current !== null) {
                cancelAnimationFrame(arrowFadeAnimationRef.current)
                arrowFadeAnimationRef.current = null
              }
              
              // Animate arrow fade-out from current opacity to 0
              const fadeDuration = 600
              const startTime = performance.now()
              const startOpacity = inflowArrowsOpacityRef.current // Get current opacity
              
              const animateArrowFadeOut = (now: number) => {
                const elapsed = now - startTime
                const progress = Math.min(elapsed / fadeDuration, 1)
                const eased = 1 - progress // Linear fade out
                const value = Math.max(0, Math.min(1, startOpacity * eased)) // Clamp
                
                setInflowArrowsOpacity(value)
                
                if (progress < 1) {
                  arrowFadeAnimationRef.current = requestAnimationFrame(animateArrowFadeOut)
                } else {
                  arrowFadeAnimationRef.current = null
                  // Hide arrows after fade completes
                  if (showInflowArrowsRef.current) toggleInflowArrowsOnRef.current()
                }
              }
              
              arrowFadeAnimationRef.current = requestAnimationFrame(animateArrowFadeOut)
            }
          },
        },
        {
          panelId: "which-basin-call",
          position: 3.5,
          debugLabel: "Panel 4.5: Which Basin",
          layers: [
            {
              layerId: "california-label",
              visibility: "none" as const,
              textOpacity: 0,
            },
            {
              layerId: "central-valley-label",
              visibility: "none" as const,
              textOpacity: 0,
            },
            {
              layerId: "central-valley-polygon",
              visibility: "none" as const,
              lineOpacity: 0,
            },
            {
              layerId: "inflow-watersheds",
              visibility: "visible" as const,
              fillOpacity: 0.4,
            },
          ],
          // Fade arrows OUT when entering Panel 4.5 (Find my basin)
          onEnter: () => {
            // Cancel any ongoing arrow fade animation
            if (arrowFadeAnimationRef.current !== null) {
              cancelAnimationFrame(arrowFadeAnimationRef.current)
              arrowFadeAnimationRef.current = null
            }
            
            // Animate arrow fade-out from current opacity to 0
            const fadeDuration = 600
            const startTime = performance.now()
            const startOpacity = inflowArrowsOpacityRef.current // Get current opacity
            
            const animateArrowFadeOut = (now: number) => {
              const elapsed = now - startTime
              const progress = Math.min(elapsed / fadeDuration, 1)
              const eased = 1 - progress // Linear fade out
              const value = Math.max(0, Math.min(1, startOpacity * eased)) // Clamp
              
              setInflowArrowsOpacity(value)
              
              if (progress < 1) {
                arrowFadeAnimationRef.current = requestAnimationFrame(animateArrowFadeOut)
              } else {
                arrowFadeAnimationRef.current = null
                // Hide arrows after fade completes
                if (showInflowArrowsRef.current) toggleInflowArrowsOnRef.current()
              }
            }
            
            arrowFadeAnimationRef.current = requestAnimationFrame(animateArrowFadeOut)
          },
          // Fade arrows back IN when scrolling back up to arrow trigger zone
          onExit: (direction?: "up" | "down") => {
            if (direction === "up") {
              // Cancel any ongoing arrow fade animation
              if (arrowFadeAnimationRef.current !== null) {
                cancelAnimationFrame(arrowFadeAnimationRef.current)
                arrowFadeAnimationRef.current = null
              }

              if (!showInflowArrowsRef.current) toggleInflowArrowsOnRef.current()
              
              // Animate arrow fade-in from current opacity to 1
              const fadeDuration = 800
              const startTime = performance.now()
              const startOpacity = inflowArrowsOpacityRef.current // Get current opacity
              
              const animateArrowFadeIn = (now: number) => {
                const elapsed = now - startTime
                const progress = Math.min(elapsed / fadeDuration, 1)
                const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
                const value = Math.max(0, Math.min(1, startOpacity + (1 - startOpacity) * eased)) // Clamp
                
                setInflowArrowsOpacity(value)
                
                if (progress < 1) {
                  arrowFadeAnimationRef.current = requestAnimationFrame(animateArrowFadeIn)
                } else {
                  arrowFadeAnimationRef.current = null
                }
              }
              
              arrowFadeAnimationRef.current = requestAnimationFrame(animateArrowFadeIn)
            }
          },
        },
        {
          panelId: "rivers-flow-response",
          position: 4.5,
          debugLabel: "Panel 5: Rivers",
          layers: [
            {
              layerId: "california-label",
              visibility: "none" as const,
              textOpacity: 0,
            },
            {
              layerId: "central-valley-label",
              visibility: "none" as const,
              textOpacity: 0,
            },
            {
              layerId: "central-valley-polygon",
              visibility: "none" as const,
              lineOpacity: 0,
            },
            {
              layerId: "inflow-watersheds",
              visibility: "visible" as const,
              fillOpacity: 0.4,
            },
          ],
          // Setup and scroll-driven animation for rivers panel
          onEnter: () => {
            // Reset the "find my basin" panel
            setGeocoderMarker(null)
            
            // Zoom back to Central Valley view directly
            if (map.mapRef?.current) {
              map.mapRef.current.easeTo({
                center: [CENTRAL_VALLEY_VIEW.longitude, CENTRAL_VALLEY_VIEW.latitude],
                zoom: CENTRAL_VALLEY_VIEW.zoom,
                bearing: CENTRAL_VALLEY_VIEW.bearing,
                pitch: CENTRAL_VALLEY_VIEW.pitch,
                duration: 1500,
                easing: (t: number) => t * (2 - t), // ease-out-quad
              })
            }
            
            // Show rivers immediately on enter
            if (!showRiversRef.current) toggleRiversOnRef.current()
          },
          // Scroll-driven animation: control rivers drawing AND opacity based on scroll progress
          onScroll: (progress) => {
            if (!mapRef.current) return
            
            const clamp = (value: number, min: number, max: number) =>
              Math.max(min, Math.min(max, value))
            
            // RIVERS: Draw from 0-60% of scroll progress
            const riverDrawStart = 0
            const riverDrawEnd = 0.6
            const riverProgress = clamp(
              (progress - riverDrawStart) / (riverDrawEnd - riverDrawStart),
              0,
              1
            )
            
            // Debug logging
            console.log(`Rivers panel scroll - progress: ${progress.toFixed(3)}, riverProgress: ${riverProgress.toFixed(3)}`)
            
            // Set river animation progress directly (no easing for precise control)
            setRiversAnimationProgress(riverProgress)
            
            // BASINS/INFLOW: Fade out from 40%-80% of scroll progress (overlaps with river drawing)
            const fadeStart = 0.4
            const fadeEnd = 0.8
            const fadeProgress = clamp(
              (progress - fadeStart) / (fadeEnd - fadeStart),
              0,
              1
            )
            
            // Ease out cubic for smoother fade
            const eased = 1 - Math.pow(1 - fadeProgress, 3)
            
            const inflowOpacity = clamp(0.4 * (1 - eased), 0, 1)
            const basinsOutlineOpacity = clamp(0.8 * (1 - eased), 0, 1)
            const basinsLabelsOpacity = clamp(1 * (1 - eased), 0, 1)
            
            mapRef.current.setPaintProperty(
              "inflow-watersheds",
              "fill-opacity",
              inflowOpacity,
            )
            mapRef.current.setPaintProperty(
              "basins-outline-layer",
              "line-opacity",
              basinsOutlineOpacity,
            )
            mapRef.current.setPaintProperty(
              "basins-labels",
              "text-opacity",
              basinsLabelsOpacity,
            )
          },
          // Hide rivers and reset animation when exiting Panel 5
          onExit: () => {
            if (showRiversRef.current) toggleRiversOnRef.current()
            setRiversAnimationProgress(0) // Reset for next time
          },
        },
        {
          panelId: "water-distribution-call",
          position: 5.5,
          debugLabel: "Panel 6: Distribution",
          layers: [
            {
              layerId: "california-label",
              visibility: "none" as const,
              textOpacity: 0,
            },
            {
              layerId: "central-valley-label",
              visibility: "none" as const,
              textOpacity: 0,
            },
            {
              layerId: "central-valley-polygon",
              visibility: "none" as const,
              lineOpacity: 0,
            },
            {
              layerId: "inflow-watersheds",
              visibility: "none" as const,
              fillOpacity: 0,
            },
          ],
          // Hide basins when entering Panel 6 (rivers already hidden by Panel 5 onExit)
          onEnter: () => {
            if (showBasinsRef.current) toggleBasinsOnRef.current()
          },
        },
      ],
      [setInflowArrowsOpacity, setGeocoderMarker, setRiversAnimationProgress, map.mapRef],
    ),
    setActivePanel,
  )

  // Basin search state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] =
    useState<GeocodingFeature | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [basinInfo, setBasinInfo] = useState<{
    name: string
    properties: Record<string, unknown>
  } | null>(null)
  const [isSelectingResult, setIsSelectingResult] = useState(false) // Track if we're programmatically setting the query

  // Geocoding hook, uses token from map context
  const geocoding = useGeocoding({
    bbox: BOUNDING_BOXES.CALIFORNIA, // California bounding box
    countries: ["us"], // United States only
    types: ["place", "address", "poi"], // Allow addresses, cities, and POIs
    limit: 5,
    flyTo: false, // Handling the map movement manually, for this component's use case
  })

  // Basin lookup hook to cast the GeoJSON to the expected type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        (f) => f.properties?.name === basin.name,
      ) as Feature<Polygon | MultiPolygon> | undefined

      if (basinFeature) {
        // Calculate the bounding box of the basin
        const [minLng, minLat, maxLng, maxLat] = bbox(basinFeature)

        // Fit the map to the basin bounds with some padding
        map.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          0, // pitch
          0, // bearing
          { top: 100, bottom: 100, left: 100, right: 100 }, // padding
          { duration: 1500 }, // smooth transition
        )
      }
    } else {
      // If no basin found, zoom to the location itself
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
    setGeocoderMarker(null)
    setIsSelectingResult(false)
    geocoding.clear()
    setShowResults(false)
  }

  // Handle accordion expansion
  const handleAccordionChange = (
    event: React.SyntheticEvent,
    isExpanded: boolean,
  ) => {
    setIsBasinAccordionExpanded(isExpanded)

    if (isExpanded) {
      // Show basins when accordion opens
      if (!showBasins) {
        toggleBasins()
      }
    } else {
      // Hide basins and clear marker when accordion closes
      if (showBasins) {
        toggleBasins()
      }
      setGeocoderMarker(null)
      // Also clear the search state
      setSearchQuery("")
      setSelectedLocation(null)
      setBasinInfo(null)
      setShowResults(false)
    }
  }

  // Intersection observer for first panel entrance animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target.id === "california-map" && entry.isIntersecting) {
            setIsFirstPanelVisible(true)
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

  // ✅ BasinsLayer visibility is now controlled by useLearnScrollChoreography

  return (
    <Box
      sx={{
        position: "relative",
        zIndex: (theme) => theme.zIndex.content, // Above the sticky map
        pointerEvents: "none", // Allow markers to be clickable through overlays
        marginTop: "-100vh", // Pull up to overlay the sticky map immediately
        paddingBottom: "40vh", // Space after scenario card before next section
      }}
    >
      {/* Call: Question about California's water system */}
      <CallResponsePanel
        id="calsim-call"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
      >
        <Typography variant="body1">
          Do you know that California has one of the most complex water systems
          in the world?
        </Typography>
      </CallResponsePanel>

      {/* Call: Central Valley water management importance */}
      <CallResponsePanel
        id="central-valley-importance"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
      >
        {/* <Typography variant="overline">
          California&apos;s Central Valley
        </Typography> */}

        <Typography variant="body1">
          The{" "}
          <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
            Central Valley
          </Box>{" "}
          is like a giant bowl that collects most of California&apos;s water. 
          This water is highly managed, allocated, and transported.
        </Typography>
      </CallResponsePanel>

      {/* Call: Central Valley basins */}
      <CallResponsePanel
        id="central-valley-basins"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
      >
        {/* <Typography variant="overline">
          California&apos;s Central Valley
        </Typography> */}

        <Typography variant="body1">
          The Central Valley lies across three basins.
        </Typography>
      </CallResponsePanel>

      {/* Call: Rain and snowmelt statement */}
      <CallResponsePanel
        id="water-flow-call"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
      >
        {/* <Typography variant="overline">THE JOURNEY</Typography> */}

        <Typography variant="body1">
          Basin rain and snowmelt flow from the mountain rims into that
          basin&apos;s rivers, reservoirs, and wetlands. To move water from one
          basin to another, we have to pump or pipe it through canals.
        </Typography>

        {/* Hidden trigger for arrow animation - embedded in Panel 4 content */}
        <Box
          id="arrows-trigger"
          sx={{
            position: "relative",
            height: "30vh",
            width: "100%",
            pointerEvents: "none",
            opacity: 0,
            mt: 2,
          }}
        />
      </CallResponsePanel>

      {/* Call: Find my basin */}
      <CallResponsePanel
        id="which-basin-call"
        side="right"
        variant="call"
        isVisible={isFirstPanelVisible}
        disableHighlight={true}
      >
        {/* Background container for entire panel content */}
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

          {/* Geocoder search input */}
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
              paddingRight: searchQuery
                ? theme.spacing(6)
                : theme.spacing(1.5),
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
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 500, mb: 0.25 }}
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
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.grey[600],
                  display: "block",
                  mt: 0.5,
                }}
              >
                {selectedLocation.place_name}
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
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      Central Valley Water Basin
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
                  </>
                ) : (
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.grey[600],
                      fontStyle: "italic",
                    }}
                  >
                    Location is outside Central Valley basin boundaries, but
                    Central Valley water still may be delivered to your
                    area.
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
        </Box>
      </CallResponsePanel>

      {/* Response: Sacramento and San Joaquin Rivers */}
      <CallResponsePanel
        id="rivers-flow-response"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
      >
        <Typography variant="body1">
          From the north, the{" "}
          <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
            Sacramento River
          </Box>{" "}
          flows toward the low-lying{" "}
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
        <Typography variant="body1">
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
        {/* <Typography variant="overline">THE MODEL</Typography> */}

        <Typography variant="body1">
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
        {/* <Typography variant="overline">THE SCENARIOS</Typography> */}

        <Typography variant="body1">
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
          possibilities.
        </Typography>

        <Typography variant="body1" sx={{ fontWeight: 600 }}>
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
          expanded={isBasinAccordionExpanded}
          onChange={handleAccordionChange}
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
            <Box sx={{ position: "relative" }}>
              <Box
                component="input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a location in California"
                sx={{
                  width: "100%",
                  padding: theme.spacing(1.5),
                  paddingRight: searchQuery
                    ? theme.spacing(6)
                    : theme.spacing(1.5),
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
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, mb: 0.25 }}
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
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.grey[600],
                      display: "block",
                      mt: 0.5,
                    }}
                  >
                    {selectedLocation.place_name}
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
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            display: "block",
                            mb: 0.5,
                          }}
                        >
                          Central Valley Water Basin
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
                      </>
                    ) : (
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.grey[600],
                          fontStyle: "italic",
                        }}
                      >
                        Location is outside Central Valley basin boundaries, but
                        Central Valley water still may be delivered to your
                        area.
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
        {/* <Typography variant="overline">EXPLORE THE SCENARIOS</Typography> */}

        <Typography variant="body1">
          To help you understand how to &quot;read&quot; a CalSim scenario, we
          can start by exploring the data from the CalSim run for{" "}
          <Box component="span" sx={{ fontWeight: 500 }}>
            current water management operations
          </Box>
          . This strategy can be helpful for interpreting how water is currently
          managed. It can also be used as a baseline to compare alternative
          strategies with.
        </Typography>
      </CallResponsePanel>

      {/* Baseline scenario overlay with Current Operations and Hydroclimate cards */}
      {/* Wrapper for scroll track + sticky content */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "auto",
        }}
      >
        {/* Tall scroll track - creates the scroll pause effect */}
        <Box
          id="scenario-scroll-track"
          sx={{
            height: "300vh", // 3x viewport height for scroll progression
            width: "100%",
            position: "relative",
          }}
        />

        {/* Sticky container - stays fixed while scrolling through track */}
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            left: 0,
            right: 0,
            width: "100%",
            height: "100vh",
            display: "flex",
            justifyContent: "flex-end", // Align to right
            alignItems: "center",
            pl: 2, // Left padding
            pr: 4, // More right padding for space between panel and edge
            pointerEvents: "none",
          }}
        >
          {/* Blue panel grouping both cards */}
          <Box
            id="baseline-scenario-overlay"
            sx={{
              maxWidth: "580px",
              padding: (theme) => theme.spacing(2),
              pointerEvents: "auto",
              display: "flex",
              flexDirection: "column",
              gap: (theme) => theme.spacing(1.5),
              backgroundColor: (theme) => theme.palette.brand.sky,
              backdropFilter: "blur(10px)",
              borderRadius: (theme) => theme.borderRadius.card,
              overflow: "visible", // Allow tooltips to overflow to the left
            }}
          >
            <ScenarioCard
              isMinimized={false}
              minimizedTitle="Current operations"
            />
            <ClimateCard isMinimized={false} selectedClimate={1} />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}