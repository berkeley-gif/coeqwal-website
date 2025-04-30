import { useState, useRef, useCallback, useEffect } from "react"
import type { MapRef } from "@repo/map"

// local map type convenience
type MBMap = ReturnType<MapRef["getMap"]>

// Precipitable-water raster array-band timestamps (epoch seconds)
const PRECIPITATION_BANDS = [
  "1733940000",
  "1733961600",
  "1733983200",
  "1734004800",
  "1734026400",
  "1734048000",
  "1734069600",
  "1734091200",
  "1734112800",
  "1734134400",
] as const

interface Options {
  /** index at which the snowfall layer fades in */
  snowfallThreshold?: number
  /** frames (RAF) that each band is shown */
  framesPerBand?: number // deprecated, kept for backward compatibility
  /** milliseconds each band is shown  – preferred */
  bandDurationMs?: number
  /** multiplier applied to bandDuration to get raster-fade-duration (overlap) */
  fadeMultiplier?: number
  /** snowfall fade-in duration in ms */
  snowFadeDurationMs?: number
  /** milliseconds before flyTo end at which band animation starts */
  flyOverlapMs?: number
}

export function usePrecipitationAnimation(
  mapRef: React.RefObject<MapRef | null>,
  {
    snowfallThreshold = 5,
    framesPerBand = 30,
    bandDurationMs = 400,
    fadeMultiplier = 1.5,
    snowFadeDurationMs = 2500,
    flyOverlapMs = 400,
  }: Options = {},
) {
  const [isAnimating, setIsAnimating] = useState(false)
  const isAnimatingRef = useRef(false)
  const frameId = useRef<number | null>(null)

  // ---- helpers -----------------------------------------------------------
  const setOpacity = useCallback(
    (map: MBMap, layerId: string, opacity: number, duration = 1000) => {
      if (!map.getLayer(layerId)) return
      map.setPaintProperty(layerId, "raster-opacity-transition", {
        duration,
        delay: 0,
      })
      map.setPaintProperty(layerId, "raster-opacity", opacity)
    },
    [],
  )

  const initialiseLayers = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return false
    const prec = map.getLayer("precipitable-water")
    const snow = map.getLayer("snowfall")
    if (!prec || !snow) {
      console.warn("precipitable-water or snowfall layers missing in style")
      return false
    }
    // show first band + hide snowfall
    map.setPaintProperty(
      "precipitable-water",
      "raster-array-band",
      PRECIPITATION_BANDS[0],
    )
    map.setPaintProperty("precipitable-water", "raster-opacity", 0.7)
    setOpacity(map, "snowfall", 0, 0)
    map.setPaintProperty("snowfall", "raster-opacity-transition", {
      duration: 0,
      delay: 0,
    })
    return true
  }, [mapRef, setOpacity])

  // call once when hook consumers mount & map is ready
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    if (map.isStyleLoaded()) {
      initialiseLayers()
    } else {
      map.once("load", initialiseLayers)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- animation --------------------------------------------------------
  const animateBands = useCallback(() => {
    if (isAnimating) return

    const map = mapRef.current?.getMap()
    if (!map) {
      console.warn("map not ready for animation")
      return
    }
    if (!initialiseLayers()) return

    // Fly out over the Pacific first — animation begins after movement ends
    const flyDuration = 1500
    map.flyTo({
      center: [-135, 35], // west of California
      zoom: 4.6,
      pitch: 0,
      bearing: 0,
      duration: flyDuration,
      essential: true,
    })

    // Prepare paint transition (done once)
    map.setPaintProperty(
      "precipitable-water",
      "raster-fade-duration",
      Math.round(bandDurationMs * fadeMultiplier),
    )

    let bandIndex = 0
    let snowShown = false
    let lastSwitch = 0

    const step = (now: number) => {
      if (lastSwitch === 0) lastSwitch = now
      if (now - lastSwitch >= bandDurationMs) {
        lastSwitch = now
        bandIndex += 1
        if (bandIndex < PRECIPITATION_BANDS.length) {
          map.setPaintProperty(
            "precipitable-water",
            "raster-array-band",
            PRECIPITATION_BANDS[bandIndex],
          )

          if (bandIndex >= snowfallThreshold && !snowShown) {
            setOpacity(map, "snowfall", 1, snowFadeDurationMs)
            snowShown = true
          }
        } else {
          cancelAnimationFrame(frameId.current!)
          frameId.current = null
          setIsAnimating(false)
          isAnimatingRef.current = false
          return
        }
      }
      frameId.current = requestAnimationFrame(step)
    }

    const startAnimation = () => {
      // kick-off RAF loop once flyTo completes
      if (!isAnimatingRef.current) return // animation may have been canceled
      lastSwitch = performance.now()
      frameId.current = requestAnimationFrame(step)
      map.off("moveend", startAnimation)
    }

    setIsAnimating(true)
    isAnimatingRef.current = true

    // kick off slightly before fly ends
    const earlyDelay = Math.max(0, flyDuration - flyOverlapMs)
    const timeoutId = window.setTimeout(() => {
      if (!frameId.current && isAnimatingRef.current) startAnimation()
    }, earlyDelay)

    // fallback when movement really ends
    map.on("moveend", startAnimation)

    // clear timeout if flyTo cancelled/ends sooner
    map.once("moveend", () => clearTimeout(timeoutId))
  }, [
    bandDurationMs,
    initialiseLayers,
    isAnimating,
    mapRef,
    setOpacity,
    snowfallThreshold,
    fadeMultiplier,
    snowFadeDurationMs,
    flyOverlapMs,
  ])

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameId.current) cancelAnimationFrame(frameId.current)
    }
  }, [])

  return { animateBands, isAnimating }
}
