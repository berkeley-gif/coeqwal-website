"use client"

import MajorRiversLayer from "../layers/MajorRiverLayer"
import ShastaMcCloudLayer from "../layers/ShastaMcCloudLayer"
import YubaRiverLayer from "../layers/YubaRiverLayer"
import LocationLabelLayer from "../layers/LocationLabelLayer"
import MapCircleAnnotationLayer from "../layers/MapCircleAnnotationLayer"
import DamChronologyLayer from "../layers/DamChronologyLayer"
import PumpingPlantsLayer from "../layers/PumpingPlantsLayer"
import InfrastructureCanalNetworkLayer from "../layers/InfrastructureCanalNetworkLayer"
import GoldRushMiningLayer from "../layers/GoldRushMiningLayer"
import DeltaCanalLayer from "../layers/DeltaCanalLayer"
import MetroRiverMorphOverlay from "../layers/MetroRiverMorphOverlay"
import IndigenousTerritoriesLayer from "../layers/IndigenousTerritoriesLayer"
import CurrentIndigenousTerritoriesLayer from "../layers/CurrentIndigenousTerritoriesLayer"
import IndigenousRiverNetworkLayer from "../layers/IndigenousRiverNetworkLayer"
import IndigenousWaterwayNamesLayer from "../layers/IndigenousWaterwayNamesLayer"
import UserGroupAreaLayer from "../layers/UserGroupAreaLayer"
import { BACKGROUND_CIRCLE_ANNOTATIONS } from "../config/locationPresets"
import {
  INFRASTRUCTURE_DELTA_PROGRESS,
  HISTORICAL_CONTEXT_MCCLOUD_PROGRESS,
  HISTORICAL_CONTEXT_RIVERS_PROGRESS,
  GOLD_RUSH_CURRENT_ALLOTMENTS_PROGRESS,
  GOLD_RUSH_STATEWIDE_PROGRESS,
  useBackgroundProgress,
  useCentralValleyIcon,
  useClimateResilienceProgress,
  useCircleAnnotations,
  useHistoricalContextProgress,
  useGoldRushProgress,
  useInfrastructureProgress,
  useLocationLabels,
  useActiveSectionStore,
  useRiversProgress,
  useShowRivers,
  useShowShastaMcCloud,
  useShowYubaRiver,
  useUrbanIcon,
  useWetlandIcon,
  useShowMapIconStrokes,
  useSalmonIcon,
  useTransparencyProgress,
} from "../../../store"

const CLIMATE_USER_GROUP_ANNOTATIONS = BACKGROUND_CIRCLE_ANNOTATIONS.filter(
  (annotation) => annotation.id !== "small-community",
)

