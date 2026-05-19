/**
 * Explorer tools store - one Zustand instance composed from slices
 *
 * Slices are for organizational purposes. This is all one Zustand store.
 *
 *   workspaceSlice  - cross-tool: selection, share, toolbar, hydroclimate
 *   listSlice       - filters, sort, pins (filters also feed sidebar ordering)
 *   radarSlice      - radar axes and display toggles
 *   equitySlice     - distribution comparison and share outcome codes
 *   resilienceSlice - heatmap control fields
 */

import { create, immer } from "@repo/state/zustand"
import type { ShareItem } from "../share/types"
import { saveShareState } from "../share/persist"
import { createWorkspaceSlice } from "./workspaceSlice"
import { createListSlice } from "./listSlice"
import { createRadarSlice } from "./radarSlice"
import { createEquitySlice } from "./equitySlice"
import { createResilienceSlice } from "./resilienceSlice"

export type { ExploreMode, OutcomeDisplayMode, TourTool } from "./types"
export type { ShareItem, ShareItemPatch } from "./types"
export {
  DEFAULT_RESILIENCE_CONTROLS,
  selectResilienceControls,
} from "./resilienceSlice"
export type {
  ResilienceControlsState,
  ResilienceView,
  AggregateOver,
  CellEncoding,
  DeltaMode,
  AggregateScope,
} from "./resilienceSlice"

import type { WorkspaceSlice } from "./workspaceSlice"
import type { ListSlice } from "./listSlice"
import type { RadarSlice } from "./radarSlice"
import type { EquitySlice } from "./equitySlice"
import type { ResilienceSlice } from "./resilienceSlice"

export type ExplorerStore = WorkspaceSlice &
  ListSlice &
  RadarSlice &
  EquitySlice &
  ResilienceSlice

export const useExplorerStore = create<ExplorerStore>()(
  immer<ExplorerStore>((set) => ({
    ...createWorkspaceSlice(set),
    ...createListSlice(set),
    ...createRadarSlice(set),
    ...createEquitySlice(set),
    ...createResilienceSlice(set),
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
