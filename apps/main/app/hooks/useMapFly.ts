import { useMap } from "@repo/map"
import type { ViewStatePreset } from "../config/mapViews"

export const useMapFly = () => {
  const { mapRef } = useMap()
  return (view: ViewStatePreset, duration = 3000) => {
    mapRef.current?.flyTo({ ...view, duration, essential: true })
  }
}
