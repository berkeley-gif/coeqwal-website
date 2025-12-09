"use client"

/**
 * PersistentLearnMap
 *
 * A persistent map layer that lives at the page level and never unmounts.
 * This solves race conditions between map loading and scrollytelling.
 *
 * Architecture:
 * - Map is always mounted (never destroyed on tab switch)
 * - Visibility controlled by activeTab (from URL)
 * - Sits at z-index 0, covered by opaque tab content when not needed
 *
 * NOTE: The scrolling overlays (MapOverlayPanels, ProgressiveScenarioPanels)
 * are rendered in LearnPanel so they scroll with the page. This component
 * only hosts the fixed map canvas.
 *
 * NOTE: MapProvider is at page.tsx level so overlays can also use useMap().
 */

import { useCallback, useEffect, useRef } from "react"
import { Box } from "@repo/ui/mui"
import CaliforniaMapPanel from "./map/CaliforniaMapPanel"
import { useIsLearnTabActive } from "../hooks/useActiveTabFromURL"
import { useLearnMapStore } from "./map/store"

export default function PersistentLearnMap() {
  const isLearnTab = useIsLearnTabActive()
  const setMapReady = useLearnMapStore((s) => s.setMapReady)
  const mapReadyCalledRef = useRef(false)

  // Handle map ready state - update zustand store
  const handleMapReady = useCallback(() => {
    if (mapReadyCalledRef.current) return
    mapReadyCalledRef.current = true
    console.log("[PersistentLearnMap] Map is ready, updating store")
    setMapReady(true)
  }, [setMapReady])

  // Debug: log when this component mounts/unmounts
  useEffect(() => {
    console.log("[PersistentLearnMap] Mounted")
    return () => {
      console.log("[PersistentLearnMap] Unmounted")
    }
  }, [])

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 0, // Base layer - tabs sit on top
        // Visibility: always rendered, but pointer events only when Learn tab
        visibility: isLearnTab ? "visible" : "hidden",
        pointerEvents: isLearnTab ? "auto" : "none",
      }}
    >
      {/* The map canvas - always rendered */}
      <CaliforniaMapPanel id="california-map" onMapReady={handleMapReady} />
    </Box>
  )
}
