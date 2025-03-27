import { useRef, useCallback, useEffect } from "react"
import type { MapboxMapRef } from "@repo/map"
import { PRECIPITATION_BANDS } from "../../lib/mapPrecipitationAnimationBands"

export function usePrecipitationAnimation(
  mapRef: React.RefObject<MapboxMapRef>,
  isMapLoaded: boolean,
) {
  const animationFrameIdRef = useRef<number | null>(null)
  const frameCounter = useRef(0)
  const isAnimatingRef = useRef(false)

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.withMap((mapboxMap) => {
        const map = mapboxMap.getMap() as mapboxgl.Map
        if (map.getLayer("precipitable-water")) {
          map.setPaintProperty(
            "precipitable-water",
            "raster-array-band",
            PRECIPITATION_BANDS[0],
          )
        }
      })
    }

    // Cleanup any animations when component unmounts
    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current)
        animationFrameIdRef.current = null
      }
      isAnimatingRef.current = false
    }
  }, [mapRef])

  const animatePrecipitationBands = useCallback(() => {
    if (!isMapLoaded || !mapRef.current) return

    // Cancel any existing animation before starting a new one
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current)
      animationFrameIdRef.current = null
    }

    // Reset state
    frameCounter.current = 0
    isAnimatingRef.current = true

    mapRef.current.withMap((mapboxMap) => {
      const map = mapboxMap.getMap() as mapboxgl.Map
      if (!map.getLayer("precipitable-water")) {
        console.warn("Layer 'precipitable-water' not found.")
        return
      }

      if (map.getLayer("snowfall")) {
        map.setPaintProperty("snowfall", "raster-opacity", 0)
      }

      let currentBandIndex = 0

      function animate() {
        if (!isAnimatingRef.current) return

        frameCounter.current += 1

        if (frameCounter.current >= 15) {
          currentBandIndex += 1

          if (currentBandIndex >= PRECIPITATION_BANDS.length) {
            if (animationFrameIdRef.current !== null) {
              cancelAnimationFrame(animationFrameIdRef.current)
              animationFrameIdRef.current = null
              isAnimatingRef.current = false
            }
            return
          }

          map.setPaintProperty(
            "precipitable-water",
            "raster-array-band",
            PRECIPITATION_BANDS[currentBandIndex],
          )

          if (currentBandIndex === 3) {
            updateSnowfallOpacity(map, 1, 1500, (t) => t * (2 - t))
          }

          frameCounter.current = 0
        }

        if (isAnimatingRef.current) {
          animationFrameIdRef.current = requestAnimationFrame(animate)
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(animate)
    })

    // Return cleanup function
    return () => {
      isAnimatingRef.current = false
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current)
        animationFrameIdRef.current = null
      }
    }
  }, [isMapLoaded, mapRef])

  function updateSnowfallOpacity(
    map: mapboxgl.Map,
    targetOpacity: number,
    duration: number = 2000,
    easing: (t: number) => number = (t) => t * (2 - t), // easing function
  ) {
    const startOpacity = (map.getPaintProperty("snowfall", "raster-opacity") ??
      0) as number
    const startTime = performance.now()

    function animate(time: number) {
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easing(progress)
      const currentOpacity =
        startOpacity + (targetOpacity - startOpacity) * easedProgress

      if (map) {
        map.setPaintProperty("snowfall", "raster-opacity", currentOpacity)
      }

      if (progress < 1 && map) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }

  return { animatePrecipitationBands }
}
