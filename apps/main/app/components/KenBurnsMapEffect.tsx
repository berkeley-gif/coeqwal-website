import React, { useRef, useEffect, useState } from "react"
import type { MapboxMapRef } from "@repo/map"
import { useMapStore } from "@repo/state/map"
import { KenBurnsMapEffect as KenBurnsEffect } from "../utils/mapEffects"

interface KenBurnsMapEffectProps {
  mapRef: React.RefObject<MapboxMapRef>
  enabled?: boolean
  activeSection: string
}

export const KenBurnsMapEffect: React.FC<KenBurnsMapEffectProps> = ({
  mapRef,
  enabled = true,
  activeSection,
}) => {
  const kenBurnsEffectRef = useRef<KenBurnsEffect | null>(null)
  const [kenBurnsActive, setKenBurnsActive] = useState(false)
  const mapStore = useMapStore()

  // Create and prepare the Ken Burns effect
  useEffect(() => {
    if (!mapRef.current || kenBurnsEffectRef.current) return

    const { longitude, latitude, zoom, bearing, pitch } = mapStore.viewState

    console.log("📸 Creating subtle ambient Ken Burns effect")

    const effect = new KenBurnsEffect(mapRef)
    effect
      .addKeyframe([longitude, latitude], zoom, 2000, bearing, pitch)
      .addKeyframe(
        [longitude + 0.3, latitude + 0.7],
        zoom + 0.2,
        8000,
        bearing,
        5,
      )
      .addKeyframe(
        [longitude + 0.5, latitude + 0.2],
        zoom + 0.3,
        20000,
        bearing,
        10,
      )
      .addKeyframe([longitude, latitude], zoom, 15000, bearing, pitch)
      .setLoop(true)

    kenBurnsEffectRef.current = effect
    console.log("✅ Ken Burns effect created successfully")

    return () => {
      if (kenBurnsEffectRef.current) {
        console.log("🛑 Cleaning up Ken Burns effect on unmount")
        kenBurnsEffectRef.current.stop()
        kenBurnsEffectRef.current = null
      }
    }
  }, [mapRef, mapStore.viewState])

  // Handle effect activation based on section visibility
  useEffect(() => {
    if (!enabled || !kenBurnsEffectRef.current || !mapRef.current) return

    const { longitude, latitude, zoom, bearing, pitch } = mapStore.viewState

    if (activeSection === "interstitial" && !kenBurnsActive) {
      console.log("▶️ Starting Ken Burns effect - Interstitial panel in view")
      kenBurnsEffectRef.current.start()
      setKenBurnsActive(true)
    } else if (
      (activeSection === "hero" || activeSection === "combined-panel") &&
      kenBurnsActive
    ) {
      console.log("⏸️ Stopping Ken Burns effect - Different section in view")
      kenBurnsEffectRef.current.stop()

      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom,
        bearing,
        pitch,
        duration: 1000,
      })

      setKenBurnsActive(false)
    }
  }, [activeSection, enabled, kenBurnsActive, mapRef, mapStore.viewState])

  return null
}
