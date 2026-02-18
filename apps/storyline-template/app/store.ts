import { create } from "zustand"

export interface MarkerPoint {
  longitude: number
  latitude: number
  label?: string
}

interface StoryState {
  activeSection: string
  isMapReady: boolean
  markerLayer: {
    points: MarkerPoint[]
    style: string
  }
  setActiveSection: (section: string) => void
  setMapReady: (isReady: boolean) => void
  setMarkers: (markers: MarkerPoint[], style: string) => void
}

const useStoryStore = create<StoryState>((set) => ({
  activeSection: "opener",
  isMapReady: false,
  markerLayer: { points: [], style: "" },
  setActiveSection: (section: string) => set({ activeSection: section }),
  setMapReady: (isReady: boolean) => set({ isMapReady: isReady }),
  setMarkers: (markers: MarkerPoint[], style: string) =>
    set({ markerLayer: { points: markers, style } }),
}))

export default useStoryStore
