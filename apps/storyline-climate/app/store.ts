import { create, immer } from "@repo/state/zustand"

interface AppState {
  activeSection: SectionId
}

export type SectionId =
  | "opener"
  | "temperature"
  | "temperatureBuilder"
  | "sierranevada"
  | "snowmelt"
  | "groundwater"
  | "groundwaterTransition"
  | "deltaFarms"
  | "deltaAqueduct"
  | "balance"
  | "bullet"
  | "coeqwalCallout"
  | "hydroclimate"
  | "hydroclimateTransition"
  | "themes"
  | "conclusion"

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
