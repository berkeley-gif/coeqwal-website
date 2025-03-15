"use client" // Relying on client-side rendering in this module

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
  useCallback,
  useEffect,
} from "react"
import type { MapboxMapRef } from "@repo/map"
import { PRECIPITATION_BANDS } from "../../lib/mapPrecipitationAnimationBands"
import { ViewState } from "@repo/map"
import type { MapRef } from "@repo/map"

export interface MapContextProps {
  viewState: ViewState
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>
  mapRef: React.RefObject<MapboxMapRef>
  flyTo: (
    longitude: number,
    latitude: number,
    zoom?: number,
    pitch?: number,
    bearing?: number,
  ) => void
  fitBounds: (
    bounds: [[number, number], [number, number]],
    options?: { padding?: number; duration?: number },
  ) => void
  isMapLoaded: boolean
  setMapLoaded: (loaded: boolean) => void
  animatePrecipitationBands: () => void
  isAnimating: boolean
}

const MapContext = createContext<MapContextProps | undefined>(undefined)

export function MapProvider({ children }: { children: ReactNode }) {
  // Map reference
  const mapRef = useRef<MapboxMapRef>(null) as React.RefObject<MapboxMapRef>
  const [isMapLoaded, setMapLoaded] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationFrameIdRef = useRef<number | null>(null)

  // Initial map position
  const [viewState, setViewState] = useState<ViewState>({
    longitude: -130.5449,
    latitude: 37.4669155,
    zoom: 5,
    bearing: 0,
    pitch: 0,
    padding: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
  })

  // Convenience function for flying to locations
  const flyTo = (
    longitude: number,
    latitude: number,
    zoom?: number,
    pitch?: number,
    bearing?: number,
  ) => {
    if (mapRef.current) {
      mapRef.current.flyTo(longitude, latitude, zoom, pitch, bearing)
    }
  }

  // Define animatePrecipitationBands in the context
  const animatePrecipitationBands = useCallback(() => {
    console.log("Checking animation conditions")
    if (isAnimating || !isMapLoaded) {
      console.log(
        "Animation not started: isAnimating =",
        isAnimating,
        "isMapLoaded =",
        isMapLoaded,
      )
      return
    }
    console.log("Starting animation")
    setIsAnimating(true)

    mapRef.current?.withMap((map) => {
      const mapboxMap = map.getMap() as mapboxgl.Map
      if (!mapboxMap) {
        console.warn("Map not ready yet.")
        setIsAnimating(false)
        return
      }

      if (!mapboxMap.getLayer("precipitable-water")) {
        console.warn("Layer 'precipitable-water' not found.")
        setIsAnimating(false)
        return
      }

      // Ensure snowfall starts at opacity 0.
      if (mapboxMap.getLayer("snowfall")) {
        mapboxMap.setPaintProperty("snowfall", "raster-opacity", 0)
      }

      let currentBandIndex = 0
      const FRAMES_PER_BAND = 30 // ~0.5 seconds per band at 60 FPS.
      let frameCount = 0
      const snowfallThreshold = 5
      let snowfallAnimated = false

      console.log("Starting animation")

      function animate() {
        console.log("Animating frame", frameCount)
        frameCount++
        if (frameCount >= FRAMES_PER_BAND) {
          frameCount = 0
          currentBandIndex++
          if (currentBandIndex < PRECIPITATION_BANDS.length) {
            console.log("Updating band", currentBandIndex)
            mapboxMap.setPaintProperty(
              "precipitable-water",
              "raster-array-band",
              PRECIPITATION_BANDS[currentBandIndex],
            )
            if (currentBandIndex >= snowfallThreshold && !snowfallAnimated) {
              updateSnowfallOpacity(mapboxMap, 1, 2000)
              snowfallAnimated = true
            }
          } else {
            console.log("Animation complete")
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
    })
  }, [isAnimating, isMapLoaded, mapRef])

  // Add this helper function in the MapProvider function
  function updateSnowfallOpacity(
    map: mapboxgl.Map,
    targetOpacity: number,
    duration: number = 2000,
  ) {
    if (!map) return // Early return if map is undefined

    const startOpacity = (map.getPaintProperty("snowfall", "raster-opacity") ??
      0) as number
    const startTime = performance.now()

    function animate(time: number) {
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)
      const currentOpacity =
        startOpacity + (targetOpacity - startOpacity) * progress

      if (map) {
        // Check if map still exists
        map.setPaintProperty("snowfall", "raster-opacity", currentOpacity)
      }

      if (progress < 1 && map) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }

  // MapContextProps
  const fitBounds = useCallback(
    (
      bounds: [[number, number], [number, number]],
      options?: { padding?: number; duration?: number },
    ) => {
      if (mapRef.current) {
        const map = mapRef.current.getMap()
        if (map) {
          map.fitBounds(bounds, {
            padding: options?.padding ?? 50,
            duration: options?.duration ?? 2000,
          })
        }
      }
    },
    [mapRef],
  )

  return (
    <MapContext.Provider
      value={{
        viewState,
        setViewState,
        mapRef,
        flyTo,
        fitBounds,
        isMapLoaded,
        setMapLoaded,
        animatePrecipitationBands,
        isAnimating,
      }}
    >
      {children}
    </MapContext.Provider>
  )
}

export function useMap() {
  const ctx = useContext(MapContext)
  if (!ctx) {
    throw new Error("useMap must be used inside a MapProvider")
  }
  return ctx
}

function useSnowfallAnimation(
  mapRef: React.RefObject<MapRef>,
  isMapLoaded: boolean,
) {
  const animationFrameIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return

    const mapboxMap = mapRef.current.getMap() as mapboxgl.Map
    if (!mapboxMap.getLayer("precipitable-water")) {
      console.warn("Layer 'precipitable-water' not found.")
      return
    }

    if (mapboxMap.getLayer("snowfall")) {
      mapboxMap.setPaintProperty("snowfall", "raster-opacity", 0)
    }

    let currentBandIndex = 0
    const FRAMES_PER_BAND = 30
    let frameCount = 0
    const snowfallThreshold = 5
    let snowfallAnimated = false

    console.log("Starting animation")

    function animate() {
      console.log("Animating frame", frameCount)
      frameCount++
      if (frameCount >= FRAMES_PER_BAND) {
        frameCount = 0
        currentBandIndex++
        if (currentBandIndex < PRECIPITATION_BANDS.length) {
          mapboxMap.setPaintProperty(
            "precipitable-water",
            "raster-array-band",
            PRECIPITATION_BANDS[currentBandIndex],
          )
          if (currentBandIndex >= snowfallThreshold && !snowfallAnimated) {
            updateSnowfallOpacity(mapboxMap, 1, 2000)
            snowfallAnimated = true
          }
        } else {
          if (animationFrameIdRef.current !== null) {
            cancelAnimationFrame(animationFrameIdRef.current)
          }
          animationFrameIdRef.current = null
          return
        }
      }
      animationFrameIdRef.current = requestAnimationFrame(animate)
    }

    animationFrameIdRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [isMapLoaded, mapRef])

  function updateSnowfallOpacity(
    map: mapboxgl.Map,
    targetOpacity: number,
    duration: number = 2000,
  ) {
    const startOpacity = (map.getPaintProperty("snowfall", "raster-opacity") ??
      0) as number
    const startTime = performance.now()

    function animate(time: number) {
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)
      const currentOpacity =
        startOpacity + (targetOpacity - startOpacity) * progress

      if (map) {
        map.setPaintProperty("snowfall", "raster-opacity", currentOpacity)
      }

      if (progress < 1 && map) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }
}

export default useSnowfallAnimation
