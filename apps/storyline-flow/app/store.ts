import { create } from "zustand"
import { MarkerType } from "./components/helpers/mapMarkers"
import { Storyline } from "./story"

interface StoryState {
  storyline: Storyline | null
  activeSection: string
  loadedSections: Set<string>
  markerLayer: {
    points: MarkerType[]
    style: string
  }
  setActiveSection: (section: string) => void
  fetchStoryline: () => Promise<void>
  markSectionAsLoaded: (section: string) => void
  setMarkers: (markers: MarkerType[], style: string) => void
}

const useStoryStore = create<StoryState>((set) => ({
  storyline: null,
  activeSection: "opener",
  loadedSections: new Set(["opener", "precipitation"]), // Initialize with the first section loaded
  markerLayer: { points: [], style: "rough-circle" },
  textMarkerLayer: { points: [], style: "text" },
  setActiveSection: (section: string) => set({ activeSection: section }),
  markSectionAsLoaded: (section: string) =>
    set((state) => {
      const updatedLoadedSections = new Set(state.loadedSections)
      updatedLoadedSections.add(section)
      return { loadedSections: updatedLoadedSections }
    }),
  fetchStoryline: async () => {
    try {
      const response = await fetch("/locales/english.json")
      if (!response.ok) {
        throw new Error("Failed to fetch story data")
      }
      const data = await response.json()
      set({ storyline: data })
    } catch (err) {
      console.error("Error loading story data:", err)
    }
  },
  setMarkers: (markers: MarkerType[], style: string) =>
    set({ markerLayer: { points: markers, style: style } }),
}))
export default useStoryStore
