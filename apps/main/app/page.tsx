"use client"

import { Header } from "@repo/ui/header"
import { HomePanel, CaliforniaWaterPanel } from "./components"
import styles from "./page.module.css"
import { MapProvider, useMap } from "./context/MapContext"
import { MapboxMap } from "@repo/map"

function MapWrapper() {
  // Grab context
  const { viewState, setViewState } = useMap()

  return (
    <MapboxMap
      mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""}
      viewState={viewState}
      onViewStateChange={(vs) => setViewState(vs)}
    />
  )
}

export default function Home() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <MapProvider>
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
            <MapWrapper />
          </div>

          {/* Panels are on top of the map */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              pointerEvents: "none",
            }}
          >
            <HomePanel />
            <CaliforniaWaterPanel />
          </div>
        </MapProvider>
      </main>
    </div>
  )
}
