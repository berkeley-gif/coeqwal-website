"use client"

import MajorRiversLayer from "../layers/MajorRiverLayer"
import ShastaMcCloudLayer from "../layers/ShastaMcCloudLayer"
import LocationLabelLayer from "../layers/LocationLabelLayer"
import MapCircleAnnotationLayer from "../layers/MapCircleAnnotationLayer"
import DamChronologyLayer from "../layers/DamChronologyLayer"
import {
  useBackgroundProgress,
  useCircleAnnotations,
  useHistoricalContextProgress,
  useInfrastructureProgress,
  useLocationLabels,
  useMcCloudRiverProgress,
  useRiversProgress,
  useShowDams,
  useShowRivers,
  useShowShastaMcCloud,
} from "../../../store"

export default function LayerOrchestrator() {
  const riverProgress = useRiversProgress()
  const showRivers = useShowRivers()
  const showShastaMcCloud = useShowShastaMcCloud()
  const showDams = useShowDams()
  const locationLabels = useLocationLabels()
  const circleAnnotations = useCircleAnnotations()
  const backgroundProgress = useBackgroundProgress()
  const mcCloudRiverProgress = useMcCloudRiverProgress()
  const historicalContextProgress = useHistoricalContextProgress()
  const infrastructureProgress = useInfrastructureProgress()

  return (
    <>
      <MajorRiversLayer
        visible={showRivers}
        progress={riverProgress}
        sectionProgress={backgroundProgress}
      />
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
      <DamChronologyLayer
        visible={showDams}
        progress={infrastructureProgress}
      />
    </>
  )
}
