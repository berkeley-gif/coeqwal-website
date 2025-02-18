"use client"

import React, { useRef, useState } from "react"
import { Header } from "@repo/ui/header"
import styles from "./page.module.css"
import { MapProvider, useMap } from "./context/MapContext"
import { MapboxMap, MapboxMapRef } from "@repo/map"
import HomePanel from "./components/layout/HomePanel"
import CaliforniaWaterPanel from "./components/layout/CaliforniaWaterPanel"
import { PRECIPITATION_BANDS } from "../lib/mapPrecipitationAnimationBands"

// Renders map inside a <MapProvider> context to get the current context's viewState
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


  // ANIMATION CODE
  // Track whether we’re in the middle of an animation
  const [isAnimating, setIsAnimating] = useState(false)
  const animationIdRef = useRef<number | null>(null) // store the requestAnimationFrame ID

  // Called from the child, to animate the water layer
  function onAnimateBands() {
    // Prevent restarting if already animating
    if (isAnimating) return
    setIsAnimating(true)

    // Can specify the number of cycles (fade out -> swap band -> fade in)
    const totalCycles = 5
    let cycleCount = 0
    let currentBandIndex = 0
    
    // Each fade will take ~30 frames (0.5s at 60 FPS).
    // Can change these constants to tweak timing.
    const fadeFrames = 30
    let frame = 0
    let phase: "FADE_OUT" | "SWAP_BAND" | "FADE_IN" | "WAIT" = "FADE_OUT"
    const waitFrames = 30 // how many frames to wait after fade in, before next fade out

    // Helper to set raster-opacity
    function setOpacity(opacity: number) {
      mapRef.current?.getMap()?.setPaintProperty(
        "precipitable-water",
        "raster-opacity",
        opacity
      )
    }

    // Helper to set the band
    function setBand(index: number) {
      mapRef.current?.getMap()?.setPaintProperty(
        "precipitable-water",
        "raster-array-band",
        String(PRECIPITATION_BANDS[index])
      )
    }

    function updateOpacity(opacity: number, callback?: () => void) {
      const rawMap = mapRef.current?.getMap()
      rawMap?.setPaintProperty("precipitable-water", "raster-opacity", opacity)
      if (callback && opacity === 0) setTimeout(callback, 1000)
    }

    // The main animation loop
    function animate() {
      frame++
      switch (phase) {
        case "FADE_OUT":
          {
            // Gradually go from 1.0 down to 0.0 over fadeFrames
            const opacity = Math.max(0, 1 - frame / fadeFrames)
            setOpacity(opacity)
            if (opacity <= 0) {
              // Fade out done
              frame = 0
              phase = "SWAP_BAND"
            }
          }
          break

        case "SWAP_BAND":
          {
            // Swap the band
            setBand(currentBandIndex)
            currentBandIndex = (currentBandIndex + 1) % PRECIPITATION_BANDS.length

            // Move to FADE_IN next
            phase = "FADE_IN"
          }
          break

        case "FADE_IN":
          {
            // Go from 0.0 up to 1.0 over fadeFrames
            const opacity = Math.min(1, frame / fadeFrames)
            setOpacity(opacity)
            if (opacity >= 1) {
              // Fade in done
              frame = 0
              phase = "WAIT"
              cycleCount++
            }
          }
          break

        case "WAIT":
          {
            // Hang out for waitFrames
            if (frame >= waitFrames) {
              frame = 0
              // If we haven't reached totalCycles, fade out again
              if (cycleCount < totalCycles) {
                phase = "FADE_OUT"
              } else {
                // Done with all cycles
                cancelAnimationFrame(animationIdRef.current!)
                animationIdRef.current = null
                setIsAnimating(false)
                return // Stop
              }
            }
          }
          break
      }
      animationIdRef.current = requestAnimationFrame(animate)
    }

    // Kick off the first frame
    animationIdRef.current = requestAnimationFrame(animate)
  }

  // FLYTO CODE
  // The child calls this to smoothly move the map
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

          {/* Panels above the map, pointerEvents turned off mostly */}
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
