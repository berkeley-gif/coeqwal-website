"use client"

/**
 * This component is used to wrap the MapboxMap component.
 * It is used to handle the map's view state and breakpoints.
 */

import React, { useCallback, useEffect, useRef } from "react"
import { useMap } from "../context/MapContext"
import { MapboxMap, ViewState } from "@repo/map"
import { useTheme, useMediaQuery } from "@mui/material"
import { breakpointViews } from "../../lib/mapViews"
import { useWatershedBasinsLayer } from "@repo/map-hooks"

interface MapWrapperProps {
  showAquiferToggle?: boolean
  isAquiferVisible?: boolean
  showCalSimToggle?: boolean
  isCalSimVisible?: boolean
  showBasins?: boolean
  isBasinsVisible?: boolean
}

export default function MapWrapper({
  showAquiferToggle = false,
  isAquiferVisible = true,
  showCalSimToggle = false,
  isCalSimVisible = true,
  showBasins = true,
  isBasinsVisible = false,
}: MapWrapperProps) {
  const { viewState, setViewState, mapRef, setMapLoaded, isMapLoaded } =
    useMap()
  const theme = useTheme()

  // Basic breakpoint detection
  const isXs = useMediaQuery(theme.breakpoints.down("sm"))
  const isSm = useMediaQuery(theme.breakpoints.only("sm"))
  const isMd = useMediaQuery(theme.breakpoints.only("md"))
  const isLg = useMediaQuery(theme.breakpoints.only("lg"))
  const isXl = useMediaQuery(theme.breakpoints.up("xl"))

  // Track if initial view state has been set
  const initialViewSet = useRef(false)

  // Track current breakpoint for comparison
  const prevBreakpointRef = useRef<string | null>(null)

  // Create a ref for the container div
  // const containerRef = useRef<HTMLDivElement>(null)

  // Memoize getBreakpointKey
  const getBreakpointKey = useCallback((): "xs" | "sm" | "md" | "lg" | "xl" => {
    if (isXs) return "xs"
    if (isSm) return "sm"
    if (isMd) return "md"
    if (isLg) return "lg"
    if (isXl) return "xl"
    return "xl"
  }, [isXs, isSm, isMd, isLg, isXl])

  // Set initial view state once on mount
  useEffect(() => {
    if (!initialViewSet.current) {
      const bpKey = getBreakpointKey()
      const coords = breakpointViews[bpKey]

      console.log("Setting initial view state based on breakpoint:", bpKey)
      setViewState((prev: ViewState) => ({
        ...prev,
        ...coords,
        transitionDuration: 1000,
      }))

      initialViewSet.current = true
      prevBreakpointRef.current = bpKey
    }
  }, [getBreakpointKey, setViewState])

  // Handle actual breakpoint changes (screen resize)
  useEffect(() => {
    // Skip the initial run since it's handled by the effect above
    if (!initialViewSet.current) return

    const currentBreakpoint = getBreakpointKey()

    // Only update if the breakpoint actually changed
    if (prevBreakpointRef.current !== currentBreakpoint) {
      console.log(
        `Breakpoint changed from ${prevBreakpointRef.current} to ${currentBreakpoint}, updating view state`,
      )

      const coords = breakpointViews[currentBreakpoint]
      setViewState((prev: ViewState) => ({
        ...prev,
        ...coords,
        transitionDuration: 1000,
      }))

      prevBreakpointRef.current = currentBreakpoint
    }
  }, [isXs, isSm, isMd, isLg, isXl, getBreakpointKey, setViewState])

  useEffect(() => {
    if (isMapLoaded && mapRef.current) {
      const mapInstance = mapRef.current.getMap()?.getMap() as mapboxgl.Map

      if (mapInstance) {
        // Completely simplify the moveend event handler since we're not using any of its variables
        mapInstance.on("moveend", () => {
          // Log current map view state for debugging
          const center = mapInstance.getCenter()
          const zoom = mapInstance.getZoom()
          const pitch = mapInstance.getPitch()
          const bearing = mapInstance.getBearing()

          console.log("Current map view:", {
            longitude: center.lng,
            latitude: center.lat,
            zoom: zoom,
            pitch: pitch,
            bearing: bearing,
          })
        })
      }

      return () => {
        // Clean up the event listener when component unmounts
        if (mapInstance) {
          const noop = () => {}
          mapInstance.on("moveend", noop)
          mapInstance.off("moveend", noop)
        }
      }
    }
  }, [isMapLoaded, mapRef])

  // Listen for visibility changes from props
  useEffect(() => {
    if (isMapLoaded && mapRef.current && showAquiferToggle) {
      mapRef.current.withMap((mapboxMap) => {
        const map = mapboxMap.getMap() as mapboxgl.Map

        try {
          if (map.getLayer("groundwater-basins-layer")) {
            // Set opacity based on visibility
            const opacity = isAquiferVisible ? 0.6 : 0
            map.setPaintProperty(
              "groundwater-basins-layer",
              "fill-opacity",
              opacity,
            )
            console.log(
              `Aquifer layer visibility set to: ${isAquiferVisible ? "visible" : "hidden"}`,
            )
          }
        } catch (e) {
          console.log("Error toggling aquifer visibility:", e)
        }
      })
    }
  }, [isMapLoaded, mapRef, showAquiferToggle, isAquiferVisible])

  // Listen for CalSim nodes visibility changes
  useEffect(() => {
    if (isMapLoaded && mapRef.current && showCalSimToggle) {
      // Toggle markers visibility
      const markers = document.querySelectorAll(".mapboxgl-marker")
      markers.forEach((marker) => {
        ;(marker as HTMLElement).style.display = isCalSimVisible
          ? "block"
          : "none"
      })
      console.log(
        `CalSim nodes visibility set to: ${isCalSimVisible ? "visible" : "hidden"}`,
      )
    }
  }, [isMapLoaded, mapRef, showCalSimToggle, isCalSimVisible])

  // Initialize the watershed basins layer
  const { addWatershedBasinsLayer, setWatershedBasinsVisibility } =
    useWatershedBasinsLayer()

  // Initialize the watershed basins layer when the map loads
  useEffect(() => {
    if (isMapLoaded && mapRef.current && showBasins) {
      mapRef.current.withMap((mapboxMap) => {
        const map = mapboxMap.getMap() as mapboxgl.Map
        addWatershedBasinsLayer(map)
      })
    }
  }, [isMapLoaded, mapRef, showBasins, addWatershedBasinsLayer])

  // Listen for watershed basins visibility changes
  useEffect(() => {
    if (isMapLoaded && mapRef.current && showBasins) {
      mapRef.current.withMap((mapboxMap) => {
        const map = mapboxMap.getMap() as mapboxgl.Map
        setWatershedBasinsVisibility(map, isBasinsVisible)
      })
    }
  }, [
    isMapLoaded,
    mapRef,
    showBasins,
    isBasinsVisible,
    setWatershedBasinsVisibility,
  ])

  return (
    <MapboxMap
      ref={mapRef}
      mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""}
      viewState={viewState}
      onViewStateChange={(vs) => setViewState(vs)}
      style={{ width: "100%", height: "100%" }}
      scrollZoom={false}
      onLoad={() => {
        setMapLoaded(true)
      }}
    />
  )
}
