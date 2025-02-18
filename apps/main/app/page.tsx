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

    const totalBands = PRECIPITATION_BANDS.length
    let currentBandIndex = 0
    
    // Each fade will take ~30 frames (0.5s at 60 FPS).
    // Can change these constants to tweak timing.
    const fadeFrames = 30
    const waitFrames = 30
    type Phase = "FADE_OUT" | "SWAP_BAND" | "FADE_IN" | "WAIT" | "DONE";
    let phase: Phase = "FADE_OUT";
    let frameCount = 0;

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

    // The main animation loop
    function animate() {
      frameCount++
      switch (phase) {
        case "FADE_OUT":
          {
            // Gradually go from 1.0 down to 0.0 over fadeFrames
            const opacity = Math.max(0, 1 - frameCount / fadeFrames)
            setOpacity(opacity)
            if (opacity <= 0) {
              // Fade out done
              frameCount = 0
              phase = "SWAP_BAND"
            }
          }
          break

        case "SWAP_BAND":
          {
            // Swap the band
            setBand(currentBandIndex)
            currentBandIndex++
            // Move to FADE_IN next
            phase = "FADE_IN"
            frameCount = 0
          }
          break

        case "FADE_IN":
          {
            // Go from 0.0 up to 1.0 over fadeFrames
            const opacity = Math.min(1, frameCount / fadeFrames)
            setOpacity(opacity)
            if (opacity >= 1) {
              // Fade in done
              frameCount = 0
              phase = "WAIT"
            }
          }
          break

        case "WAIT":
          {
            // Hang out for waitFrames
            if (frameCount >= waitFrames) {
              frameCount = 0
              // If we haven't reached totalBands, fade out again
              if (currentBandIndex < totalBands) {
                phase = "FADE_OUT"
              } else {
                phase = "DONE"
              }
            }
          break
        }

        case "DONE":
          {
            cancelAnimationFrame(animationIdRef.current!)
            animationIdRef.current = null
            setIsAnimating(false)
            return
          }
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
