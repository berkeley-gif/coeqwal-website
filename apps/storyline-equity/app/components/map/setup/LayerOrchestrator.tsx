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
import {
  INFRASTRUCTURE_DELTA_PROGRESS,
  INFRASTRUCTURE_DELTA_PIPES_PROGRESS,
  useBackgroundProgress,
  useCircleAnnotations,
  useHistoricalContextProgress,
  useInfrastructureProgress,
  useLocationLabels,
  useMcCloudRiverProgress,
  useActiveSectionStore,
  useMetroRiverPlaygroundMode,
  useRiversProgress,
  useShowRivers,
  useShowShastaMcCloud,
  useShowYubaRiver,
  useYubaRiverProgress,
} from "../../../store"

export default function LayerOrchestrator() {
  const riverProgress = useRiversProgress()
  const showRivers = useShowRivers()
  const showShastaMcCloud = useShowShastaMcCloud()
  const showYubaRiver = useShowYubaRiver()
  const locationLabels = useLocationLabels()
  const circleAnnotations = useCircleAnnotations()
  const backgroundProgress = useBackgroundProgress()
  const mcCloudRiverProgress = useMcCloudRiverProgress()
  const yubaRiverProgress = useYubaRiverProgress()
  const historicalContextProgress = useHistoricalContextProgress()
  const infrastructureProgress = useInfrastructureProgress()
  const activeSection = useActiveSectionStore()
  const metroRiverMode = useMetroRiverPlaygroundMode()
  const showMetroRiverOverlay = activeSection === "Transparency"
  const morphToMetro = metroRiverMode === "metro-map"
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
        morphToMetro={morphToMetro}
      />
      <DeltaNaturalRiverLayer visible={showDeltaNaturalRivers} />
      <MajorRiversLayer visible={showRivers} progress={riverProgress} />
      <LocationLabelLayer
        locationLabels={locationLabels}
        progress={backgroundProgress}
      />
      <MapCircleAnnotationLayer
        annotations={circleAnnotations}
        progress={backgroundProgress}
      />
      <ShastaMcCloudLayer
        visible={showShastaMcCloud}
        progress={mcCloudRiverProgress}
        sectionProgress={historicalContextProgress}
      />
      <YubaRiverLayer visible={showYubaRiver} progress={yubaRiverProgress} />
      <DamChronologyLayer progress={infrastructureProgress} />
      <DeltaCanalLayer visible={showDeltaCanals} />
    </>
  )
}
