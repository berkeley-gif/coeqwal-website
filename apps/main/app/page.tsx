"use client"

import React, { useRef, useState } from "react"
import { Header } from "@repo/ui/header"
import styles from "./page.module.css"
import { MapProvider, useMap } from "./context/MapContext"
import { MapboxMap, MapboxMapRef } from "@repo/map"
import HomePanel from "./components/layout/HomePanel"
import CaliforniaWaterPanel from "./components/layout/CaliforniaWaterPanel"
import { PRECIPITATION_BANDS } from "../lib/mapPrecipitationAnimationBands"

//
// MapWrapper: Wraps MapboxMap with our context so the viewState is shared.
// It forces the map to load with the first precipitation band and snowfall opacity set to 0.
//
function MapWrapper(props: { mapRef: React.RefObject<MapboxMapRef> }) {
  const { viewState, setViewState } = useMap()
  return (
    <MapboxMap
      ref={props.mapRef}
      mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""}
      viewState={viewState}
      onViewStateChange={(vs) => setViewState(vs)}
      initialViewState={{
        longitude: -130.5449,
        latitude: 28.2790,
        zoom: 5,
        pitch: 0,
        bearing: 0,
      }}
      style={{ width: "100%", height: "100%" }}
      scrollZoom={false}
      onLoad={(e) => {
        const map = e.target;
        // Set the precipitation layer to the first band.
        if (map.getLayer("precipitable-water")) {
          map.setPaintProperty(
            "precipitable-water",
            "raster-array-band",
            PRECIPITATION_BANDS[0]
          );
          // Optionally, set a transition for future band changes.
          map.setPaintProperty("precipitable-water", "raster-opacity-transition", {
            duration: 2000,
            delay: 0,
          });
        }
        // Force the snowfall layer to opacity 0.
        if (map.getLayer("snowfall")) {
          map.setPaintProperty("snowfall", "raster-opacity", 0);
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
  const mapRef = useRef<MapboxMapRef>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationFrameIdRef = useRef<number | null>(null)

  // Helper: update snowfall opacity with a transition.
  function updateSnowfallOpacity(opacity: number, duration: number = 2000) {
    const map = mapRef.current?.getMap()
    if (map && map.getLayer("snowfall")) {
      map.setPaintProperty("snowfall", "raster-opacity", opacity, {
        duration,
        easing: (t) => t * (2 - t),
      })
    }
  }

  // onAnimateBands: Triggered by CaliforniaWaterPanel's first icon.
  // It cycles through PRECIPITATION_BANDS once (approximately one band every 30 frames, ~0.5s per band).
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
          map.setPaintProperty(
            "precipitable-water",
            "raster-array-band",
            PRECIPITATION_BANDS[currentBandIndex]
          )
          if (currentBandIndex >= snowfallThreshold && !snowfallAnimated) {
            updateSnowfallOpacity(1, 2000)
            snowfallAnimated = true
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

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <MapProvider>
          {/* Map container */}
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
          {/* Overlay panels */}
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
