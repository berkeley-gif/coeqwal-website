"use client"

import { Header } from "@repo/ui/header"
import { HomePanel, CaliforniaWaterPanel } from "./components"
import styles from "./page.module.css"
import { MapProvider } from "./context/MapContext"
import { MapboxMap } from "@repo/map"

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
            <MapboxMap
              mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""}
            />
          </div>
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
