"use client"

import { AnimatePresence } from "@repo/motion"
import {
  appActions,
  useActiveSectionStore,
  useDeltaBoundaryProgress,
  useRiversProgress,
  useSelectedYearVariability,
  useShowCity,
  useShowDeltaBoundary,
  useShowDrinking,
  useShowGoldRush,
  useShowImpact,
  useShowPrecipitation,
  useShowRivers,
  useShowSnowpack,
  useShowTransformation,
  useShowValleyBoundary,
  useShowVariability,
  useShowWetland,
  useValleyBoundaryProgress,
} from "../../../store"
import PrecipitationLayer from "../layers/PrecipitationLayer"
import SnowpackLayer from "../layers/SnowpackLayer"
import LocationLabelLayer from "../layers/LocationLabelLayer"
import { useEffect, useMemo, useState } from "react"
import { LocationLabel } from "../config/locationPresets"
import * as LocationCollection from "../config/locationPresets"
import CircleLayer from "../layers/CircleLayer"
import { useFetchData } from "../../../hooks/useFetchData"
import ValleyBoundaryLayer from "../layers/ValleyBoundaryLayer"
import DeltaBoundaryLayer from "../layers/DeltaBoundaryLayer"
import DeltaWetlandLayer from "../layers/DeltaWetlandLayer"
import MajorRiversLayer from "../layers/MajorRiverLayer"
import DistantRiversLayer from "../layers/DistantRiverLayer"
import CanalLayer from "../layers/CanalLayer"
import DeltaCanalLayer from "../layers/DeltaCanalLayer"
import { DamLayer } from "../layers/DamLayer"
import { DAMS } from "../../helpers/data/dams"
import CityBoundaryLayer from "../layers/CityBoundaryLayer"

export type TooltipType = {
  id: string
  name: string
  latitude: number
  longitude: number
  year?: string
  captions?: string[]
  source?: string
  images?: string[]
  anchor?: string
  rotation?: number
}

//TODO: show all the four circles, and allow clicking on the circles or bar
export default function LayerOrchestrator() {
  const showPrecipitation = useShowPrecipitation()
  const showSnowpack = useShowSnowpack()
  const showVariability = useShowVariability()
  const showRivers = useShowRivers()
  const showValleyBoundary = useShowValleyBoundary()
  const showWetland = useShowWetland()
  const showDeltaBoundary = useShowDeltaBoundary()
  const showGoldRush = useShowGoldRush()
  const showDistantRivers = useShowDrinking()
  const showTransformation = useShowTransformation()
  const showCity = useShowCity()
  const showImpact = useShowImpact()

  const riverProgress = useRiversProgress()
  const valleyProgress = useValleyBoundaryProgress()
  const deltaProgress = useDeltaBoundaryProgress()

  const activeSection = useActiveSectionStore()

  const selectedYear = useSelectedYearVariability()
  const [variabilityMarkers, setVariabilityMarkers] = useState<TooltipType[]>(
    [],
  )
  const [goldrushMarkers, setGoldRushMarkers] = useState<TooltipType[]>([])
  const [impactMarkers, setImpactMarkers] = useState<
    Record<string, TooltipType[]>
  >({})

  useFetchData<Record<string, TooltipType[]>>(
    "/data/variability_marker.json",
    (data) => {
      setVariabilityMarkers(data.data as TooltipType[])
    },
  )

  useFetchData<Record<string, TooltipType[]>>(
    "/data/goldrush_marker.json",
    (data) => {
      setGoldRushMarkers(data.data as TooltipType[])
    },
  )

  useFetchData<Record<string, TooltipType[]>>(
    "/data/impact_marker.json",
    (data) => {
      setImpactMarkers(data)
    },
  )

  useEffect(() => {
    if (!selectedYear) return
    const marker = variabilityMarkers.find((d) => d.year == selectedYear)
    if (marker) {
      appActions.setTooltipContent(marker)
    }
  }, [selectedYear, variabilityMarkers])

  const locationLabels: LocationLabel[] = useMemo(() => {
    let result: LocationLabel[] = []
    switch (activeSection) {
      case "snowpack":
        result = [LocationCollection.SierraNevadaMountains]
        break
      case "major-river":
        result = [
          LocationCollection.SacramentoRiver,
          LocationCollection.SanJoaquinRiver,
          LocationCollection.SierraNevadaMountains,
        ]
        break
      case "central-valley":
        result = [LocationCollection.CentralValley]
        break
      case "delta-wetland":
        result = [LocationCollection.AncientDeltaWetlands]
        break
      case "historical-delta":
        result = [LocationCollection.DeltaLegalBoundary]
        break
      case "goldrush":
        result = LocationCollection.GOLDRUSH_LABELS
        break
      case "drinking":
        result = LocationCollection.DRINKING_LABELS
        break
      case "city":
        result = [LocationCollection.SoCal, LocationCollection.NorCal]
        break
      case "impact-salmon":
        result = [LocationCollection.ShastaDam]
        break
      case "impact-delta":
        result = [LocationCollection.SacramentoDelta]
        break
      default:
        break
    }
    return result
  }, [activeSection])

  const impactCircle: TooltipType[] = useMemo(() => {
    let result: TooltipType[] = []
    switch (activeSection) {
      case "impact-salmon":
        result = impactMarkers.salmon as TooltipType[]
        break
      case "impact-delta":
        result = impactMarkers.delta as TooltipType[]
        break
      case "impact-water":
        result = impactMarkers.drinkingwater as TooltipType[]
        break
      case "impact-climate":
        result = impactMarkers.climate as TooltipType[]
        break
      default:
        break
    }
    return result
  }, [activeSection, impactMarkers])

  return (
    <>
      <PrecipitationLayer visible={showPrecipitation} />
      <SnowpackLayer visible={showSnowpack} />

      <MajorRiversLayer visible={showRivers} progress={riverProgress} />
      <ValleyBoundaryLayer
        visible={showValleyBoundary}
        progress={valleyProgress}
      />
      <DeltaWetlandLayer visible={showWetland} />

      <DeltaBoundaryLayer
        visible={showDeltaBoundary}
        progress={deltaProgress}
      />

      <DistantRiversLayer visible={showDistantRivers} />
      <CanalLayer visible={showDistantRivers || showTransformation} />
      <DeltaCanalLayer visible={showTransformation} />

      <CityBoundaryLayer visible={showCity} />

      <AnimatePresence>
        <LocationLabelLayer key={0} locationLabels={locationLabels} />
        {showVariability && (
          <CircleLayer key={1} markers={variabilityMarkers ?? []} />
        )}
        {showGoldRush && (
          <CircleLayer key={2} markers={goldrushMarkers ?? []} />
        )}
        {showTransformation && <DamLayer key={3} markers={DAMS} />}
        {showImpact && <CircleLayer key={4} markers={impactCircle ?? []} />}
      </AnimatePresence>
    </>
  )
}
