/**
 * Scenario Explorer outer shell store: Explore-tab surface routing only.
 *
 * `mainView` selects GetStartedView vs ExplorerToolView. It survives a page
 * reload within the same tab via sessionStorage (`exploreSessionPersist.ts`).
 */

import { create, immer } from "@repo/state/zustand"
import { useExplorerStore } from "./explorer/store"
import {
  loadExploreSessionState,
  saveExploreSessionState,
} from "./explorer/store/exploreSessionPersist"
import { pickShellPersistedState } from "./explorer/store/pickSlices"

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

const shellSession = loadExploreSessionState()

export const useScenarioExplorerStore = create<ScenarioExplorerShellStore>()(
  immer<ScenarioExplorerShellStore>((set) => ({
    mainView: shellSession.shell.mainView,

    setMainView: (view) =>
      set((state) => {
        if (state.mainView !== view) {
          useExplorerStore.getState().endTour()
        }
        state.mainView = view
      }),
  })),
)

let prevShellSerialized = JSON.stringify(
  pickShellPersistedState(useScenarioExplorerStore.getState()),
)
useScenarioExplorerStore.subscribe((state) => {
  const next = pickShellPersistedState(state)
  const serialized = JSON.stringify(next)
  if (serialized === prevShellSerialized) return
  prevShellSerialized = serialized
  saveExploreSessionState({ shell: next })
})
