import { create, immer } from "@repo/state/zustand"

interface AppState {
  activeSection: string
}

export type SectionId =
  | "opener"
  | "temperature"
  | "snowmelt"
  | "groundwater"
  | "delta"
  | "adapt-transition"
  | "resolution"

const initialState: AppState = {
  activeSection: "opener",
}

// ============================================================================
// Store
// ============================================================================

export const useStoryStore = create<AppState>()(immer(() => initialState))

// ============================================================================
// Actions
// ============================================================================

export const appActions = {
  // Story
  setActiveSection: (section: SectionId) =>
    useStoryStore.setState({ activeSection: section }),
}

// ============================================================================
// Selectors (subscribing)
// ============================================================================

// Core
export const useActiveSectionStore = () =>
  useStoryStore((state) => state.activeSection)

export default useStoryStore
