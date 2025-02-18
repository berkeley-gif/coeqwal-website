"use client"

import React, { useRef, useState } from "react"
import { Header } from "@repo/ui/header"
import styles from "./page.module.css"
import { MapProvider, useMap } from "./context/MapContext"
import { MapboxMap, MapboxMapRef } from "@repo/map"
import HomePanel from "./components/layout/HomePanel"
import CaliforniaWaterPanel from "./components/layout/CaliforniaWaterPanel"
import { PRECIPITATION_BANDS } from "../lib/mapPrecipitationAnimationBands"

// MapWrapper: Wraps MapboxMap with our context so that viewState is shared.
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
        // Poll until the "snowfall" layer exists, then force its opacity to 0.
        const checkSnowfall = () => {
          if (map.getLayer("snowfall")) {
            map.setPaintProperty("snowfall", "raster-opacity", 0);
          } else {
            setTimeout(checkSnowfall, 100);
          }
        };
        checkSnowfall();
        // Set the initial precipitation band.
        if (map.getLayer("precipitable-water")) {
          map.setPaintProperty(
            "precipitable-water",
            "raster-array-band",
            PRECIPITATION_BANDS[0]
          );
          // Optionally set a default opacity transition for the precip layer.
          map.setPaintProperty("precipitable-water", "raster-opacity-transition", {
            duration: 2000,
            delay: 0,
          });
        }
      }}
    />
  )
}

export default function Home() {
  const mapRef = useRef<MapboxMapRef>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationFrameIdRef = useRef<number | null>(null)

  // Helper: update the snowfall layer opacity with a transition.
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
  // It cycles through PRECIPITATION_BANDS once, updating roughly every 30 frames (~0.5s at 60FPS).
  // When reaching a threshold (here, index 5), it fades in the snowfall layer.
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
    map.setPaintProperty(
      "precipitable-water",
      "raster-array-band",
      PRECIPITATION_BANDS[currentBandIndex]
    )

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
          {/* Map container: wrapped in MapProvider */}
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
          {/* Overlay panels: HomePanel and CaliforniaWaterPanel */}
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
