"use client"

import { ReactNode, useEffect, useRef } from "react"
import { Text } from "@repo/ui"
import { Box, Typography } from "@repo/ui/mui"
import { motion } from "@repo/motion"
import { Map, useMap } from "@repo/map"
import "./mapboxControlStyles.css"
import ConclusionCircleMorphOverlay from "../layers/ConclusionCircleMorphOverlay"
import { getDamConstructionLabel } from "../layers/DamChronologyLayer"
import { USER_GROUP_AREA_COLOR } from "../layers/UserGroupAreaLayer"
import { BACKGROUND_CIRCLE_ANNOTATIONS } from "../config/locationPresets"
import {
  CONCLUSION_MAP_FADE_END_PROGRESS,
  CONCLUSION_MORPH_LANDED_PROGRESS,
  useActiveSectionStore,
  useCameraView,
  useCentralValleyIcon,
  useConclusionProgress,
  useConclusionTierIconColors,
  useGoldRushProgress,
  useInfrastructureProgress,
  useSalmonIcon,
  useUrbanIcon,
  useWetlandIcon,
} from "../../../store"
import { CALIFORNIA_VIEW } from "../config/cameraPresets"
import { InfrastructureColor } from "../../helpers/colorPalette"

const goldRushCaptionMarkSx = {
  infrastructure: {
    color: InfrastructureColor,
    fontWeight: 700,
  },
} as const

const visualCopy = {
  Background: {
    title: "California's Major Rivers and Water Users",
    caption: (
      <>
        Yellow areas{" "}
        <Box
          component="span"
          aria-hidden
          sx={{
            display: "inline-block",
            width: "0.75em",
            height: "0.75em",
            ml: 0.25,
            mr: 0.5,
            verticalAlign: "-0.05em",
            backgroundColor: USER_GROUP_AREA_COLOR,
          }}
        />
        outline the current locations of water user groups.
      </>
    ),
  },
  HistoricalContext: {
    title: "Diverse Indigenous Cultures across California",
    caption:
      "For thousands of years, Indigenous people lived in communities with diverse cultures and distinct languages.",
  },
  ClimateResilience: {
    title: "Map title — Climate resilience",
    caption: "Placeholder caption for the Climate Resilience frame.",
  },
  Transparency: {
    title: "Map title — Transparency",
    caption: "Placeholder caption for the Transparency frame.",
  },
  Conclusion: {
    title: "Graphic title — Conclusion",
    caption: "Placeholder caption for the Conclusion frame.",
  },
} as const

const goldRushVisualFrames = [
  {
    start: 0.32,
    end: 0.7,
    title: "Gold Rush Era appropriation of rights on the Yuba River and beyond",
    caption: (
      <Text
        value={{
          segments: [
            { text: "The Yuba River watershed was transformed by " },
            {
              text: "gold mines",
              mark: "infrastructure",
              legend: {
                color: InfrastructureColor,
                shape: "circle",
                position: "after",
              },
            },
            { text: ". " },
            {
              text: "Ditches",
              mark: "infrastructure",
              legend: {
                color: InfrastructureColor,
                shape: "line",
                position: "after",
              },
            },
            { text: " delivered river water to those mines." },
          ],
        }}
        markSx={goldRushCaptionMarkSx}
      />
    ),
  },
  {
    start: 0.7,
    end: 1.01,
    title: "Gold Rush Era appropriation of rights on the Yuba River and beyond",
    caption:
      "The colored parcels on the map of California show present-day Tribal reservations and allotments.",
  },
] as const

function getGoldRushVisualCopy(progress: number) {
  return (
    goldRushVisualFrames.find(
      (frame) => progress >= frame.start && progress < frame.end,
    ) ?? null
  )
}

const infrastructureVisualFrames = [
  {
    start: 0,
    end: 0.5,
    title: "Water Infrastructure into and out of the Central Valley",
    caption: null,
  },
  {
    start: 0.5,
    end: 1.01,
    title: "Transformation of the Sacramento–San Joaquin Delta",
    caption:
      "Major infrastructure development led to more distant and larger exports, and loss of wetland ecosystems.",
  },
] as const

function getInfrastructureVisualCopy(progress: number) {
  const frame =
    infrastructureVisualFrames.find(
      (candidate) => progress >= candidate.start && progress < candidate.end,
    ) ?? null

  if (frame !== infrastructureVisualFrames[0]) return frame

  const damProgress = Math.min(1, Math.max(0, progress / 0.3))

  return {
    ...frame,
    caption: (
      <Text
        value={{
          segments: [
            {
              text: "Dams",
              mark: "infrastructure",
              legend: {
                color: InfrastructureColor,
                shape: "triangle",
                position: "after",
              },
            },
            {
              text: ` created reservoir storage. ${getDamConstructionLabel(damProgress)}. `,
            },
            {
              text: "Pumps",
              mark: "infrastructure",
              legend: {
                color: InfrastructureColor,
                shape: "circle",
                position: "after",
              },
            },
            { text: " and " },
            {
              text: "canals",
              mark: "infrastructure",
              legend: {
                color: InfrastructureColor,
                shape: "line",
                position: "after",
              },
            },
            { text: " diverted water. At first uses were local." },
          ],
        }}
        markSx={goldRushCaptionMarkSx}
      />
    ),
  }
}

const LOAD_MAP_VISUALS = true

// ============================================================================
// Constants
// ============================================================================

