"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { ClientSideHead } from "./components/ClientSideHeader"
import { Header } from "@repo/ui/header"
import styles from "./page.module.css"
import { MapProvider, useMap } from "./context/MapContext"
import { MapboxMap, MapboxMapRef } from "@repo/map"
import HomePanel from "./components/layout/HomePanel"
import CaliforniaWaterPanel from "./components/layout/CaliforniaWaterPanel"
import { PRECIPITATION_BANDS } from "../lib/mapPrecipitationAnimationBands"
import { useTheme, useMediaQuery } from "@mui/material"
import { breakpointViews } from "../lib/mapViews"
import Drawer from "./components/layout/Drawer"
import IntroInterstitial from "./components/layout/IntroInterstitial"

//
// MapWrapper: Wraps MapboxMap with our context so the viewState is shared.
// It forces the map to load with the first precipitation band and snowfall opacity set to 0.
//
function MapWrapper(props: { mapRef: React.RefObject<MapboxMapRef> }) {
  const { viewState, setViewState } = useMap()
  const theme = useTheme()

  // Basic breakpoint detection
  const isXs = useMediaQuery(theme.breakpoints.down("sm"))
  const isSm = useMediaQuery(theme.breakpoints.only("sm"))
  const isMd = useMediaQuery(theme.breakpoints.only("md"))
  const isLg = useMediaQuery(theme.breakpoints.only("lg"))
  const isXl = useMediaQuery(theme.breakpoints.up("xl"))

  // Memoize getBreakpointKey
  const getBreakpointKey = useCallback((): "xs" | "sm" | "md" | "lg" | "xl" => {
    if (isXs) return "xs"
    if (isSm) return "sm"
    if (isMd) return "md"
    if (isLg) return "lg"
    if (isXl) return "xl"
    return "xl"
  }, [isXs, isSm, isMd, isLg, isXl])

  // Whenever breakpoints change, update the map's view
  useEffect(() => {
    const bpKey = getBreakpointKey()
    // Use the existing "breakpointViews" from mapViews.ts
    const coords = breakpointViews[bpKey]
    setViewState((prev) => ({
      ...prev,
      ...coords,
      transitionDuration: 1000,
    }))
  }, [isXs, isSm, isMd, isLg, isXl, setViewState, getBreakpointKey])

  return (
    <MapboxMap
      ref={props.mapRef}
      mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""}
      viewState={viewState}
      onViewStateChange={(vs) => setViewState(vs)}
      style={{ width: "100%", height: "100%" }}
      scrollZoom={false}
      onLoad={(e) => {
        const map = e.target
        // Set the precipitation layer to the first band.
        if (map.getLayer("precipitable-water")) {
          map.setPaintProperty(
            "precipitable-water",
            "raster-array-band",
            PRECIPITATION_BANDS[0],
          )
          // Set a transition for future band changes.
          map.setPaintProperty(
            "precipitable-water",
            "raster-opacity-transition",
            {
              duration: 2000,
              delay: 0,
            },
          )
        }
        // Force the snowfall layer to opacity 0.
        if (map.getLayer("snowfall")) {
          map.setPaintProperty("snowfall", "raster-opacity", 0)
        }
      }}
    />
  )
}

//
// Home component: Uses MapProvider and renders the map & overlay panels.
// onAnimateBands is triggered by CaliforniaWaterPanel's first icon to animate the precipitation bands.
//
export default function Home() {
  const mapRef = useRef<MapboxMapRef>(null!)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationFrameIdRef = useRef<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Helper: update snowfall opacity with a transition.
  function updateSnowfallOpacity(opacity: number, duration = 2000) {
    const current = mapRef.current
    if (!current) return // If no map yet, bail out
    animateOpacityChange(current, "snowfall", opacity, duration)
  }

  // onAnimateBands: Triggered by CaliforniaWaterPanel's first icon.
  // Cycles through PRECIPITATION_BANDS once.
  // When the band index reaches 5, it fades in the snowfall layer over 2 seconds.
  function onAnimateBands() {
    if (isAnimating) return
    setIsAnimating(true)

    const map = mapRef.current?.getMap()
    if (!map) {
      console.warn("Map not ready yet.")
      setIsAnimating(false)
      return
    }
    if (!map.getLayer("precipitable-water")) {
      console.warn("Layer 'precipitable-water' not found.")
      setIsAnimating(false)
      return
    }

    // Ensure snowfall starts at opacity 0.
    if (map.getLayer("snowfall")) {
      map.setPaintProperty("snowfall", "raster-opacity", 0)
    }

    let currentBandIndex = 0
    // The map should already be showing PRECIPITATION_BANDS[0] on load.
    const FRAMES_PER_BAND = 30 // ~0.5 seconds per band at 60 FPS.
    let frameCount = 0
    const snowfallThreshold = 5
    let snowfallAnimated = false

    function animate() {
      frameCount++
      if (frameCount >= FRAMES_PER_BAND) {
        frameCount = 0
        currentBandIndex++
        if (currentBandIndex < PRECIPITATION_BANDS.length) {
          if (map && currentBandIndex < PRECIPITATION_BANDS.length) {
            map.setPaintProperty(
              "precipitable-water",
              "raster-array-band",
              PRECIPITATION_BANDS[currentBandIndex],
            )
            if (currentBandIndex >= snowfallThreshold && !snowfallAnimated) {
              updateSnowfallOpacity(1, 2000)
              snowfallAnimated = true
            }
          }
        } else {
          if (animationFrameIdRef.current !== null) {
            cancelAnimationFrame(animationFrameIdRef.current)
          }
          animationFrameIdRef.current = null
          setIsAnimating(false)
          return
        }
      }
      animationFrameIdRef.current = requestAnimationFrame(animate)
    }
    animationFrameIdRef.current = requestAnimationFrame(animate)
  }

  // handleFlyTo: Called from CaliforniaWaterPanel for paragraphs 1+.
  function handleFlyTo(longitude: number, latitude: number, zoom?: number) {
    mapRef.current?.flyTo(longitude, latitude, zoom)
  }

  // Function to animate the opacity change
  function animateOpacityChange(
    mapRef: MapboxMapRef,
    layerId: string,
    targetOpacity: number,
    duration: number,
  ): void {
    const map = mapRef.getMap()
    if (!map) return // Ensure map is defined before proceeding

    const startOpacity = (map.getPaintProperty(layerId, "raster-opacity") ??
      0) as number
    const startTime = performance.now()

    function animate(time: number) {
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)
      const currentOpacity =
        startOpacity + (targetOpacity - startOpacity) * progress

      map?.setPaintProperty(layerId, "raster-opacity", currentOpacity)

      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }

  const toggleDrawer =
    (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event &&
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return
      }

      setDrawerOpen(open)
    }

  return (
    <>
      <ClientSideHead />
      <div className={"main-site"}>
        <Header />
        <main>
          <MapProvider>
            <div
              className={"map-wrapper"}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "all",
              }}
            >
              <MapWrapper mapRef={mapRef} />
            </div>
            <div
              className={"vertical-panels"}
              style={{
                position: "relative",
                zIndex: 2,
                pointerEvents: "none",
              }}
            >
              <HomePanel />
              <IntroInterstitial />
              <CaliforniaWaterPanel
                onFlyTo={handleFlyTo}
                onAnimateBands={onAnimateBands}
                onLearnMoreClick={toggleDrawer(true)}
              />
            </div>
            <Drawer
              open={drawerOpen}
              onClose={toggleDrawer(false)}
              onOpen={toggleDrawer(true)}
            />
          </MapProvider>
        </main>
      </div>
    </>
  )
}
