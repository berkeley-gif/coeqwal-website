import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type { Scene } from "./types"

export interface StoryUIState {
  current: Scene
  overlays: Record<string, boolean>
  queue: Scene[]
  // actions
  setScene: (scene: Scene) => void
  markDone: () => void
  setOverlay: (key: string, visible: boolean) => void
}

export const useStoryStore = create<StoryUIState>()(
  immer<StoryUIState>((set) => ({
    current: { id: "initial-load", status: "idle" },
    overlays: {},
    queue: [],
    setScene: (scene) => set((s) => void (s.current = scene)),
    markDone: () => set((s) => void (s.current.status = "done")),
    setOverlay: (key, visible) =>
      set((s) => {
        s.overlays[key] = visible
      }),
  })),
)
