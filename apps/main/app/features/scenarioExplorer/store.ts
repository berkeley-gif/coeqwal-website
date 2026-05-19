/**
 * Scenario Explorer outer shell store: Explore-tab surface routing only.
 *
 * `mainView` selects GetStartedView vs ExplorerToolView.
 */

import { create, immer } from "@repo/state/zustand"
import { useExplorerStore } from "./explorer/store"

export type MainView = "get-started" | "explorer"

export type { ExploreMode, OutcomeDisplayMode } from "./explorer/store"
export type { ShareItem, ShareItemPatch } from "./explorer/share/types"

interface ScenarioExplorerShellState {
  mainView: MainView
}

interface ScenarioExplorerShellActions {
  setMainView: (view: MainView) => void
}

type ScenarioExplorerShellStore = ScenarioExplorerShellState &
  ScenarioExplorerShellActions

export const useScenarioExplorerStore = create<ScenarioExplorerShellStore>()(
  immer<ScenarioExplorerShellStore>((set) => ({
    mainView: "get-started",

    setMainView: (view) =>
      set((state) => {
        if (state.mainView !== view) {
          useExplorerStore.getState().endTour()
        }
        state.mainView = view
      }),
  })),
)
