import { useCallback } from "react"
import { useMap } from "../context/MapContext"
import { paragraphMapViews } from "../../lib/mapViews"

export function useMapInteractions() {
  const { flyTo, isMapLoaded } = useMap()

  const handleFlyTo = useCallback(
    (
      paragraphIndex: number,
      isXs: boolean,
      isSm: boolean,
      isMd: boolean,
      isLg: boolean,
      isXl: boolean,
    ) => {
      if (!isMapLoaded) return // Ensure map is loaded

      function getBreakpointKey() {
        if (isXs) return "xs"
        if (isSm) return "sm"
        if (isMd) return "md"
        if (isLg) return "lg"
        if (isXl) return "xl"
        return "xl"
      }

      const bpKey = getBreakpointKey()
      const coords = paragraphMapViews[paragraphIndex][bpKey]

      // IMPORTANT: Only perform one type of state update to avoid flashes
      // Option 1: Only use flyTo and skip setViewState
      flyTo(
        coords.longitude,
        coords.latitude,
        coords.zoom,
        coords.pitch,
        coords.bearing,
      )

      // Option 2: Only use setViewState (keep this commented out since we're using Option 1)
      /*
      setViewState((prev) => {
        if (
          prev.longitude === coords.longitude &&
          prev.latitude === coords.latitude &&
          prev.zoom === coords.zoom
        ) {
          return prev // No change needed
        }

        return {
          ...prev,
          ...coords,
          transitionDuration: 2000,
          easing: (t: number) => t * (2 - t),
        }
      })
      */
    },
    [flyTo, isMapLoaded],
  )

  return { handleFlyTo }
}
