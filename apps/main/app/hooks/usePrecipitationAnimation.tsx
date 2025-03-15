import { useRef, useCallback } from "react"
import type { MapboxMapRef } from "@repo/map"
import { PRECIPITATION_BANDS } from "../../lib/mapPrecipitationAnimationBands"

export function usePrecipitationAnimation(
  mapRef: React.RefObject<MapboxMapRef>,
  isMapLoaded: boolean,
) {
  const animationFrameIdRef = useRef<number | null>(null)

  const animatePrecipitationBands = useCallback(() => {
    if (!isMapLoaded || !mapRef.current) return

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
      const FRAMES_PER_BAND = 30
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
              PRECIPITATION_BANDS[currentBandIndex],
            )
            if (currentBandIndex >= snowfallThreshold && !snowfallAnimated) {
              updateSnowfallOpacity(map, 1, 2000)
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
    })

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

  return { animatePrecipitationBands }
}
