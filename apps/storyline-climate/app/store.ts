import { create } from "zustand"
import { MarkerType } from "./components/helpers/mapLayers"

interface StoryState {
  activeSection: string
  isMapReady: boolean
  breakpoint: string
  textMarkerLayer: {
    points: MarkerType[]
    style: string
  }
  cancelTextLayer: string
  setActiveSection: (section: string) => void
  setMapReady: (isReady: boolean) => void
  setBreakpoint: (bp: string) => void
  setTextMarkers: (markers: MarkerType[], style: string) => void
  setCancelTextLayer: (text: string) => void
}

const useStoryStore = create<StoryState>((set) => ({
  activeSection: "opener",
  isMapReady: false,
  breakpoint: "md",
  textMarkerLayer: { points: [], style: "text" },
  cancelTextLayer: "",
  setActiveSection: (section: string) => set({ activeSection: section }),
  setMapReady: (isReady: boolean) => set({ isMapReady: isReady }),
  setBreakpoint: (bp: string) => set({ breakpoint: bp }),
  setTextMarkers: (markers: MarkerType[], style: string) =>
    set({ textMarkerLayer: { points: markers, style: style } }),
  setCancelTextLayer: (text: string) => set({ cancelTextLayer: text }),
}))

export default useStoryStore