export const MAP_BOUNDS: [[number, number], [number, number]] = [
  [-145.0, 20.0],
  [-95.0, 55.0],
]

export const CALIFORNIA_BOUNDS: [[number, number], [number, number]] = [
  [-124.5, 32.5],
  [-114.0, 42.0],
]

interface MapInstanceProps {
  mapboxToken?: string
  children?: ReactNode
}

export default function MapInstance({
  mapboxToken,
  children,
}: MapInstanceProps) {
  const token = mapboxToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const map = useMap()
  const cameraView = useCameraView()
  const activeSection = useActiveSectionStore()
  const conclusionProgress = useConclusionProgress()
  const goldRushProgress = useGoldRushProgress()
  const infrastructureProgress = useInfrastructureProgress()
  const conclusionTierIconColors = useConclusionTierIconColors()
  const centralValleyIcon = useCentralValleyIcon()
  const urbanIcon = useUrbanIcon()
  const wetlandIcon = useWetlandIcon()
  const salmonIcon = useSalmonIcon()
  const conclusionMapOpacity =
    activeSection === "Conclusion"
      ? 1 -
        Math.min(
          1,
          Math.max(
            0,
            (conclusionProgress - CONCLUSION_MORPH_LANDED_PROGRESS) /
              (CONCLUSION_MAP_FADE_END_PROGRESS -
                CONCLUSION_MORPH_LANDED_PROGRESS),
          ),
        )
      : 1
  const copy =
    activeSection === "GoldRush"
      ? getGoldRushVisualCopy(goldRushProgress)
      : activeSection === "Infrastructure"
        ? getInfrastructureVisualCopy(infrastructureProgress)
        : activeSection in visualCopy
          ? visualCopy[activeSection as keyof typeof visualCopy]
          : null
  const prevCameraRef = useRef<string | null>(null)

  useEffect(() => {
    if (!map.mapRef?.current || !cameraView) return
    const cameraKey = [
      cameraView.longitude,
      cameraView.latitude,
      cameraView.zoom,
      cameraView.maxZoom ?? "",
      cameraView.bearing ?? 0,
      cameraView.pitch ?? 0,
      cameraView.bounds?.flat().join(",") ?? "",
      cameraView.boundsPadding
        ? Object.values(cameraView.boundsPadding).join(",")
        : "",
    ].join(":")

    if (prevCameraRef.current === cameraKey) return

    prevCameraRef.current = cameraKey

    if (cameraView.bounds) {
      map.mapRef.current.fitBounds(cameraView.bounds, {
        padding: cameraView.boundsPadding,
        maxZoom: cameraView.maxZoom,
        bearing: cameraView.bearing ?? 0,
        pitch: cameraView.pitch ?? 0,
        duration: 1500,
        easing: (t: number) => t * (2 - t),
      })
      return
    }

    map.mapRef.current.easeTo({
      center: [cameraView.longitude, cameraView.latitude],
      zoom: cameraView.zoom,
      bearing: cameraView.bearing ?? 0,
      pitch: cameraView.pitch ?? 0,
      padding: { left: 0, top: 0, right: 0, bottom: 0 },
      duration: 1500,
      easing: (t: number) => t * (2 - t),
    })
  }, [cameraView, map])

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "45dvw",
        height: "100dvh",
        zIndex: 0,
        pointerEvents: "auto",
        display: "grid",
        gridTemplateRows: "15dvh 85dvh",
      }}
    >
      <Box
        component="header"
        sx={{
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          px: { md: 2, lg: 4.5, xl: 5 },
          pb: 2,
          color: "common.white",
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {copy ? (
          <>
            <Typography component="h2" variant="h6">
              {copy.title}
            </Typography>
            <Typography
              component="p"
              variant="caption"
              sx={{
                mt: 0.5,
                color: "rgba(242, 240, 239, 0.7)",
              }}
            >
              {copy.caption}
            </Typography>
          </>
        ) : null}
      </Box>
      <Box sx={{ position: "relative", minHeight: 0, overflow: "hidden" }}>
        <Box
          component={motion.div}
          animate={{ opacity: conclusionMapOpacity }}
          transition={{ duration: 0.08, ease: "linear" }}
          sx={{ position: "absolute", inset: 0 }}
        >
          {LOAD_MAP_VISUALS ? (
            <Map
              mapboxToken={token}
              mapStyle={"mapbox://styles/coeqwal/cmsizk292001101sr3mby7byk"}
              initialViewState={CALIFORNIA_VIEW}
              maxBounds={MAP_BOUNDS}
              style={{ width: "100%", height: "100%" }}
              interactive={false}
              navigationControl={false}
              dragPan={false}
            >
              {children}
            </Map>
          ) : null}
        </Box>
        {/* Sibling to the fading map above, not a child of it — these circles
            keep animating (morph, then bloom) after the map has faded away,
            only fading themselves once FloatingBubbles is ready to take
            over. See the CONCLUSION_* staging comment in store.ts. */}
        <ConclusionCircleMorphOverlay
          visible={activeSection === "Conclusion"}
          progress={conclusionProgress}
          annotations={BACKGROUND_CIRCLE_ANNOTATIONS}
          iconColors={conclusionTierIconColors ?? {}}
          icons={{
            "central-valley-agriculture": centralValleyIcon,
            "bay-area-city": urbanIcon,
            "los-angeles-city": urbanIcon,
            delta: wetlandIcon,
            "shasta-salmon": salmonIcon,
          }}
        />
      </Box>
    </Box>
  )
}
