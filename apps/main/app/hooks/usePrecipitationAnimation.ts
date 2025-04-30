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
  framesPerBand?: number
}

export function usePrecipitationAnimation(
  mapRef: React.RefObject<MapRef | null>,
  { snowfallThreshold = 5, framesPerBand = 30 }: Options = {},
) {
  const [isAnimating, setIsAnimating] = useState(false)
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

    let bandIndex = 0
    let frame = 0
    let snowShown = false

    const step = () => {
      frame++
      if (frame >= framesPerBand) {
        frame = 0
        bandIndex += 1
        if (bandIndex < PRECIPITATION_BANDS.length) {
          map.setPaintProperty(
            "precipitable-water",
            "raster-array-band",
            PRECIPITATION_BANDS[bandIndex],
          )
          if (bandIndex >= snowfallThreshold && !snowShown) {
            setOpacity(map, "snowfall", 1, 2000)
            snowShown = true
          }
        } else {
          // finished
          cancelAnimationFrame(frameId.current!)
          frameId.current = null
          setIsAnimating(false)
          // reset snowfall
          setOpacity(map, "snowfall", 0, 1000)
          return
        }
      }
      frameId.current = requestAnimationFrame(step)
    }

    setIsAnimating(true)
    frameId.current = requestAnimationFrame(step)
  }, [
    framesPerBand,
    initialiseLayers,
    isAnimating,
    mapRef,
    setOpacity,
    snowfallThreshold,
  ])

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameId.current) cancelAnimationFrame(frameId.current)
    }
  }, [])

  return { animateBands, isAnimating }
}
