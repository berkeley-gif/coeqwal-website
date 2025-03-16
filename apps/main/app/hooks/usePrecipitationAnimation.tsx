import { useRef, useCallback, useState, useEffect } from "react"
import type { MapboxMapRef } from "@repo/map"
import { PRECIPITATION_BANDS } from "../../lib/mapPrecipitationAnimationBands"

export function usePrecipitationAnimation(
  mapRef: React.RefObject<MapboxMapRef>,
  isMapLoaded: boolean,
) {
  const animationFrameIdRef = useRef<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentBandIndex, setCurrentBandIndex] = useState(0)
  const frameCounter = useRef(0)

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.withMap((mapboxMap) => {
        const map = mapboxMap.getMap() as mapboxgl.Map
        if (map.getLayer("precipitable-water")) {
          map.setPaintProperty("precipitable-water", "raster-array-band", PRECIPITATION_BANDS[0])
        }
      })
    }
  }, [mapRef])

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

      function animate() {
        frameCounter.current += 1

        if (frameCounter.current >= 30) {
          setCurrentBandIndex((prevIndex) => {
            const nextIndex = prevIndex + 1

            if (nextIndex >= PRECIPITATION_BANDS.length) {
              if (animationFrameIdRef.current !== null) {
                cancelAnimationFrame(animationFrameIdRef.current)
              }
              setIsAnimating(false)
              return 0
            }

            map.setPaintProperty(
              "precipitable-water",
              "raster-array-band",
              PRECIPITATION_BANDS[nextIndex],
            )

            if (nextIndex === 3) {
              updateSnowfallOpacity(map, 1, 2000, t => t * (2 - t))
            }

            return nextIndex
          })

          frameCounter.current = 0
        }

        animationFrameIdRef.current = requestAnimationFrame(animate)
      }

      setIsAnimating(true)
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
    easing: (t: number) => number = t => t * (2 - t) // easing function
  ) {
    const startOpacity = (map.getPaintProperty("snowfall", "raster-opacity") ?? 0) as number
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