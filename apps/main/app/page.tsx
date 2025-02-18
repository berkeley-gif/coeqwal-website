"use client"

import React, { useRef, useState } from "react"
import { Header } from "@repo/ui/header"
import styles from "./page.module.css"
import { MapProvider, useMap } from "./context/MapContext"
import { MapboxMap, MapboxMapRef } from "@repo/map"
import HomePanel from "./components/layout/HomePanel"
import CaliforniaWaterPanel from "./components/layout/CaliforniaWaterPanel"
import { PRECIPITATION_BANDS } from "../lib/mapPrecipitationAnimationBands"

// Wrap the map to connect to the context's viewState
function MapWrapper(props: { mapRef: React.RefObject<MapboxMapRef> }) {
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
  const mapRef = useRef<MapboxMapRef>(null)

  // ANIMATE BANDS CODE
  // Prevent re-triggering if it's already animating
  const [isAnimating, setIsAnimating] = useState(false)
  // Keep a reference to the interval so we can clear it
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Animate through the bands exactly once
  function onAnimateBands() {
    // If already running, do nothing
    if (isAnimating) return
    setIsAnimating(true)

    const mapboxMap = mapRef.current?.getMap()
    if (!mapboxMap) {
      console.warn("Map is not ready yet.")
      setIsAnimating(false)
      return
    }

    if (!mapboxMap.getLayer("precipitable-water")) {
      console.warn("Layer 'precipitable-water' does not exist.")
      setIsAnimating(false)
      return
    }

    // Enable cross-fade transitions between band changes
    mapboxMap.setPaintProperty("precipitable-water", "raster-fade-duration", 200)

    let currentIndex = 0
    // Set the initial band
    mapboxMap.setPaintProperty("precipitable-water", "raster-array-band", PRECIPITATION_BANDS[currentIndex])

    const intervalId = setInterval(() => {
      currentIndex++
      if (currentIndex < PRECIPITATION_BANDS.length) {
        mapboxMap.setPaintProperty(
          "precipitable-water",
          "raster-array-band",
          PRECIPITATION_BANDS[currentIndex]
        )
      } else {
        clearInterval(intervalId)
        animationIntervalRef.current = null
        setIsAnimating(false)
      }
    }, 400)

    animationIntervalRef.current = intervalId
  }

  // FLYTO CODE
  function handleFlyTo(longitude: number, latitude: number, zoom?: number) {
    mapRef.current?.flyTo(longitude, latitude, zoom)
  }

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <MapProvider>
          {/* The map is behind everything */}
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
