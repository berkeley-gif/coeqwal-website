"use client"

import React, { useRef } from "react"
import { Header } from "@repo/ui/header"
import { HomePanel, CaliforniaWaterPanel } from "./components"
import styles from "./page.module.css"
import { MapProvider, useMap } from "./context/MapContext"
import { MapboxMap, MapboxMapRef } from "@repo/map"

// A wrapper so we can show how the map consumes context
function MapWrapper(props: { mapRef: React.RefObject<MapboxMapRef> }) {
  // Grab context for controlled view state
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
  // The ref to our MapboxMap child
  const mapRef = useRef<MapboxMapRef>(null)

  // We'll pass this down to the panel so it can call .flyTo()
  function handleFlyTo(longitude: number, latitude: number, zoom?: number) {
    mapRef.current?.flyTo(longitude, latitude, zoom)
  }

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <MapProvider>
          {/* The map is behind everything, covering the full screen */}
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

          {/* Panels are on top of the map (z-index 2) and pass pointerEvents: none
              so the map below can still be interacted with. */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              pointerEvents: "none",
            }}
          >
            <HomePanel />
            {/* Pass handleFlyTo to the CaliforniaWaterPanel */}
            <CaliforniaWaterPanel onFlyTo={handleFlyTo} />
          </div>
        </MapProvider>
      </main>
    </div>
  )
}
