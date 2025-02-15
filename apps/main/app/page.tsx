"use client"

import { Header } from "@repo/ui/header"
import { HomePanel, CaliforniaWaterPanel } from "./components"
import styles from "./page.module.css"
import { MapProvider } from './context/MapContext';
import { MapboxMap } from '@repo/map';

export default function Home() {
  // Log the token to verify it's being read correctly
  console.log('Mapbox Token:', process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

  return (
    <div className={styles.page}>
    <Header />
    <main className={styles.main}>
    <MapProvider>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
        <MapboxMap mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''} />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HomePanel />
        <CaliforniaWaterPanel />
      </div>
    </MapProvider>
    </main>
    </div>
  )
}
