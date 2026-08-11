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
  SHASTA_MCCLOUD_VIEW,
} from "./components/map/config/cameraPresets"

export type { SectionId } from "./components/map/config/sectionConfig"

export type CentralValleyIcon =
  | "/map-icons/ag/water-user-ag-01.svg"
  | "/map-icons/ag/water-user-ag-02.svg"
  | "/map-icons/ag/water-user-ag-03.svg"
  | "/map-icons/ag/water-user-ag-06.svg"
  | "/map-icons/ag/water-user-ag-08.svg"
export type UrbanIcon =
  | "/map-icons/urban/water_user_urban-01.svg"
  | "/map-icons/urban/water_user_urban-02.svg"
  | "/map-icons/urban/water_user_urban-03.svg"
export type WetlandIcon =
  | "/map-icons/wetland/water_user_wetland-01.svg"
  | "/map-icons/wetland/water_user_wetland-02.svg"
  | "/map-icons/wetland/water_user_wetland-03.svg"
export type SalmonIcon =
  | "/map-icons/salmon/salmon_adult.svg"
  | "/map-icons/salmon/salmon_jump.svg"
  | "/map-icons/salmon/salmon_juvenile.svg"
  | "/map-icons/salmon/salmon_simple.svg"

interface AppState {
  activeSection: SectionId
  riverProgress: number
  mcCloudRiverProgress: number
  historicalContextProgress: number
  goldRushProgress: number
  yubaRiverProgress: number
  backgroundProgress: number
  infrastructureProgress: number
  transparencyProgress: number
  centralValleyIcon: CentralValleyIcon
  urbanIcon: UrbanIcon
  wetlandIcon: WetlandIcon
  salmonIcon: SalmonIcon
  showMapIconStrokes: boolean
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
  transparencyProgress: 0,
  centralValleyIcon: "/map-icons/ag/water-user-ag-06.svg",
  urbanIcon: "/map-icons/urban/water_user_urban-01.svg",
  wetlandIcon: "/map-icons/wetland/water_user_wetland-01.svg",
  salmonIcon: "/map-icons/salmon/salmon_adult.svg",
  showMapIconStrokes: false,
}

const EMPTY_LOCATION_LABELS: LocationLabel[] = []
const EMPTY_CIRCLE_ANNOTATIONS: MapCircleAnnotation[] = []
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

  setTransparencyProgress: (progress: number) =>
    useStoryStore.setState({ transparencyProgress: progress }),

  setCentralValleyIcon: (icon: CentralValleyIcon) =>
    useStoryStore.setState({ centralValleyIcon: icon }),

  setUrbanIcon: (icon: UrbanIcon) =>
    useStoryStore.setState({ urbanIcon: icon }),

  setWetlandIcon: (icon: WetlandIcon) =>
    useStoryStore.setState({ wetlandIcon: icon }),

  setSalmonIcon: (icon: SalmonIcon) =>
    useStoryStore.setState({ salmonIcon: icon }),

  setShowMapIconStrokes: (show: boolean) =>
    useStoryStore.setState({ showMapIconStrokes: show }),
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
export const useTransparencyProgress = () =>
  useStoryStore((state) => state.transparencyProgress)
export const useCentralValleyIcon = () =>
  useStoryStore((state) => state.centralValleyIcon)
export const useUrbanIcon = () => useStoryStore((state) => state.urbanIcon)
export const useWetlandIcon = () => useStoryStore((state) => state.wetlandIcon)
export const useSalmonIcon = () => useStoryStore((state) => state.salmonIcon)
export const useShowMapIconStrokes = () =>
  useStoryStore((state) => state.showMapIconStrokes)
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
      state.activeSection === "Background" &&
      state.backgroundProgress >= 0.84
    ) {
      return SHASTA_MCCLOUD_VIEW
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
