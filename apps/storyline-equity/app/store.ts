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
  CALIFORNIA_TRIBES_VIEW,
  DELTA_INFRASTRUCTURE_VIEW,
  INDIGENOUS_RIVER_NETWORK_VIEW,
  SHASTA_MCCLOUD_VIEW,
  TRANSPARENCY_METRO_VIEW,
} from "./components/map/config/cameraPresets"
import { themeValues } from "@repo/ui/themes/theme"

export type { SectionId } from "./components/map/config/sectionConfig"

export type CentralValleyIcon = "/map-icons/agriculture.svg"
export type UrbanIcon = "/map-icons/urban.svg"
export type WetlandIcon = "/map-icons/wetland.svg"
export type SalmonIcon = "/map-icons/salmon.svg"

interface AppState {
  activeSection: SectionId
  riverProgress: number
  mcCloudRiverProgress: number
  historicalContextProgress: number
  goldRushProgress: number
  yubaRiverProgress: number
  backgroundProgress: number
  infrastructureProgress: number
  climateResilienceProgress: number
  transparencyProgress: number
  conclusionProgress: number
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
  climateResilienceProgress: 0,
  transparencyProgress: 0,
  conclusionProgress: 0,
  centralValleyIcon: "/map-icons/agriculture.svg",
  urbanIcon: "/map-icons/urban.svg",
  wetlandIcon: "/map-icons/wetland.svg",
  salmonIcon: "/map-icons/salmon.svg",
  showMapIconStrokes: true,
}

const EMPTY_LOCATION_LABELS: LocationLabel[] = []
const EMPTY_CIRCLE_ANNOTATIONS: MapCircleAnnotation[] = []
export const HISTORICAL_CONTEXT_RIVERS_PROGRESS = 0.22
export const HISTORICAL_CONTEXT_MCCLOUD_PROGRESS = 0.52
export const GOLD_RUSH_MINES_PROGRESS = 0.32
export const GOLD_RUSH_DITCHES_PROGRESS = 0.48
export const GOLD_RUSH_STATEWIDE_PROGRESS = 0.7
export const GOLD_RUSH_CURRENT_ALLOTMENTS_PROGRESS = 0.82
export const INFRASTRUCTURE_DELTA_PROGRESS = 0.5
// Conclusion map staging, shared by ConclusionCircleMorphOverlay and
// MapInstance. FloatingBubbles has its own explicit timing in 10Conclusion.
//   0.08 -> 0.32  the 5 circles recolor white -> tier color
//   0.34 -> 0.48  circles move straight down and leave the viewport
//   0.48 -> 0.54  the map canvas quickly fades as FloatingBubbles appears
export const CONCLUSION_ICON_COLOR_START_PROGRESS = 0.08
export const CONCLUSION_ICON_COLOR_END_PROGRESS = 0.32
export const CONCLUSION_MORPH_START_PROGRESS = 0.34
export const CONCLUSION_MORPH_LANDED_PROGRESS = 0.48
export const CONCLUSION_MAP_FADE_END_PROGRESS = 0.54
export const CONCLUSION_HANDOFF_START_PROGRESS = 0.7
export const CONCLUSION_HANDOFF_END_PROGRESS = 0.82
export const CONCLUSION_PHOTO_REVEAL_END_PROGRESS = 0.85

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

  setClimateResilienceProgress: (progress: number) =>
    useStoryStore.setState({ climateResilienceProgress: progress }),

  setTransparencyProgress: (progress: number) =>
    useStoryStore.setState({ transparencyProgress: progress }),

  setConclusionProgress: (progress: number) =>
    useStoryStore.setState({ conclusionProgress: progress }),

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
export const useClimateResilienceProgress = () =>
  useStoryStore((state) => state.climateResilienceProgress)
export const useTransparencyProgress = () =>
  useStoryStore((state) => state.transparencyProgress)
export const useConclusionProgress = () =>
  useStoryStore((state) => state.conclusionProgress)

// The 5 Conclusion circles' white -> tier-color recolor. Shared by
// ConclusionCircleMorphOverlay (which now owns rendering those circles
// end-to-end) and any other Conclusion-aware consumer, so there's one
// definition of "what color is this icon right now" rather than two drifting
// copies.
export const useConclusionTierIconColors = () => {
  const activeSection = useActiveSectionStore()
  const conclusionProgress = useConclusionProgress()

  if (activeSection !== "Conclusion") return undefined

  const colorProgress = Math.min(
    1,
    Math.max(
      0,
      (conclusionProgress - CONCLUSION_ICON_COLOR_START_PROGRESS) /
        (CONCLUSION_ICON_COLOR_END_PROGRESS -
          CONCLUSION_ICON_COLOR_START_PROGRESS),
    ),
  )
  const tierIconColor = (tierColor: string) =>
    `color-mix(in srgb, #ffffff ${(1 - colorProgress) * 100}%, ${tierColor})`

  return {
    "central-valley-agriculture": tierIconColor(
      themeValues.palette.tiers.tier2,
    ),
    "bay-area-city": tierIconColor(themeValues.palette.tiers.tier1),
    "los-angeles-city": tierIconColor(themeValues.palette.tiers.tier1),
    "small-community": tierIconColor(themeValues.palette.tiers.tier1),
    delta: tierIconColor(themeValues.palette.tiers.tier3),
    "shasta-salmon": tierIconColor(themeValues.palette.tiers.tier4),
  }
}

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
      state.activeSection === "HistoricalContext" &&
      state.historicalContextProgress >= HISTORICAL_CONTEXT_RIVERS_PROGRESS &&
      state.historicalContextProgress < HISTORICAL_CONTEXT_MCCLOUD_PROGRESS
    ) {
      return INDIGENOUS_RIVER_NETWORK_VIEW
    }

    if (
      state.activeSection === "HistoricalContext" &&
      state.historicalContextProgress < HISTORICAL_CONTEXT_RIVERS_PROGRESS
    ) {
      return CALIFORNIA_TRIBES_VIEW
    }

    if (
      state.activeSection === "HistoricalContext" &&
      state.historicalContextProgress >= HISTORICAL_CONTEXT_MCCLOUD_PROGRESS
    ) {
      return SHASTA_MCCLOUD_VIEW
    }

    if (
      state.activeSection === "GoldRush" &&
      state.goldRushProgress >= GOLD_RUSH_STATEWIDE_PROGRESS
    ) {
      return CALIFORNIA_TRIBES_VIEW
    }

    if (
      state.activeSection === "Infrastructure" &&
      state.infrastructureProgress >= INFRASTRUCTURE_DELTA_PROGRESS
    ) {
      return DELTA_INFRASTRUCTURE_VIEW
    }

    if (
      state.activeSection === "ClimateResilience" ||
      state.activeSection === "Transparency"
    ) {
      return TRANSPARENCY_METRO_VIEW
    }

    return getSectionLayerConfig(state.activeSection).camera
  })

export default useStoryStore
