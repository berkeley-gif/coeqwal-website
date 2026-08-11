"use client"

import MajorRiversLayer from "../layers/MajorRiverLayer"
import ShastaMcCloudLayer from "../layers/ShastaMcCloudLayer"
import YubaRiverLayer from "../layers/YubaRiverLayer"
import LocationLabelLayer from "../layers/LocationLabelLayer"
import MapCircleAnnotationLayer from "../layers/MapCircleAnnotationLayer"
import DamChronologyLayer from "../layers/DamChronologyLayer"
import DeltaCanalLayer from "../layers/DeltaCanalLayer"
import DeltaNaturalRiverLayer from "../layers/DeltaNaturalRiverLayer"
import MetroRiverMorphOverlay from "../layers/MetroRiverMorphOverlay"
import { BACKGROUND_CIRCLE_ANNOTATIONS } from "../config/locationPresets"
import {
  INFRASTRUCTURE_DELTA_PROGRESS,
  INFRASTRUCTURE_DELTA_PIPES_PROGRESS,
  useBackgroundProgress,
  useCentralValleyIcon,
  useCircleAnnotations,
  useHistoricalContextProgress,
  useInfrastructureProgress,
  useLocationLabels,
  useActiveSectionStore,
  useRiversProgress,
  useShowRivers,
  useShowShastaMcCloud,
  useShowYubaRiver,
  useYubaRiverProgress,
  useUrbanIcon,
  useWetlandIcon,
  useShowMapIconStrokes,
  useSalmonIcon,
  useTransparencyProgress,
} from "../../../store"

export default function LayerOrchestrator() {
  const riverProgress = useRiversProgress()
  const showRivers = useShowRivers()
  const showShastaMcCloud = useShowShastaMcCloud()
  const showYubaRiver = useShowYubaRiver()
  const locationLabels = useLocationLabels()
  const circleAnnotations = useCircleAnnotations()
  const backgroundProgress = useBackgroundProgress()
  const centralValleyIcon = useCentralValleyIcon()
  const urbanIcon = useUrbanIcon()
  const wetlandIcon = useWetlandIcon()
  const showMapIconStrokes = useShowMapIconStrokes()
  const salmonIcon = useSalmonIcon()
  const yubaRiverProgress = useYubaRiverProgress()
  const historicalContextProgress = useHistoricalContextProgress()
  const infrastructureProgress = useInfrastructureProgress()
  const transparencyProgress = useTransparencyProgress()
  const activeSection = useActiveSectionStore()
  const hideBackgroundIcons =
    activeSection === "Background" && backgroundProgress >= 0.72
  const showBackgroundMigration =
    activeSection === "Background" && backgroundProgress >= 0.76
  const backgroundMigrationProgress = showBackgroundMigration
    ? 0.12 + Math.min(1, (backgroundProgress - 0.76) / 0.24) * 0.78
    : 0
  const showBackgroundMcCloudRiver =
    activeSection === "Background" && backgroundProgress >= 0.84
  const backgroundMcCloudRiverProgress = showBackgroundMcCloudRiver
    ? Math.min(1, Math.max(0, (backgroundProgress - 0.86) / 0.1))
    : 0
  const showMetroRiverOverlay = activeSection === "Transparency"
  const metroMorphProgress =
    activeSection === "Transparency"
      ? Math.min(1, Math.max(0, transparencyProgress / 0.21))
      : 0
  const showTransparencyUserGroups =
    activeSection === "Transparency" && transparencyProgress >= 0.25
  const inequityScaleProgress =
    activeSection === "Transparency"
      ? Math.min(1, Math.max(0, (transparencyProgress - 0.5) / 0.12))
      : 0
  const transparencyScaleOverrides = {
    "central-valley-agriculture": 1 + 0.38 * inequityScaleProgress,
    "bay-area-city": 1 + 0.3 * inequityScaleProgress,
    "los-angeles-city": 1 + 0.3 * inequityScaleProgress,
    delta: 1 - 0.32 * inequityScaleProgress,
    "shasta-salmon": 1 - 0.32 * inequityScaleProgress,
  }
  const showDeltaCanals =
    activeSection === "Infrastructure" &&
    infrastructureProgress >= INFRASTRUCTURE_DELTA_PIPES_PROGRESS
  const showDeltaNaturalRivers =
    activeSection === "Infrastructure" &&
    infrastructureProgress >= INFRASTRUCTURE_DELTA_PROGRESS &&
    infrastructureProgress < INFRASTRUCTURE_DELTA_PIPES_PROGRESS

  return (
    <>
      <MetroRiverMorphOverlay
        visible={showMetroRiverOverlay}
        progress={metroMorphProgress}
      />
      <DeltaNaturalRiverLayer visible={showDeltaNaturalRivers} />
      <MajorRiversLayer
        visible={showRivers && !showMetroRiverOverlay}
        progress={riverProgress}
      />
      <LocationLabelLayer
        locationLabels={locationLabels}
        progress={activeSection === "Background" ? backgroundProgress : 1}
      />
      <MapCircleAnnotationLayer
        annotations={
          showTransparencyUserGroups
            ? BACKGROUND_CIRCLE_ANNOTATIONS
            : hideBackgroundIcons
              ? []
              : circleAnnotations
        }
        progress={showTransparencyUserGroups ? 1 : backgroundProgress}
        showStrokes={showMapIconStrokes}
        scaleOverrides={
          showTransparencyUserGroups ? transparencyScaleOverrides : undefined
        }
        iconOverrides={{
          "central-valley-agriculture": centralValleyIcon,
          "bay-area-city": urbanIcon,
          "los-angeles-city": urbanIcon,
          delta: wetlandIcon,
          "shasta-salmon": salmonIcon,
        }}
      />
      <ShastaMcCloudLayer
        visible={showShastaMcCloud || showBackgroundMigration}
        progress={showBackgroundMigration ? backgroundMcCloudRiverProgress : 1}
        sectionProgress={
          showBackgroundMigration
            ? backgroundMigrationProgress
            : historicalContextProgress
        }
        showMigration={showBackgroundMigration}
        migrationOnly={showBackgroundMigration}
        showRiver={!showBackgroundMigration || showBackgroundMcCloudRiver}
        salmonIconSrc={salmonIcon}
      />
      <YubaRiverLayer
        visible={showYubaRiver && !showMetroRiverOverlay}
        progress={yubaRiverProgress}
      />
      <DamChronologyLayer progress={infrastructureProgress} />
      <DeltaCanalLayer visible={showDeltaCanals} />
    </>
  )
}
