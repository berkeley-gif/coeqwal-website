"use client"

import React, { useRef, useState } from "react"
import { Header } from "@repo/ui/header"
import styles from "./page.module.css"
import { MapProvider, useMap } from "./context/MapContext"
import { MapboxMap, MapboxMapRef } from "@repo/map"
import HomePanel from "./components/layout/HomePanel"
import CaliforniaWaterPanel from "./components/layout/CaliforniaWaterPanel"

// Use your precipitation bands
import { PRECIPITATION_BANDS } from "../lib/mapPrecipitationAnimationBands"

// Wrap the map so it uses the context's viewState
function MapWrapper(props: { mapRef: React.RefObject<MapboxMapRef | null> }) {
  const { viewState, setViewState } = useMap()
  return (
    <MapboxMap
      ref={props.mapRef}
      mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""}
      viewState={viewState}
      onViewStateChange={(vs) => setViewState(vs)}
    />
  )
}

export default function Home() {
  const mapRef = useRef<MapboxMapRef | null>(null)

  // Track whether we're already animating so we don't double-start
  const [isAnimating, setIsAnimating] = useState(false)
  // Keep the requestAnimationFrame ID to cancel it later
  const animationFrameIdRef = useRef<number | null>(null)

  // Called from CaliforniaWaterPanel when paragraphIndex === 0
  function onAnimateBands() {
    if (isAnimating) return // don't restart if still running
    setIsAnimating(true)

    const mapboxMap = mapRef.current?.getMap()
    if (!mapboxMap) {
      setIsAnimating(false)
      console.warn("Map not ready yet.")
      return
    }

    if (!mapboxMap.getLayer("precipitable-water")) {
      setIsAnimating(false)
      console.warn("Layer 'precipitable-water' not found.")
      return
    }

    // OPTIONAL: If you'd like a small cross-fade, you can set:
    // mapboxMap.setPaintProperty("precipitable-water", "raster-fade-duration", 500);

    // We update the band every ~0.5s at 60 FPS => 30 frames
    const FRAMES_PER_BAND = 30

    let currentBandIndex = 0
    let frameCount = 0

    // Set initial band
    if (!mapboxMap) return
    mapboxMap.setPaintProperty(
      "precipitable-water",
      "raster-array-band",
      PRECIPITATION_BANDS[currentBandIndex]
    )

    function animate() {
      frameCount++

      // Every 30 frames, switch to the next band
      if (frameCount >= FRAMES_PER_BAND) {
        frameCount = 0
        currentBandIndex++

        if (currentBandIndex < PRECIPITATION_BANDS.length) {
          if (!mapboxMap) return
          mapboxMap.setPaintProperty(
            "precipitable-water",
            "raster-array-band",
            PRECIPITATION_BANDS[currentBandIndex]
          )
        } else {
          // We're done with all bands, stop
          if (animationFrameIdRef.current != null) {
            cancelAnimationFrame(animationFrameIdRef.current)
          }
          animationFrameIdRef.current = null
          setIsAnimating(false)
          return
        }
      }

      // Request the next animation frame
      animationFrameIdRef.current = requestAnimationFrame(animate)
    }

    // Start the frame loop
    animationFrameIdRef.current = requestAnimationFrame(animate)
  }

  // Called from paragraphs 1+ to fly the map
  function handleFlyTo(longitude: number, latitude: number, zoom?: number) {
    mapRef.current?.flyTo(longitude, latitude, zoom)
  }

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <MapProvider>
          {/* The map behind everything */}
          <div
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

          {/* Panels above the map */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              pointerEvents: "none",
            }}
          >
            <HomePanel />
            <CaliforniaWaterPanel
              onFlyTo={handleFlyTo}
              onAnimateBands={onAnimateBands}
            />
          </div>
        </MapProvider>
      </main>
    </div>
  )
}
