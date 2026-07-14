/**
 * Explorer store instance and persistence subscriptions.
 *
 * Explore session state survives a page reload within the same tab via
 * sessionStorage (`exploreSessionPersist.ts`). Share items use localStorage
 * (`share/persist.ts`).
 */

import { create, immer } from "@repo/state/zustand"
import { isPerfEnabled, perfMark, registerPerfAction } from "@repo/data/perf"
import type { ShareItem } from "../share/types"
import { saveShareState } from "../share/persist"
import { createWorkspaceSlice } from "./workspaceStoreSlice"
import { createListSlice } from "./listStoreSlice"
import { createRadarSlice } from "./radarStoreSlice"
import { createEquitySlice } from "./equityStoreSlice"
import { createResilienceSlice } from "./resilienceStoreSlice"
import { createDataSlice } from "./dataStoreSlice"
import type { WorkspaceSlice } from "./workspaceStoreSlice"
import type { ListSlice } from "./listStoreSlice"
import type { RadarSlice } from "./radarStoreSlice"
import type { EquitySlice } from "./equityStoreSlice"
import type { ResilienceSlice } from "./resilienceStoreSlice"
import type { DataSlice } from "./dataStoreSlice"
import {
  loadExploreSessionState,
  mergeDataInitialState,
  mergeEquityInitialState,
  mergeListInitialState,
  mergeRadarInitialState,
  mergeResilienceInitialState,
  mergeWorkspaceInitialState,
  saveExploreSessionState,
} from "./exploreSessionPersist"
import { pickExplorerPersistedSession } from "./pickSlices"

export type ExplorerStore = WorkspaceSlice &
  ListSlice &
  RadarSlice &
  EquitySlice &
  ResilienceSlice &
  DataSlice

const exploreSession = loadExploreSessionState()

export const useExplorerStore = create<ExplorerStore>()(
  immer<ExplorerStore>((set) => ({
    ...createWorkspaceSlice(
      set,
      mergeWorkspaceInitialState(exploreSession.workspace),
    ),
    ...createListSlice(set, mergeListInitialState(exploreSession.list)),
    ...createRadarSlice(set, mergeRadarInitialState(exploreSession.radar)),
    ...createEquitySlice(set, mergeEquityInitialState(exploreSession.equity)),
    ...createResilienceSlice(
      set,
      mergeResilienceInitialState(exploreSession.resilience),
    ),
    ...createDataSlice(set, mergeDataInitialState(exploreSession.data)),
  })),
)

let prevShareRef: ShareItem[] = useExplorerStore.getState().shareItems
let prevStoryRef: string[] = useExplorerStore.getState().storyItemIds
useExplorerStore.subscribe((state) => {
  if (
    state.shareItems !== prevShareRef ||
    state.storyItemIds !== prevStoryRef
  ) {
    prevShareRef = state.shareItems
    prevStoryRef = state.storyItemIds
    saveShareState(state.shareItems, state.storyItemIds)
  }
})

let prevExploreSessionSerialized = JSON.stringify(
  pickExplorerPersistedSession(useExplorerStore.getState()),
)
useExplorerStore.subscribe((state) => {
  const next = pickExplorerPersistedSession(state)
  const serialized = JSON.stringify(next)
  if (serialized === prevExploreSessionSerialized) return
  prevExploreSessionSerialized = serialized
  saveExploreSessionState(next)
})

// Dev-only (NEXT_PUBLIC_PERF_LOG=1): mark selection commits for the latency
// study and expose a driver-facing selection action. Reference compares
// only, so this subscription costs two identity checks per store commit.
if (isPerfEnabled()) {
  let prevSelectedScenarios = useExplorerStore.getState().selectedScenarios
  let prevHydroclimate = useExplorerStore.getState().hydroclimate
  useExplorerStore.subscribe((state) => {
    if (state.selectedScenarios !== prevSelectedScenarios) {
      prevSelectedScenarios = state.selectedScenarios
      perfMark("select:scenarios", { count: state.selectedScenarios.length })
    }
    if (state.hydroclimate !== prevHydroclimate) {
      prevHydroclimate = state.hydroclimate
      perfMark("select:hydroclimate", { value: state.hydroclimate })
    }
  })
  registerPerfAction("selectScenarios", (ids: string[]) =>
    useExplorerStore.getState().selectScenarios(ids),
  )
}