export default function LayerOrchestrator() {
  const riverProgress = useRiversProgress()
  const showRivers = useShowRivers()
  const showShastaMcCloud = useShowShastaMcCloud()
  const showYubaRiver = useShowYubaRiver()
  const locationLabels = useLocationLabels()
  const circleAnnotations = useCircleAnnotations()
  const backgroundProgress = useBackgroundProgress()
  const climateResilienceProgress = useClimateResilienceProgress()
  const centralValleyIcon = useCentralValleyIcon()
  const urbanIcon = useUrbanIcon()
  const wetlandIcon = useWetlandIcon()
  const showMapIconStrokes = useShowMapIconStrokes()
  const salmonIcon = useSalmonIcon()
  const historicalContextProgress = useHistoricalContextProgress()
  const goldRushProgress = useGoldRushProgress()
  const infrastructureProgress = useInfrastructureProgress()
  const transparencyProgress = useTransparencyProgress()
  const activeSection = useActiveSectionStore()
  const revealProgress = (start: number) =>
    Math.min(1, Math.max(0, (backgroundProgress - start) / 0.035))
  const backgroundGroupOpacities = {
    agriculture: revealProgress(0.18) * (1 - revealProgress(0.32)),
    drinking: revealProgress(0.32) * (1 - revealProgress(0.46)),
    ecosystem: revealProgress(0.46),
  }
  const backgroundIconOpacityOverrides = {
    "central-valley-agriculture": backgroundGroupOpacities.agriculture,
    "bay-area-city": backgroundGroupOpacities.drinking,
    "los-angeles-city": backgroundGroupOpacities.drinking,
    "small-community": backgroundGroupOpacities.drinking,
    delta: backgroundGroupOpacities.ecosystem,
    "shasta-salmon": backgroundGroupOpacities.ecosystem,
  }
  const isHistoricalContext = activeSection === "HistoricalContext"
  const historicalTransitionProgress = Math.min(
    1,
    Math.max(
      0,
      (historicalContextProgress - HISTORICAL_CONTEXT_RIVERS_PROGRESS) / 0.06,
    ),
  )
  const showOpeningIndigenousTerritories =
    isHistoricalContext && historicalContextProgress < 0.36
  const showHistoricalRiverNetwork =
    isHistoricalContext &&
    historicalContextProgress >= HISTORICAL_CONTEXT_RIVERS_PROGRESS
  const showIndigenousWaterwayNames =
    isHistoricalContext &&
    historicalContextProgress >= HISTORICAL_CONTEXT_RIVERS_PROGRESS &&
    historicalContextProgress < HISTORICAL_CONTEXT_MCCLOUD_PROGRESS
  const indigenousWaterwayNamesExitOpacity = Math.min(
    1,
    Math.max(
      0,
      (HISTORICAL_CONTEXT_MCCLOUD_PROGRESS - historicalContextProgress) / 0.04,
    ),
  )
  const showGoldRushHistoricalTerritories =
    activeSection === "GoldRush" &&
    goldRushProgress >= GOLD_RUSH_STATEWIDE_PROGRESS
  const showGoldRushCurrentAllotments =
    activeSection === "GoldRush" &&
    goldRushProgress >= GOLD_RUSH_CURRENT_ALLOTMENTS_PROGRESS
  const goldRushAllotmentFade = Math.min(
    1,
    Math.max(
      0,
      (goldRushProgress - GOLD_RUSH_CURRENT_ALLOTMENTS_PROGRESS) / 0.08,
    ),
  )
  const showIndigenousTerritories =
    showOpeningIndigenousTerritories || showGoldRushHistoricalTerritories
  const showGoldRushRiverNetwork =
    activeSection === "GoldRush" &&
    (goldRushProgress < GOLD_RUSH_STATEWIDE_PROGRESS ||
      showGoldRushCurrentAllotments)
  const showConclusionMetroMap = activeSection === "Conclusion"
  // The overlay is an SVG diagram, not a Mapbox layer, so its anti-aliasing
  // never matches the WebGL river/canal layers pixel-for-pixel — cross-fade
  // the two over a short window instead of cutting between them instantly.
  const metroOverlayEntryFade = showConclusionMetroMap
    ? 1
    : activeSection === "Transparency"
      ? Math.min(1, transparencyProgress / 0.03)
      : 0
  const showTransparencyRiverCrossfade =
    activeSection === "Transparency" && metroOverlayEntryFade < 1
  const showPersistentRiverNetwork =
    showGoldRushRiverNetwork ||
    activeSection === "Infrastructure" ||
    activeSection === "ClimateResilience" ||
    showTransparencyRiverCrossfade
  const riverNetworkOpacity = showHistoricalRiverNetwork
    ? historicalTransitionProgress
    : showGoldRushCurrentAllotments
      ? goldRushAllotmentFade
      : showTransparencyRiverCrossfade
        ? 1 - metroOverlayEntryFade
        : 1
  const deemphasizeRivers =
    activeSection === "GoldRush" &&
    goldRushProgress < GOLD_RUSH_STATEWIDE_PROGRESS
  const indigenousTerritoriesEntryOpacity = Math.min(
    1,
    Math.max(0, historicalContextProgress / 0.06),
  )
  const indigenousTerritoriesOpacity = showOpeningIndigenousTerritories
    ? indigenousTerritoriesEntryOpacity * (1 - historicalTransitionProgress)
    : showGoldRushHistoricalTerritories
      ? 1 - goldRushAllotmentFade
      : 0
  const showMetroRiverOverlay =
    activeSection === "Transparency" || showConclusionMetroMap
  const metroMorphProgress = showConclusionMetroMap
    ? 1
    : activeSection === "Transparency"
      ? Math.min(1, Math.max(0, (transparencyProgress - 0.72) / 0.08))
      : 0
  const showClimateUserGroups = activeSection === "ClimateResilience"
  const userGroupIconScaleOverrides = {
    "central-valley-agriculture": 0.8,
    "bay-area-city": 0.8,
    "los-angeles-city": 0.8,
    "small-community": 0.8,
    delta: 0.8,
    "shasta-salmon": 0.8,
  }
  const climateIconFadeProgress = Math.min(
    1,
    Math.max(0, (climateResilienceProgress - 0.46) / 0.08),
  )
  const climateIconOpacityOverrides = {
    "central-valley-agriculture": 1,
    "bay-area-city": 1,
    "los-angeles-city": 1,
    delta: 1 - climateIconFadeProgress * 0.5,
    "shasta-salmon": 1 - climateIconFadeProgress * 0.5,
  }
  const showDeltaWaterwayTransition =
    activeSection === "Infrastructure" &&
    infrastructureProgress >= INFRASTRUCTURE_DELTA_PROGRESS
  const damChronologyProgress = Math.min(
    1,
    Math.max(0, infrastructureProgress / 0.2),
  )
  const statewideInfrastructureProgress = Math.min(
    1,
    Math.max(0, (infrastructureProgress - 0.2) / 0.2),
  )

  return (
    <>
      <MetroRiverMorphOverlay
        visible={showMetroRiverOverlay}
        progress={metroMorphProgress}
        opacity={metroOverlayEntryFade}
      />
      <UserGroupAreaLayer
        visible={activeSection === "Background"}
        opacities={backgroundGroupOpacities}
      />
      <MajorRiversLayer
        visible={
          showRivers &&
          activeSection !== "HistoricalContext" &&
          !showMetroRiverOverlay &&
          !showIndigenousTerritories
        }
        progress={riverProgress}
        deemphasized={deemphasizeRivers}
      />
      <IndigenousRiverNetworkLayer
        visible={showHistoricalRiverNetwork || showPersistentRiverNetwork}
        opacity={riverNetworkOpacity}
        deemphasized={deemphasizeRivers}
        highlightedRiver={
          isHistoricalContext &&
          historicalContextProgress >= HISTORICAL_CONTEXT_MCCLOUD_PROGRESS
            ? "McCloud River"
            : undefined
        }
      />
      <IndigenousWaterwayNamesLayer
        visible={showIndigenousWaterwayNames}
        opacity={
          historicalTransitionProgress * indigenousWaterwayNamesExitOpacity
        }
      />
      <IndigenousTerritoriesLayer
        visible={showIndigenousTerritories}
        opacity={indigenousTerritoriesOpacity}
      />
      {showGoldRushCurrentAllotments ? (
        <CurrentIndigenousTerritoriesLayer
          visible
          opacity={goldRushAllotmentFade}
        />
      ) : null}
      <LocationLabelLayer
        locationLabels={
          isHistoricalContext &&
          historicalContextProgress < HISTORICAL_CONTEXT_MCCLOUD_PROGRESS
            ? []
            : locationLabels
        }
        progress={activeSection === "Background" ? backgroundProgress : 1}
      />
      <MapCircleAnnotationLayer
        annotations={
          // Conclusion's 5 circles are owned end-to-end by
          // ConclusionCircleMorphOverlay (rendered from MapInstance, outside
          // the map's own fade) so they aren't drawn twice.
          showConclusionMetroMap
            ? []
            : showClimateUserGroups
              ? CLIMATE_USER_GROUP_ANNOTATIONS
              : circleAnnotations
        }
        progress={
          showClimateUserGroups || activeSection === "Background"
            ? 1
            : backgroundProgress
        }
        showStrokes={showMapIconStrokes}
        scaleOverrides={
          showClimateUserGroups || activeSection === "Background"
            ? userGroupIconScaleOverrides
            : undefined
        }
        showLabels={
          activeSection !== "Background" &&
          !showClimateUserGroups &&
          activeSection !== "Transparency"
        }
        opacityOverrides={
          showClimateUserGroups
            ? climateIconOpacityOverrides
            : activeSection === "Background"
              ? backgroundIconOpacityOverrides
              : undefined
        }
        iconOverrides={{
          "central-valley-agriculture": centralValleyIcon,
          "bay-area-city": urbanIcon,
          "los-angeles-city": urbanIcon,
          "small-community": "/map-icons/urban_small.svg",
          delta: wetlandIcon,
          "shasta-salmon":
            activeSection === "Background"
              ? "/map-icons/salmon.svg"
              : salmonIcon,
        }}
        iconColorOverrides={{ "small-community": "#f2f0ef" }}
        iconScaleOverrides={{ "small-community": 1.1 }}
      />
      <ShastaMcCloudLayer
        visible={
          (showShastaMcCloud ||
            (isHistoricalContext &&
              historicalContextProgress >=
                HISTORICAL_CONTEXT_MCCLOUD_PROGRESS)) &&
          !showIndigenousTerritories
        }
      />
      <YubaRiverLayer
        visible={
          activeSection === "GoldRush" &&
          goldRushProgress < GOLD_RUSH_STATEWIDE_PROGRESS &&
          showYubaRiver &&
          !showMetroRiverOverlay
        }
        showLabel={activeSection === "GoldRush"}
      />
      <GoldRushMiningLayer
        visible={
          activeSection === "GoldRush" &&
          goldRushProgress < GOLD_RUSH_STATEWIDE_PROGRESS
        }
        progress={goldRushProgress}
      />
      <DamChronologyLayer
        visible={
          activeSection === "Infrastructure" && !showDeltaWaterwayTransition
        }
        progress={damChronologyProgress}
      />
      <PumpingPlantsLayer
        visible={
          activeSection === "Infrastructure" &&
          statewideInfrastructureProgress > 0 &&
          !showDeltaWaterwayTransition
        }
        progress={statewideInfrastructureProgress}
      />
      <InfrastructureCanalNetworkLayer
        visible={
          (activeSection === "Infrastructure" &&
            !showDeltaWaterwayTransition) ||
          activeSection === "ClimateResilience" ||
          showTransparencyRiverCrossfade
        }
        progress={
          activeSection === "ClimateResilience" ||
          showTransparencyRiverCrossfade
            ? 1
            : statewideInfrastructureProgress
        }
        opacity={showTransparencyRiverCrossfade ? 1 - metroOverlayEntryFade : 1}
      />
      <DeltaCanalLayer
        visible={showDeltaWaterwayTransition}
        progress={infrastructureProgress}
      />
    </>
  )
}
