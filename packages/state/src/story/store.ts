import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

export interface StoryUIState {
  currentScene: string | null
  isAnimating: boolean
  overlays: Record<string, boolean>
  // actions
  setScene: (id: string | null) => void
  setAnimating: (flag: boolean) => void
  setOverlay: (key: string, visible: boolean) => void
}

export const useStoryStore = create<StoryUIState>()(
  immer<StoryUIState>((set) => ({
    currentScene: null,
    isAnimating: false,
    overlays: {},
    setScene: (id) => set((s) => void (s.currentScene = id)),
    setAnimating: (flag) => set((s) => void (s.isAnimating = flag)),
    setOverlay: (key, visible) =>
      set((s) => {
        s.overlays[key] = visible
      }),
  })),
)
