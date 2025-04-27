import { create } from "zustand"
import { MarkerType } from "./components/helpers/mapMarkers"

export interface Storyline {
  opener: {
    title: string
    subtitle: string
    p1: string
    p2: string
    throughline: string
  }
  precipitation: {
    title: string
    p1: string
    p2: string
    p3: string
    p4: string
  }
  variability?: {
    p1: string
    p2: string
    p3: string
    p4: string
  }
  snowpack: {
    title: string
    p1: string
    p2: string
    p3: string
  }
  flow: {
    title: string
    p1: string
    p2: string
    p3: string
    p4: string
    valley: {
      p1: string
      p2: string
      p3: string
      p4: string
    }
    transition: {
      p1: string
      p2: string
    }
  }
  delta: {
    p11: string
    p12: string
    p13: string
    p2: string
    p3: string
    p4: string
    p5: string
    transition: string
  }
  economy: {
    title: string
    p1: string
    p2: string
    irrigation: {
      p1: string
      p2: string
    }
    drinking: {
      p1: string
      p2: string
      p3: string
    }
  }
  transformation: {
    subtitle1: string
    subtitle2: string
    p11: string
    p12: string
    p21: string
    p22: string
    p23: string
    p31: string
    p32: string
    p33: string
    p41: string
    p42: string
    p43: string
    transition: string
  }
  impact: {
    benefits: {
      p1: string
      p2: string
      p3: string
      p4: string
      transition: string
    }
    salmon: {
      p1: string
      p2: string
      p31: string
      p32: string
      p33: string
    }
    delta: {
      p11: string
      p12: string
      p2: string
      p3: string
      p4: string
      p5: string
    }
    groundwater: {
      p1: string
      p21: string
      p22: string
      p23: string
      p3: string
    }
    drinking: {
      p1: string
      p21: string
      p22: string
      p23: string
    }
    climate: {
      p11: string
      p12: string
      p2: string
      p3: string
    }
  }
  conclusion: {
    subtitle: string
    caption: string
    p11: string
    p12: string
    p13: string
    p14: string
    p15: string
    p16: string
    p2: string
    p3: string
    p41: string
    p42: string
    transition: {
      subtitle: string
      p11: string
      p12: string
      p2: string
    }
    ending: {
      p11: string
      p12: string
    }
  }
}

interface StoryState {
  storyline: Storyline | null
  activeSection: string
  loadedSections: Set<string>
  markers: MarkerType[]
  setActiveSection: (section: string) => void
  fetchStoryline: () => Promise<void>
  markSectionAsLoaded: (section: string) => void
  setMarkers: (markers: MarkerType[]) => void
}

const useStoryStore = create<StoryState>((set) => ({
  storyline: null,
  activeSection: "opener",
  loadedSections: new Set(["opener", "precipitation"]), // Initialize with the first section loaded
  markers: [],
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
  setMarkers: (markers: MarkerType[]) => set({ markers: markers }),
}))
export default useStoryStore
