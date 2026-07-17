import { create, immer } from "@repo/state/zustand"
import { getSectionLayerConfig } from "./components/map/config/sectionConfig"
import type {
  SectionId,
  SectionLayerConfig,
} from "./components/map/config/sectionConfig"
import type {
  LocationLabel,
  MapCircleAnnotation,
} from "./components/map/config/locationPresets"
import {
  CALIFORNIA_VIEW,
  DELTA_INFRASTRUCTURE_VIEW,
} from "./components/map/config/cameraPresets"

export type { SectionId } from "./components/map/config/sectionConfig"

export type MetroRiverPlaygroundMode = "off" | "metro-map"

interface AppState {
  activeSection: SectionId
  riverProgress: number
  mcCloudRiverProgress: number
  historicalContextProgress: number
  goldRushProgress: number
  yubaRiverProgress: number
  backgroundProgress: number
  infrastructureProgress: number
  metroRiverPlaygroundMode: MetroRiverPlaygroundMode
}

const initialState: AppState = {
  activeSection: "Opener",
  riverProgress: 0,
  mcCloudRiverProgress: 0,
  historicalContextProgress: 0,
  goldRushProgress: 0,
  yubaRiverProgress: 0,
  backgroundProgress: 0,
  infrastructureProgress: 0,
  metroRiverPlaygroundMode: "metro-map",
}

const EMPTY_LOCATION_LABELS: LocationLabel[] = []
const EMPTY_CIRCLE_ANNOTATIONS: MapCircleAnnotation[] = []
const HISTORICAL_CONTEXT_CAMERA_PROGRESS = 0.38
const GOLD_RUSH_CAMERA_PROGRESS = 0.12
export const INFRASTRUCTURE_DELTA_PROGRESS = 0.66
export const INFRASTRUCTURE_DELTA_PIPES_PROGRESS = 0.78

const SECTION_ORDER: Record<SectionId, number> = {
  Opener: 0,
  Background: 1,
  HistoricalContext: 2,
  GoldRush: 3,
  Infrastructure: 4,
  ClimateResilience: 5,
  Transparency: 6,
  Resolution: 7,
  Tiers: 8,
  Conclusion: 9,
}

export function isAtOrAfterSection(section: SectionId, anchor: SectionId) {
  return SECTION_ORDER[section] >= SECTION_ORDER[anchor]
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

  setRiverProgress: (progress: number) =>
    useStoryStore.setState({ riverProgress: progress }),

  setMcCloudRiverProgress: (progress: number) =>
    useStoryStore.setState({ mcCloudRiverProgress: progress }),

  setHistoricalContextProgress: (progress: number) =>
    useStoryStore.setState({ historicalContextProgress: progress }),

  setGoldRushProgress: (progress: number) =>
    useStoryStore.setState({ goldRushProgress: progress }),

  setYubaRiverProgress: (progress: number) =>
    useStoryStore.setState({ yubaRiverProgress: progress }),

  setBackgroundProgress: (progress: number) =>
    useStoryStore.setState({ backgroundProgress: progress }),

  setInfrastructureProgress: (progress: number) =>
    useStoryStore.setState({ infrastructureProgress: progress }),

  setMetroRiverPlaygroundMode: (mode: MetroRiverPlaygroundMode) =>
    useStoryStore.setState({ metroRiverPlaygroundMode: mode }),
}

// ============================================================================
// Selectors (subscribing)
// ============================================================================

// Core
export const useActiveSectionStore = () =>
  useStoryStore((state) => state.activeSection)

export const useRiversProgress = () =>
  useStoryStore((state) => state.riverProgress)
export const useMcCloudRiverProgress = () =>
  useStoryStore((state) => state.mcCloudRiverProgress)
export const useHistoricalContextProgress = () =>
  useStoryStore((state) => state.historicalContextProgress)
export const useGoldRushProgress = () =>
  useStoryStore((state) => state.goldRushProgress)
export const useYubaRiverProgress = () =>
  useStoryStore((state) => state.yubaRiverProgress)
export const useBackgroundProgress = () =>
  useStoryStore((state) => state.backgroundProgress)
export const useInfrastructureProgress = () =>
  useStoryStore((state) => state.infrastructureProgress)
export const useMetroRiverPlaygroundMode = () =>
  useStoryStore((state) => state.metroRiverPlaygroundMode)
export const useShowMetroRiverPlayground = () =>
  useStoryStore(
    (state) =>
      state.activeSection === "Transparency" &&
      state.metroRiverPlaygroundMode !== "off",
  )

const createLayerSelector = (key: keyof SectionLayerConfig) => () =>
  useStoryStore((state) => !!getSectionLayerConfig(state.activeSection)[key])

export const useShowRivers = () =>
  useStoryStore((state) =>
    isAtOrAfterSection(state.activeSection, "Background"),
  )
export const useShowShastaMcCloud = createLayerSelector("shastaMcCloud")
export const useShowYubaRiver = () =>
  useStoryStore((state) => isAtOrAfterSection(state.activeSection, "GoldRush"))

export const useLocationLabels = () =>
  useStoryStore(
    (state) =>
      getSectionLayerConfig(state.activeSection).locationLabels ??
      EMPTY_LOCATION_LABELS,
  )

export const useCircleAnnotations = () =>
  useStoryStore(
    (state) =>
      getSectionLayerConfig(state.activeSection).circleAnnotations ??
      EMPTY_CIRCLE_ANNOTATIONS,
  )

export const useCameraView = () =>
  useStoryStore((state) => {
    if (
      state.activeSection === "HistoricalContext" &&
      state.historicalContextProgress < HISTORICAL_CONTEXT_CAMERA_PROGRESS
    ) {
      return CALIFORNIA_VIEW
    }

    if (
      state.activeSection === "GoldRush" &&
      state.goldRushProgress < GOLD_RUSH_CAMERA_PROGRESS
    ) {
      return CALIFORNIA_VIEW
    }

    if (
      state.activeSection === "Infrastructure" &&
      state.infrastructureProgress >= INFRASTRUCTURE_DELTA_PROGRESS
    ) {
      return DELTA_INFRASTRUCTURE_VIEW
    }

    return getSectionLayerConfig(state.activeSection).camera
  })

export default useStoryStore
