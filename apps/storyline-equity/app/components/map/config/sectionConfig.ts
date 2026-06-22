import {
  CALIFORNIA_VIEW,
  CameraView,
  SHASTA_MCCLOUD_VIEW,
} from "./cameraPresets"
import {
  BACKGROUND_CIRCLE_ANNOTATIONS,
  BACKGROUND_RIVER_LABELS,
  LocationLabel,
  MapCircleAnnotation,
} from "./locationPresets"

export type SectionId =
  | "Opener"
  | "Background"
  | "HistoricalContext"
  | "GoldRush"
  | "Infrastructure"
  | "ClimateResilience"
  | "Transparency"
  | "Resolution"
  | "Tiers"
  | "Conclusion"

export interface SectionLayerConfig {
  majorRivers?: boolean
  shastaMcCloud?: boolean
  dams?: boolean
  locationLabels?: LocationLabel[]
  circleAnnotations?: MapCircleAnnotation[]
  camera?: CameraView
}

export const getSectionLayerConfig = (
  sectionId: SectionId,
): SectionLayerConfig => {
  const config: SectionLayerConfig = {
    camera:
      sectionId === "HistoricalContext"
        ? SHASTA_MCCLOUD_VIEW
        : CALIFORNIA_VIEW,
  }

  switch (sectionId) {
    case "Background":
      config.locationLabels = BACKGROUND_RIVER_LABELS
      config.circleAnnotations = BACKGROUND_CIRCLE_ANNOTATIONS
      config.majorRivers = true
      break
    case "HistoricalContext":
      config.majorRivers = true
      break
    case "Infrastructure":
      config.dams = true
      break
    default:
      break
  }

  if (sectionId === "HistoricalContext") {
    config.shastaMcCloud = true
  }

  return config
}
