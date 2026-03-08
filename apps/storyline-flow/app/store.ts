import { create, immer } from "@repo/state/zustand"
import { Storyline } from "./story"
import {
  getSectionLayerConfig,
  SectionId,
  SectionLayerConfig,
} from "./components/map/config/sectionConfig"
import { TooltipType } from "./components/map/setup/LayerOrchestrator"

// ============================================================================
// COMBINED STATE
// ============================================================================

interface AppState {
  // Story
  storyline: Storyline | null
  activeSection: SectionId
  selectedMonthSnowpack: string
  selectedYearVariability: string

  // Map
  isMapReady: boolean
  riverProgress: number
  valleyBoundaryProgress: number
  deltaBoundaryProgress: number

  tooltipContent: TooltipType | null
}

const initialState: AppState = {
  storyline: null,
  activeSection: "opener",
  selectedMonthSnowpack: "10",
  selectedYearVariability: "",

  isMapReady: false,
  riverProgress: 0,
  valleyBoundaryProgress: 0,
  deltaBoundaryProgress: 0,

  tooltipContent: null,
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

  fetchStoryline: async () => {
    try {
      const response = await fetch("/locales/english.json")
      if (!response.ok) {
        throw new Error("Failed to fetch story data")
      }
      const data = await response.json()
      useStoryStore.setState({ storyline: data })
    } catch (err) {
      console.error("Error loading story data:", err)
    }
  },

  setSelectedMonthSnowpack: (month: string) =>
    useStoryStore.setState({ selectedMonthSnowpack: month }),

  setSelectYearVariability: (year: string) =>
    useStoryStore.setState({ selectedYearVariability: year }),

  // Map
  setMapReady: (ready: boolean) =>
    useStoryStore.setState({ isMapReady: ready }),

  setTooltipContent: (content: TooltipType | null) =>
    useStoryStore.setState({ tooltipContent: content }),

  setRiverProgress: (progress: number) =>
    useStoryStore.setState({ riverProgress: progress }),

  setValleyProgress: (progress: number) =>
    useStoryStore.setState({ valleyBoundaryProgress: progress }),

  setDeltaBoundaryProgress: (progress: number) =>
    useStoryStore.setState({ deltaBoundaryProgress: progress }),
}

// ============================================================================
// Selectors (subscribing)
// ============================================================================

// Core
export const useMapReady = () => useStoryStore((state) => state.isMapReady)
export const useStoryline = () => useStoryStore((state) => state.storyline)
export const useTooltip = () => useStoryStore((state) => state.tooltipContent)

export const useActiveSectionStore = () =>
  useStoryStore((state) => state.activeSection)

const createLayerSelector = (key: keyof SectionLayerConfig) => () =>
  useStoryStore((s) => !!getSectionLayerConfig(s.activeSection)[key])

export const useShowPrecipitation = createLayerSelector("precipitation")
export const useShowSnowpack = createLayerSelector("snowpack")
export const useShowVariability = createLayerSelector("variability")
export const useShowRivers = createLayerSelector("majorRivers")
export const useShowValleyBoundary = createLayerSelector(
  "centralValleyBoundary",
)
export const useShowWetland = createLayerSelector("wetland")
export const useShowDeltaBoundary = createLayerSelector("deltaBoundary")
export const useShowGoldRush = createLayerSelector("goldrush")
export const useShowDrinking = createLayerSelector("drinking")
export const useShowTransformation = createLayerSelector("transformation")
export const useShowCity = createLayerSelector("city")
export const useShowImpact = createLayerSelector("impact")

export const useCameraView = () =>
  useStoryStore((s) => getSectionLayerConfig(s.activeSection).camera)
export const useRiversProgress = () => useStoryStore((s) => s.riverProgress)
export const useValleyBoundaryProgress = () =>
  useStoryStore((s) => s.valleyBoundaryProgress)
export const useDeltaBoundaryProgress = () =>
  useStoryStore((s) => s.deltaBoundaryProgress)

export const useSelectedMonthSnowpack = () =>
  useStoryStore((s) => s.selectedMonthSnowpack)
export const useSelectedYearVariability = () =>
  useStoryStore((s) => s.selectedYearVariability)
