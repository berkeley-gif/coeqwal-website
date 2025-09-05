import { create } from "zustand"

interface StoryState {
  activeSection: string
  isMapReady: boolean
  breakpoint: string
  setActiveSection: (section: string) => void
  setMapReady: (isReady: boolean) => void
  setBreakpoint: (bp: string) => void
}

const useStoryStore = create<StoryState>((set) => ({
  activeSection: "opener",
  isMapReady: false,
  breakpoint: "md",
  setActiveSection: (section: string) => set({ activeSection: section }),
  setMapReady: (isReady: boolean) => set({ isMapReady: isReady }),
  setBreakpoint: (bp: string) => set({ breakpoint: bp }),
}))

export default useStoryStore
