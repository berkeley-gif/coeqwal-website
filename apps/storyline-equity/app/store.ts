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

export type { SectionId } from "./components/map/config/sectionConfig"

interface AppState {
  activeSection: SectionId
  riverProgress: number
  mcCloudRiverProgress: number
  historicalContextProgress: number
  backgroundProgress: number
  infrastructureProgress: number
}

const initialState: AppState = {
  activeSection: "Opener",
  riverProgress: 0,
  mcCloudRiverProgress: 0,
  historicalContextProgress: 0,
  backgroundProgress: 0,
  infrastructureProgress: 0,
}

const EMPTY_LOCATION_LABELS: LocationLabel[] = []
const EMPTY_CIRCLE_ANNOTATIONS: MapCircleAnnotation[] = []

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

  setBackgroundProgress: (progress: number) =>
    useStoryStore.setState({ backgroundProgress: progress }),

  setInfrastructureProgress: (progress: number) =>
    useStoryStore.setState({ infrastructureProgress: progress }),
}

// ============================================================================
// Selectors (subscribing)
// ============================================================================

// Core
export const useActiveSectionStore = () =>
  useStoryStore((state) => state.activeSection)

export const useRiversProgress = () => useStoryStore((state) => state.riverProgress)
export const useMcCloudRiverProgress = () =>
  useStoryStore((state) => state.mcCloudRiverProgress)
export const useHistoricalContextProgress = () =>
  useStoryStore((state) => state.historicalContextProgress)
export const useBackgroundProgress = () =>
  useStoryStore((state) => state.backgroundProgress)
export const useInfrastructureProgress = () =>
  useStoryStore((state) => state.infrastructureProgress)

const createLayerSelector = (key: keyof SectionLayerConfig) => () =>
  useStoryStore((state) => !!getSectionLayerConfig(state.activeSection)[key])

export const useShowRivers = createLayerSelector("majorRivers")
export const useShowShastaMcCloud = createLayerSelector("shastaMcCloud")
export const useShowDams = createLayerSelector("dams")

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
  useStoryStore((state) => getSectionLayerConfig(state.activeSection).camera)

export default useStoryStore
