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
import { themeValues } from "@repo/ui/themes/theme"
import {
  INFRASTRUCTURE_DELTA_PROGRESS,
  HISTORICAL_CONTEXT_CLOSING_PROGRESS,
  HISTORICAL_CONTEXT_CURRENT_TERRITORIES_PROGRESS,
  HISTORICAL_CONTEXT_MCCLOUD_PROGRESS,
  HISTORICAL_CONTEXT_RIVERS_PROGRESS,
  useBackgroundProgress,
  useCentralValleyIcon,
  useClimateResilienceProgress,
  useConclusionProgress,
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

export default function LayerOrchestrator() {
  const riverProgress = useRiversProgress()
  const showRivers = useShowRivers()
  const showShastaMcCloud = useShowShastaMcCloud()
  const showYubaRiver = useShowYubaRiver()
  const locationLabels = useLocationLabels()
  const circleAnnotations = useCircleAnnotations()
  const backgroundProgress = useBackgroundProgress()
  const climateResilienceProgress = useClimateResilienceProgress()
  const conclusionProgress = useConclusionProgress()
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
  const isHistoricalClosing =
    isHistoricalContext &&
    historicalContextProgress >= HISTORICAL_CONTEXT_CLOSING_PROGRESS
  const showOpeningIndigenousTerritories =
    isHistoricalContext && historicalContextProgress < 0.36
  const showHistoricalRiverNetwork =
    isHistoricalContext &&
    historicalContextProgress >= HISTORICAL_CONTEXT_RIVERS_PROGRESS &&
    historicalContextProgress < HISTORICAL_CONTEXT_CLOSING_PROGRESS
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
  const showCurrentIndigenousTerritories =
    isHistoricalContext &&
    historicalContextProgress >= HISTORICAL_CONTEXT_CURRENT_TERRITORIES_PROGRESS
  const currentIndigenousTerritoriesOpacity = Math.min(
    1,
    Math.max(
      0,
      (historicalContextProgress -
        HISTORICAL_CONTEXT_CURRENT_TERRITORIES_PROGRESS) /
        0.06,
    ),
  )
  const showClosingHistoricalTerritories =
    isHistoricalClosing && currentIndigenousTerritoriesOpacity < 1
  const showIndigenousTerritories =
    showOpeningIndigenousTerritories || showClosingHistoricalTerritories
  const showPersistentRiverNetwork =
    activeSection === "GoldRush" ||
    activeSection === "Infrastructure" ||
    activeSection === "ClimateResilience"
  const deemphasizeRivers = activeSection === "GoldRush"
  const indigenousTerritoriesEntryOpacity = Math.min(
    1,
    Math.max(0, historicalContextProgress / 0.06),
  )
  const indigenousTerritoriesOpacity = showOpeningIndigenousTerritories
    ? indigenousTerritoriesEntryOpacity * (1 - historicalTransitionProgress)
    : showClosingHistoricalTerritories
      ? 1 - currentIndigenousTerritoriesOpacity
      : 0
  const showConclusionMetroMap = activeSection === "Conclusion"
  const showMetroRiverOverlay =
    activeSection === "Transparency" || showConclusionMetroMap
  const metroMorphProgress = showConclusionMetroMap
    ? 1
    : activeSection === "Transparency"
      ? Math.min(1, Math.max(0, (transparencyProgress - 0.72) / 0.08))
      : 0
  const showTransparencyUserGroups =
    activeSection === "Transparency" && transparencyProgress >= 0.25
  const showClimateUserGroups = activeSection === "ClimateResilience"
  const userGroupIconScaleOverrides = {
    "central-valley-agriculture": 0.8,
    "bay-area-city": 0.8,
    "los-angeles-city": 0.8,
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
  const transparencyUserFadeProgress =
    activeSection === "Transparency"
      ? Math.min(1, Math.max(0, (transparencyProgress - 0.76) / 0.12))
      : 0
  const transparencyOpacityOverrides = {
    "central-valley-agriculture": 1 - transparencyUserFadeProgress,
    "bay-area-city": 1 - transparencyUserFadeProgress,
    "los-angeles-city": 1,
    delta: 1 - transparencyUserFadeProgress,
    "shasta-salmon": 1 - transparencyUserFadeProgress,
  }
  const conclusionColorProgress = Math.min(
    1,
    Math.max(0, (conclusionProgress - 0.08) / 0.24),
  )
  const tierIconColor = (tierColor: string) =>
    `color-mix(in srgb, #ffffff ${(1 - conclusionColorProgress) * 100}%, ${tierColor})`
  const conclusionTierIconColors = showConclusionMetroMap
    ? {
        "central-valley-agriculture": tierIconColor(
          themeValues.palette.tiers.tier2,
        ),
        "bay-area-city": tierIconColor(themeValues.palette.tiers.tier1),
        "los-angeles-city": tierIconColor(themeValues.palette.tiers.tier1),
        delta: tierIconColor(themeValues.palette.tiers.tier3),
        "shasta-salmon": tierIconColor(themeValues.palette.tiers.tier4),
      }
    : undefined
  const showDeltaWaterwayTransition =
    activeSection === "Infrastructure" &&
    infrastructureProgress >= INFRASTRUCTURE_DELTA_PROGRESS

  return (
    <>
      <MetroRiverMorphOverlay
        visible={showMetroRiverOverlay}
        progress={metroMorphProgress}
      />
      <UserGroupAreaLayer
        visible={activeSection === "Background"}
        opacities={backgroundGroupOpacities}
      />
      <MajorRiversLayer
        visible={
          showRivers &&
          !showMetroRiverOverlay &&
          !showIndigenousTerritories &&
          !showCurrentIndigenousTerritories
        }
        progress={riverProgress}
        deemphasized={deemphasizeRivers}
      />
      <IndigenousRiverNetworkLayer
        visible={showHistoricalRiverNetwork || showPersistentRiverNetwork}
        opacity={showHistoricalRiverNetwork ? historicalTransitionProgress : 1}
        deemphasized={deemphasizeRivers}
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
      <CurrentIndigenousTerritoriesLayer
        visible={showCurrentIndigenousTerritories}
        opacity={currentIndigenousTerritoriesOpacity}
      />
      <LocationLabelLayer
        locationLabels={
          isHistoricalContext &&
          (historicalContextProgress < HISTORICAL_CONTEXT_MCCLOUD_PROGRESS ||
            isHistoricalClosing)
            ? []
            : locationLabels
        }
        progress={activeSection === "Background" ? backgroundProgress : 1}
      />
      <MapCircleAnnotationLayer
        annotations={
          showTransparencyUserGroups ||
          showClimateUserGroups ||
          showConclusionMetroMap
            ? BACKGROUND_CIRCLE_ANNOTATIONS
            : circleAnnotations
        }
        progress={
          showTransparencyUserGroups ||
          showClimateUserGroups ||
          showConclusionMetroMap ||
          activeSection === "Background"
            ? 1
            : backgroundProgress
        }
        showStrokes={showMapIconStrokes}
        scaleOverrides={
          showTransparencyUserGroups ||
          showClimateUserGroups ||
          showConclusionMetroMap ||
          activeSection === "Background"
            ? userGroupIconScaleOverrides
            : undefined
        }
        showLabels={
          activeSection !== "Background" &&
          !showClimateUserGroups &&
          activeSection !== "Transparency" &&
          !showConclusionMetroMap
        }
        opacityOverrides={
          showTransparencyUserGroups
            ? transparencyOpacityOverrides
            : showClimateUserGroups
              ? climateIconOpacityOverrides
              : activeSection === "Background"
                ? backgroundIconOpacityOverrides
                : undefined
        }
        iconOverrides={{
          "central-valley-agriculture": centralValleyIcon,
          "bay-area-city": urbanIcon,
          "los-angeles-city": urbanIcon,
          delta: wetlandIcon,
          "shasta-salmon":
            activeSection === "Background"
              ? "/map-icons/salmon.svg"
              : salmonIcon,
        }}
        iconColorOverrides={conclusionTierIconColors}
      />
      <ShastaMcCloudLayer
        visible={
          (showShastaMcCloud ||
            (isHistoricalContext &&
              historicalContextProgress >=
                HISTORICAL_CONTEXT_MCCLOUD_PROGRESS)) &&
          !isHistoricalClosing &&
          !showIndigenousTerritories
        }
        progress={1}
        sectionProgress={historicalContextProgress}
        showMigration={false}
        migrationOnly={false}
        showRiver
        salmonIconSrc={salmonIcon}
      />
      <YubaRiverLayer
        visible={showYubaRiver && !showMetroRiverOverlay}
        showLabel={activeSection === "GoldRush"}
      />
      <GoldRushMiningLayer
        visible={activeSection === "GoldRush"}
        progress={goldRushProgress}
      />
      <DamChronologyLayer progress={infrastructureProgress} />
      <PumpingPlantsLayer
        visible={
          activeSection === "Infrastructure" && !showDeltaWaterwayTransition
        }
      />
      <InfrastructureCanalNetworkLayer
        visible={
          (activeSection === "Infrastructure" &&
            !showDeltaWaterwayTransition) ||
          activeSection === "ClimateResilience"
        }
      />
      <DeltaCanalLayer
        visible={showDeltaWaterwayTransition}
        progress={infrastructureProgress}
      />
    </>
  )
}
