import { useCallback } from "react"
import { useMap } from "../context/MapContext"
// import type { MapRef } from "react-map-gl/mapbox"

export const useMapInteractions = () => {
  const { mapRef } = useMap()

  const flyTo = useCallback(
    (lng: number, lat: number, zoom: number) => {
      // Safely access the map instance
      const mapInstance = mapRef.current?.getMap
        ? mapRef.current.getMap()
        : mapRef.current

      if (!mapInstance) {
        console.warn("Map instance not available for flyTo operation")
        return
      }

      // Handle different map instance types
      if ("flyTo" in mapInstance) {
        mapInstance.flyTo({
          center: [lng, lat],
          zoom,
          duration: 2000,
        })
      } else {
        console.warn("Map instance does not have flyTo method")
      }
    },
    [mapRef],
  )

  return { flyTo }
}
