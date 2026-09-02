"use client"

import {
  ScrollElement,
  StickyScrollSection,
  useScrollProgress,
} from "@repo/scrollytelling"
import { motion, useTransform, type MotionValue } from "@repo/motion"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack, Typography } from "@repo/ui/mui"
import { themeValues } from "@repo/ui/themes/theme"
import { hierarchy, scaleBand, scaleLinear, treemap } from "d3"
import { useMemo } from "react"
import cwsDeliveryMedians from "../../public/data/community-water-systems/node-delivery-medians.json"
import cwsTiers from "../../public/data/community-water-systems/tiers.json"
import agricultureTiers from "../../public/data/agriculture/tiers.json"
import s0035TierAssignments from "../../public/data/s0035-tier-assignments.json"
import { FreshWaterColor } from "./helpers/colorPalette"
import { useUrbanIcon } from "../store"

const optimalTierColor = themeValues.palette.tiers.tier1
const atRiskTierColor = themeValues.palette.tiers.tier3
const tierColors: Record<number, string> = {
  1: themeValues.palette.tiers.tier1,
  2: themeValues.palette.tiers.tier2,
  3: themeValues.palette.tiers.tier3,
  4: themeValues.palette.tiers.tier4,
}
const tierNames: Record<number, string> = {
  1: "Optimal",
  2: "Acceptable",
  3: "At-risk",
  4: "Critical",
}
const visualizationCopy = {
  focusTreemap: {
    title: "Visualization title 1",
    caption: "Placeholder caption for visualization frame 1.",
  },
  annualDelivery: {
    title: "Visualization title 2",
    caption: "Placeholder caption for visualization frame 2.",
  },
  demandMet: {
    title: "Visualization title 3",
    caption: "Placeholder caption for visualization frame 3.",
  },
  distribution: {
    title: "Visualization title 4",
    caption: "Placeholder caption for visualization frame 4.",
  },
  optimal: {
    title: "Visualization title 5",
    caption: "Placeholder caption for visualization frame 5.",
  },
  atRisk: {
    title: "Visualization title 6",
    caption: "Placeholder caption for visualization frame 6.",
  },
  tierTreemap: {
    title: "Visualization title 7",
    caption: "Placeholder caption for visualization frame 7.",
  },
  cwsTierRows: {
    title: "Visualization title 8",
    caption: "Placeholder caption for visualization frame 8.",
  },
  crossGroupComparison: {
    title: "Visualization title 9",
    caption: "Placeholder caption for visualization frame 9.",
  },
  scenarioComparison: {
    title: "Visualization title 10",
    caption: "Placeholder caption for visualization frame 10.",
  },
} as const
const LOAD_RESOLUTION_VISUALS = true
const titleBandColor = "#6b4f8a"
const narrativeMarkSx = {
  strong: { fontWeight: 700 },
  optimalName: { color: optimalTierColor, fontWeight: 700 },
  optimalDefinition: { color: optimalTierColor },
  atRiskName: { color: atRiskTierColor, fontWeight: 700 },
  atRiskDefinition: { color: atRiskTierColor },
  tier1Name: { color: tierColors[1], fontWeight: 700 },
  tier2Name: { color: tierColors[2], fontWeight: 700 },
  tier3Name: { color: tierColors[3], fontWeight: 700 },
  tier4Name: { color: tierColors[4], fontWeight: 700 },
}

const storyFrames = [
  {
    title: "How COEQWAL addresses equity",
    paragraphs: [
      [
        {
          text: "COEQWAL cannot undo historical inequities. It can, however, make their present-day impacts visible and support more informed and equitable decisions moving forward.",
        },
        {
          text: "Trade-offs are unavoidable in water management. But their impacts do not have to fall hardest on the same groups.",
        },
      ],
      [
        {
          text: "COEQWAL compares different water management strategies, called scenarios, to show how different choices affect communities, water users, and ecosystems.",
        },
        {
          text: "It also tests these strategies across a wide range of hydrologic conditions, helping us understand how outcomes may change as the climate becomes more stressed.",
        },
        {
          text: "To see how this works, let's focus on community water systems.",
        },
      ],
    ],
  },
  {
    paragraphs: [
      [
        {
          text: "Each COEQWAL scenario simulates water deliveries across 100 years of varying hydrologic conditions.",
        },
        {
          segments: [
            { text: "For each year, COEQWAL compares annual surface water " },
            { text: "delivery", mark: "strong" },
            { text: " to drinking-water " },
            { text: "demand", mark: "strong" },
            { text: "." },
          ],
        },
        {
          text: "This shows what percentage of drinking water demand is met by modeled surface water deliveries each year.",
        },
        {
          text: "A shortfall does not necessarily mean a community experiences a drinking water shortage. COEQWAL evaluates surface water deliveries from major water projects, not a community’s complete water supply, which may also include groundwater, local surface water, or stored water.",
        },
      ],
    ],
  },
  {
    title: "From simulating to interpreting water allocation",
    paragraphs: [
      [
        {
          text: "COEQWAL turns these modeled outcomes into measures of how well water needs are being met.",
        },
        {
          segments: [
            { text: "Researchers define " },
            { text: "thresholds", mark: "strong" },
            {
              text: " that reflect both the reliability and severity of water shortfalls for communities and ecosystems.",
            },
          ],
        },
        {
          text: "For community water systems, these thresholds consider how often modeled surface-water deliveries meet demand and how severe shortfalls become when they do not.",
        },
      ],
      [
        {
          segments: [
            { text: "For example, an " },
            { text: "Optimal", mark: "optimalName" },
            { text: " community water outcome means:" },
          ],
        },
        {
          segments: [
            {
              text: "More than 90% of demand is met by surface water deliveries in at least 90 years of the 100 simulated years",
              mark: "optimalDefinition",
            },
            { text: "; and" },
          ],
        },
        {
          segments: [
            {
              text: "Deliveries never fall below 70% of demand.",
              mark: "optimalDefinition",
            },
          ],
        },
        {
          text: "This community does not meet those conditions under this scenario.",
        },
      ],
    ],
  },
  {
    title: [
      { text: "Interpreting water allocation through " },
      { text: "outcome levels", mark: "strong" },
    ],
    paragraphs: [
      [
        {
          segments: [
            { text: "In this scenario, the community is considered " },
            { text: "At-risk", mark: "atRiskName" },
            { text: ", meaning that " },
            {
              text: "modeled surface-water deliveries fall short of demand in a significant number of simulated years",
              mark: "atRiskDefinition",
            },
            { text: "." },
          ],
        },
      ],
      [
        {
          segments: [
            { text: "COEQWAL uses " },
            { text: "four performance categories", mark: "strong" },
            { text: ": " },
            { text: "Optimal", mark: "tier1Name" },
            { text: ", " },
            { text: "Acceptable", mark: "tier2Name" },
            { text: ", " },
            { text: "At-risk", mark: "tier3Name" },
            { text: ", and " },
            { text: "Critical", mark: "tier4Name" },
            { text: "." },
          ],
        },
        {
          text: "Together, these outcome levels create a shared scale for interpreting how well needs are being met.",
        },
      ],
    ],
  },
  {
    title: "A common yardstick for understanding equity",
    paragraphs: [
      [
        {
          text: "Communities and ecosystems experience water decisions in different ways.",
        },
        {
          text: "Their outcomes are also measured differently, through community surface water deliveries, agricultural production, river flows, salmon abundance, salinity, reservoir storage, and more.",
        },
        {
          text: "That makes them difficult to compare directly.",
        },
      ],
      [
        {
          text: "COEQWAL uses a common framework to interpret these diverse outcomes, allowing very different needs and conditions to be viewed on the same performance scale.",
        },
      ],
    ],
  },
  {
    paragraphs: [
      [
        {
          text: "The same approach can be applied across water users and ecosystems.",
        },
        {
          text: "By placing different outcomes on a shared performance scale, COEQWAL can bring them together into a system-wide view.",
        },
        {
          text: "Comparing this view across management strategies reveals where performance improves or declines, who benefits, who faces greater risk, and how those patterns shift under different choices.",
        },
      ],
    ],
  },
] as const

const frameCount = storyFrames.length
const treemapBounds = { x: 50, y: 70, width: 620, height: 660 }
const focusCwsAnnualDeliveryTaf = [
  8.711, 8.472, 8.692, 8.472, 8.352, 8.698, 8.784, 8.419, 8.278, 7.97, 7.947,
  1.831, 3.013, 6.306, 7.196, 8.472, 7.627, 8.479, 8.752, 8.698, 8.698, 8.784,
  8.472, 8.472, 8.559, 8.458, 8.827, 8.638, 6.693, 8.216, 8.962, 8.64, 8.779,
  8.127, 8.642, 8.559, 8.848, 8.731, 8.466, 8.472, 8.545, 8.698, 8.419, 8.698,
  8.545, 8.848, 8.784, 8.698, 8.778, 8.698, 8.553, 8.559, 8.848, 8.698, 8.644,
  8.466, 8.698, 8.559, 8.698, 8.466, 8.848, 8.848, 8.698, 8.466, 8.698, 8.466,
  8.373, 8.464, 8.316, 8.425, 5.519, 7.549, 8.421, 8.848, 8.784, 8.784, 8.848,
  8.698, 8.784, 8.466, 8.466, 8.85, 8.784, 8.698, 8.698, 8.466, 8.389, 8.472,
  8.698, 8.848, 8.491, 8.424, 8.515, 8.233, 8.723, 8.672, 8.77, 8.698, 8.426,
  8.562,
]
const focusCws = cwsDeliveryMedians.locations.find(
  (location) => location.locationId === "25_PU",
)

type CwsTreemapDatum = {
  locationId: string
  value: number
  children?: CwsTreemapDatum[]
}

type TileLayout = { x: number; y: number; width: number; height: number }
type ScenarioTierDatum = { id: string; tierLevel: number }
type ScenarioTileLayout = TileLayout & { tierLevel: number }

const comparisonTileSize = 14
const comparisonTileGap = 3
const continuousBinWidth = 0.2

function toScenarioTierData(
  locations: readonly { location_id: string; tier_level: number }[] | undefined,
): ScenarioTierDatum[] {
  return (
    locations?.map((location) => ({
      id: location.location_id,
      tierLevel: location.tier_level,
    })) ?? []
  )
}

function continuousTileLayouts(
  records: readonly { id: string; value: number; tierLevel: number }[],
  xStart: number,
) {
  const layouts = new Map<string, TileLayout>()
  const columns = 16
  const rowsPerTier = 5

  ;([1, 2, 3, 4] as const).forEach((tierLevel) => {
    const occupied = new Set<string>()
    const tierRecords = records
      .filter((record) => record.tierLevel === tierLevel)
      .map((record) => ({
        ...record,
        bin: Math.max(
          0,
          Math.min(
            rowsPerTier - 1,
            Math.floor(
              (record.value - tierLevel + 0.000001) / continuousBinWidth,
            ),
          ),
        ),
      }))
      .sort((a, b) => a.bin - b.bin || a.value - b.value)

    tierRecords.forEach((record) => {
      const candidateRows = Array.from(
        { length: rowsPerTier },
        (_, row) => row,
      ).sort(
        (a, b) => Math.abs(a - record.bin) - Math.abs(b - record.bin) || a - b,
      )

      for (const row of candidateRows) {
        const column = Array.from(
          { length: columns },
          (_, index) => index,
        ).find((index) => !occupied.has(`${row}-${index}`))

        if (column === undefined) continue

        occupied.add(`${row}-${column}`)
        layouts.set(record.id, {
          x: xStart + column * (comparisonTileSize + comparisonTileGap),
          y:
            105 +
            (tierLevel - 1) * 130 +
            row * (comparisonTileSize + comparisonTileGap),
          width: comparisonTileSize,
          height: comparisonTileSize,
        })
        break
      }
    })
  })

  return layouts
}

function getMainScenarioTargetLayouts(
  sourceLayouts: ReadonlyMap<string, ScenarioTileLayout>,
  targetCws: readonly ScenarioTierDatum[],
  targetAgriculture: readonly ScenarioTierDatum[],
) {
  const layouts = new Map<string, ScenarioTileLayout>()

  const addGroup = (
    group: "cws" | "agriculture",
    records: readonly ScenarioTierDatum[],
    xStart: number,
  ) => {
    ;([1, 2, 3, 4] as const).forEach((tierLevel) => {
      records
        .filter((record) => record.tierLevel === tierLevel)
        .sort((a, b) => {
          const aChanged =
            sourceLayouts.get(`${group}:${a.id}`)?.tierLevel !== a.tierLevel
          const bChanged =
            sourceLayouts.get(`${group}:${b.id}`)?.tierLevel !== b.tierLevel

          return Number(bChanged) - Number(aChanged) || a.id.localeCompare(b.id)
        })
        .forEach((record, index) => {
          layouts.set(`${group}:${record.id}`, {
            x: xStart + (index % 16) * (comparisonTileSize + comparisonTileGap),
            y:
              105 +
              (tierLevel - 1) * 130 +
              Math.floor(index / 16) * (comparisonTileSize + comparisonTileGap),
            width: comparisonTileSize,
            height: comparisonTileSize,
            tierLevel,
          })
        })
    })
  }

  addGroup("cws", targetCws, 105)
  addGroup("agriculture", targetAgriculture, 405)
  return layouts
}

export default function Resolution() {
  return (
    <StickyScrollSection
      id="frame-7"
      ariaLabel="How COEQWAL translates modeled outcomes into performance categories"
      height={`${frameCount * 200}vh`}
    >
      <Box
        sx={{
          width: "calc(100vw - 5rem)",
          height: "100dvh",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 45dvw" },
          alignItems: "center",
          minHeight: 0,
        }}
      >
        <Box
          className="text-section"
          sx={{
            display: "grid",
            alignItems: "center",
            pointerEvents: "auto",
            maxWidth: "min(75ch, 55dvw)",
          }}
        >
          {storyFrames.map((frame, index) => {
            const start = index / frameCount
            const end = (index + 1) / frameCount

            return (
              <ScrollElement
                key={index}
                enter={[start, start + 0.025]}
                hold={[start + 0.025, end - 0.025]}
                exit={index === frameCount - 1 ? undefined : [end - 0.025, end]}
                animation="slideUp"
                style={{ gridArea: "1 / 1" }}
              >
                {"title" in frame ? (
                  <Box component="header">
                    <SectionTitle text={frame.title} markSx={narrativeMarkSx} />
                  </Box>
                ) : null}
                <Stack component="section" spacing={2}>
                  {frame.paragraphs.map((sentences, paragraphIndex) => {
                    const paragraph = (
                      <Box component="article">
                        <Paragraph
                          blocks={sentences}
                          markSx={narrativeMarkSx}
                        />
                      </Box>
                    )

                    return index === 3 && paragraphIndex === 1 ? (
                      <ScrollElement
                        key={paragraphIndex}
                        enter={[0.565, 0.585]}
                        hold={[0.585, end]}
                        animation="slideUp"
                      >
                        {paragraph}
                      </ScrollElement>
                    ) : (
                      <Box key={paragraphIndex} component="article">
                        <Paragraph
                          blocks={sentences}
                          markSx={narrativeMarkSx}
                        />
                      </Box>
                    )
                  })}
                </Stack>
              </ScrollElement>
            )
          })}
        </Box>

        <UnitVisualization />
      </Box>
    </StickyScrollSection>
  )
}

function UnitVisualization() {
  const progress = useScrollProgress()
  const urbanIcon = useUrbanIcon()
  const cwsTierLocations = useMemo(() => cwsTiers.locations, [])
  const agricultureTierLocations = useMemo(
    () => agricultureTiers.results.AG_REV.locations,
    [],
  )
  const scenarioComparisons = useMemo(
    () => ({
      s0020: {
        cws: cwsTierLocations.map((location) => ({
          id: location.locationId,
          tierLevel: location.tierLevel,
        })),
        agriculture: agricultureTierLocations.map((location) => ({
          id: location.location_id,
          tierLevel: location.tier_level,
        })),
      },
      s0035: {
        cws: toScenarioTierData(s0035TierAssignments.results.CWS_DEL.locations),
        agriculture: toScenarioTierData(
          s0035TierAssignments.results.AG_REV.locations,
        ),
      },
    }),
    [agricultureTierLocations, cwsTierLocations],
  )
  const tiles = useMemo(() => {
    const root = hierarchy<CwsTreemapDatum>({
      locationId: "all-cws",
      value: 0,
      children: cwsDeliveryMedians.locations.map((location) => ({
        locationId: location.locationId,
        value: location.medianAnnualDeliveryTaf,
      })),
    })
      .sum((node) => node.value)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

    return treemap<CwsTreemapDatum>()
      .size([treemapBounds.width, treemapBounds.height])
      .paddingInner(3)
      .round(true)(root)
      .leaves()
  }, [])
  const tierByLocation = useMemo(
    () =>
      new Map(
        cwsTierLocations.map((location) => [
          location.locationId,
          location.tierLevel,
        ]),
      ),
    [cwsTierLocations],
  )
  const equalTileLayouts = useMemo(() => {
    const layouts = new Map<
      string,
      { x: number; y: number; width: number; height: number }
    >()
    const tileSize = comparisonTileSize
    const gap = comparisonTileGap
    const columns = 16

    ;([1, 2, 3, 4] as const).forEach((tierLevel) => {
      tiles
        .filter(
          (tile) => tierByLocation.get(tile.data.locationId) === tierLevel,
        )
        .forEach((tile, index) => {
          layouts.set(tile.data.locationId, {
            x: 105 + (index % columns) * (tileSize + gap),
            y:
              105 +
              (tierLevel - 1) * 130 +
              Math.floor(index / columns) * (tileSize + gap),
            width: tileSize,
            height: tileSize,
          })
        })
    })

    return layouts
  }, [tierByLocation, tiles])
  const cwsContinuousLayouts = useMemo(
    () =>
      continuousTileLayouts(
        cwsTierLocations.map((location) => ({
          id: location.locationId,
          value: location.tierContinuous,
          tierLevel: location.tierLevel,
        })),
        105,
      ),
    [cwsTierLocations],
  )
  const agricultureTiles = useMemo(() => {
    const locations = agricultureTierLocations.map((location) => ({
      id: location.location_id,
      tierLevel: location.tier_level,
      tierContinuous:
        location.tier_continuous === undefined
          ? location.tier_level
          : Number(location.tier_continuous),
    }))
    const discreteIndexByTier = new Map<number, number>()
    const continuousLayouts = continuousTileLayouts(
      locations.map((location) => ({
        id: location.id,
        value: location.tierContinuous,
        tierLevel: location.tierLevel,
      })),
      405,
    )

    return locations.map((location) => {
      const tierIndex = discreteIndexByTier.get(location.tierLevel) ?? 0
      discreteIndexByTier.set(location.tierLevel, tierIndex + 1)

      return {
        ...location,
        discrete: {
          x: 405 + (tierIndex % 16) * (comparisonTileSize + comparisonTileGap),
          y:
            105 +
            (location.tierLevel - 1) * 130 +
            Math.floor(tierIndex / 16) *
              (comparisonTileSize + comparisonTileGap),
          width: comparisonTileSize,
          height: comparisonTileSize,
        },
        continuous: continuousLayouts.get(location.id),
      }
    })
  }, [agricultureTierLocations])
  const scenarioSourceLayouts = useMemo(() => {
    const layouts = new Map<string, ScenarioTileLayout>()

    scenarioComparisons.s0020.cws.forEach((record) => {
      const layout = equalTileLayouts.get(record.id)
      if (layout)
        layouts.set(`cws:${record.id}`, {
          ...layout,
          tierLevel: record.tierLevel,
        })
    })
    agricultureTiles.forEach((tile) => {
      layouts.set(`agriculture:${tile.id}`, {
        ...tile.discrete,
        tierLevel: tile.tierLevel,
      })
    })

    return layouts
  }, [agricultureTiles, equalTileLayouts, scenarioComparisons.s0020.cws])
  const scenarioTargetLayouts = useMemo(() => {
    const targetCws = scenarioComparisons.s0035.cws.length
      ? scenarioComparisons.s0035.cws
      : scenarioComparisons.s0020.cws
    const targetAgriculture = scenarioComparisons.s0035.agriculture.length
      ? scenarioComparisons.s0035.agriculture
      : scenarioComparisons.s0020.agriculture

    return getMainScenarioTargetLayouts(
      scenarioSourceLayouts,
      targetCws,
      targetAgriculture,
    )
  }, [scenarioComparisons, scenarioSourceLayouts])
  const occupiedContinuousTicks = useMemo(() => {
    const ticks = new Set([1, 2, 3, 4])
    const addTick = (value: number) => {
      const tierLevel = Math.floor(value)
      const binnedValue =
        tierLevel +
        Math.floor((value - tierLevel + 0.000001) / continuousBinWidth) *
          continuousBinWidth
      ticks.add(Number(binnedValue.toFixed(1)))
    }

    cwsTierLocations.forEach((location) => addTick(location.tierContinuous))
    agricultureTierLocations.forEach((location) =>
      addTick(
        location.tier_continuous === undefined
          ? location.tier_level
          : Number(location.tier_continuous),
      ),
    )

    return [...ticks].sort((a, b) => a - b)
  }, [agricultureTierLocations, cwsTierLocations])
  const annualDeliverySeries = useMemo(
    () =>
      focusCwsAnnualDeliveryTaf.map((annualDeliveryTaf, index) => ({
        simulationYear: index + 1,
        annualDeliveryTaf,
      })),
    [],
  )
  const annualDeliveryXScale = useMemo(
    () =>
      scaleBand<number>()
        .domain(annualDeliverySeries.map((year) => year.simulationYear))
        .range([60, 704])
        .paddingInner(0.12),
    [annualDeliverySeries],
  )
  const annualDeliveryYScale = useMemo(
    () => scaleLinear().domain([0, 10]).range([700, 140]),
    [],
  )
  const annualDeliveryYTicks = annualDeliveryYScale.ticks(5)
  const annualDemandTaf = focusCws?.annualDemandTafByWaterYear?.[0] ?? 0
  const demandMetXScale = useMemo(
    () => scaleLinear().domain([0, 100]).range([60, 704]),
    [],
  )
  const yearCountYScale = useMemo(
    () => scaleLinear().domain([0, 100]).range([700, 140]),
    [],
  )
  const dotPlotSeries = useMemo(() => {
    const binCounts = new Map<number, number>()

    return annualDeliverySeries.map((year) => {
      const demandMetPercent = Math.min(
        100,
        (year.annualDeliveryTaf / annualDemandTaf) * 100,
      )
      const bin = Math.round(demandMetPercent / 5) * 5
      const stackIndex = binCounts.get(bin) ?? 0
      binCounts.set(bin, stackIndex + 1)

      return {
        ...year,
        stackedDotX: demandMetXScale(bin),
        stackedDotY: yearCountYScale(stackIndex + 1),
      }
    })
  }, [annualDeliverySeries, annualDemandTaf, demandMetXScale, yearCountYScale])
  const outlineX = useTransform(
    progress,
    [0, 0.01, 0.025],
    [250, 250, treemapBounds.x],
  )
  const outlineY = useTransform(
    progress,
    [0, 0.01, 0.025],
    [340, 340, treemapBounds.y],
  )
  const outlineWidth = useTransform(
    progress,
    [0, 0.01, 0.025],
    [220, 220, treemapBounds.width],
  )
  const outlineHeight = useTransform(
    progress,
    [0, 0.01, 0.025],
    [220, 220, treemapBounds.height],
  )
  const outlineRadius = useTransform(progress, [0, 0.01, 0.025], [110, 12, 0])
  const outlineOpacity = useTransform(progress, [0, 0.025, 0.04], [1, 1, 0])
  const iconOpacity = useTransform(progress, [0, 0.012, 0.025], [1, 1, 0])
  // The icon fades out before the outline circle (rx 110, centered at
  // 360,460) morphs into the treemap, so it can be sized for that circle.
  // urban.svg has built-in padding around the artwork, so iconContentFill
  // compensates to get the visible artwork itself to fill 90% of the circle.
  const openingIconContentFill = 0.75
  const openingIconSize = (2 * 110 * 0.9) / openingIconContentFill
  const treemapOpacity = useTransform(
    progress,
    [0.025, 0.04, 0.105, 0.125],
    [0, 1, 1, 0],
  )
  const tierTreemapProgress = useTransform(progress, [0.57, 0.59], [0, 1])
  const equalTileProgress = useTransform(progress, [0.655, 0.685], [0, 1])
  const agricultureLayoutProgress = useTransform(progress, [0.7, 0.76], [0, 1])
  // The storyline now moves directly from discrete tiers into scenario
  // comparison; keep the former continuous-tier morph dormant.
  const continuousTierProgress = useTransform(progress, [0, 1], [0, 0])
  const finalFrameCaptionProgress = useTransform(progress, [0.86, 0.89], [0, 1])
  const scenarioOverlayOpacity = useTransform(progress, [0.865, 0.87], [0, 1])
  const baselineTileOpacity = useTransform(progress, [0.865, 0.87], [1, 0])
  const scenarioMoveProgress = useTransform(progress, [0.87, 0.97], [0, 1])
  const discreteTierGuideOpacity = useTransform(
    () => equalTileProgress.get() * (1 - continuousTierProgress.get()),
  )
  const combinedTreemapOpacity = useTransform(() =>
    Math.max(treemapOpacity.get(), tierTreemapProgress.get()),
  )
  const tierTreemapScale = useTransform(
    progress,
    [0, 0.56, 0.57, 0.59],
    [1, 1, 1.12, 1],
  )
  const demandChartOpacity = useTransform(
    progress,
    [0.12, 0.14, 0.565, 0.585],
    [0, 1, 1, 0],
  )
  const xAxisPathLength = useTransform(progress, [0.125, 0.145], [0, 1])
  const xAxisLabelOpacity = useTransform(progress, [0.14, 0.15], [0, 1])
  const yAxisPathLength = useTransform(progress, [0.145, 0.17], [0, 1])
  const yAxisContentOpacity = useTransform(progress, [0.155, 0.175], [0, 1])
  const demandLinePathLength = useTransform(progress, [0.15, 0.18], [0, 1])
  const demandLabelOpacity = useTransform(progress, [0.175, 0.19], [0, 1])
  const deliveryBarProgress = useTransform(progress, [0.18, 0.205], [0, 1])
  // Hold the completed TAF chart before normalizing every year to demand met.
  const demandMetProgress = useTransform(progress, [0.245, 0.265], [0, 1])
  const tafLabelOpacity = useTransform(
    demandMetProgress,
    [0, 0.45, 1],
    [1, 0, 0],
  )
  const percentLabelOpacity = useTransform(
    demandMetProgress,
    [0, 0.55, 1],
    [0, 0, 1],
  )
  const demandLineY = useTransform(
    demandMetProgress,
    [0, 1],
    [annualDeliveryYScale(annualDemandTaf), annualDeliveryYScale(10)],
  )
  const demandLineLabelY = useTransform(demandLineY, (lineY) => lineY - 10)
  const tafDemandLabelOpacity = useTransform(
    () => demandLabelOpacity.get() * tafLabelOpacity.get(),
  )
  // Hold the normalized percentage bars before collapsing them into dots.
  const markMorphProgress = useTransform(progress, [0.295, 0.312], [0, 1])
  const dotPlotProgress = useTransform(progress, [0.312, 0.35], [0, 1])
  const barChartStructureOpacity = useTransform(
    dotPlotProgress,
    [0, 0.4, 1],
    [1, 0, 0],
  )
  const dotPlotLabelOpacity = useTransform(
    dotPlotProgress,
    [0, 0.6, 1],
    [0, 0, 1],
  )
  const distributionAxisX2 = useTransform(dotPlotProgress, [0, 1], [60, 704])
  const distributionAxisY2 = useTransform(dotPlotProgress, [0, 1], [140, 700])
  const percentBarTitleOpacity = useTransform(
    () => percentLabelOpacity.get() * barChartStructureOpacity.get(),
  )
  const yAxisGridOpacity = useTransform(
    () => yAxisContentOpacity.get() * barChartStructureOpacity.get(),
  )
  const tafDemandReferenceOpacity = useTransform(
    () => tafDemandLabelOpacity.get() * barChartStructureOpacity.get(),
  )
  const xAxisContentOpacity = useTransform(
    () => xAxisLabelOpacity.get() * barChartStructureOpacity.get(),
  )
  const stackedGuideOpacity = dotPlotLabelOpacity
  const optimalBoundaryProgress = useTransform(progress, [0.375, 0.39], [0, 1])
  const optimalCondition1Progress = useTransform(
    progress,
    [0.39, 0.405],
    [0, 1],
  )
  const optimalCondition2Progress = useTransform(
    progress,
    [0.415, 0.435],
    [0, 1],
  )
  const atRiskBoundaryProgress = useTransform(progress, [0.5, 0.512], [0, 1])
  const atRiskCondition1Progress = useTransform(
    progress,
    [0.512, 0.525],
    [0, 1],
  )
  const atRiskCondition2Progress = useTransform(progress, [0.53, 0.548], [0, 1])
  const optimalHighlightOpacity = useTransform(
    () => optimalBoundaryProgress.get() * (1 - atRiskBoundaryProgress.get()),
  )
  const atRiskHighlightOpacity = atRiskBoundaryProgress
  const focusTreemapTitleOpacity = treemapOpacity
  const annualDeliveryTitleOpacity = useTransform(
    () =>
      demandChartOpacity.get() *
      barChartStructureOpacity.get() *
      tafLabelOpacity.get(),
  )
  const demandMetTitleOpacity = useTransform(
    () =>
      demandChartOpacity.get() *
      barChartStructureOpacity.get() *
      percentLabelOpacity.get(),
  )
  const distributionTitleOpacity = useTransform(
    () =>
      demandChartOpacity.get() *
      dotPlotLabelOpacity.get() *
      (1 - optimalBoundaryProgress.get()) *
      (1 - atRiskBoundaryProgress.get()),
  )
  const optimalTitleOpacity = optimalHighlightOpacity
  const atRiskTitleOpacity = useTransform(
    () => atRiskHighlightOpacity.get() * (1 - tierTreemapProgress.get()),
  )
  const tierTreemapTitleOpacity = useTransform(
    () => tierTreemapProgress.get() * (1 - equalTileProgress.get()),
  )
  const cwsTierRowsTitleOpacity = useTransform(
    () => equalTileProgress.get() * (1 - agricultureLayoutProgress.get()),
  )
  const discreteComparisonTitleOpacity = useTransform(
    () =>
      agricultureLayoutProgress.get() *
      (1 - continuousTierProgress.get()) *
      (1 - finalFrameCaptionProgress.get()),
  )
  const scenarioComparisonTitleOpacity = finalFrameCaptionProgress
  return (
    <Box
      component="figure"
      sx={{
        m: 0,
        width: "100%",
        height: "100dvh",
        minWidth: 0,
        minHeight: 0,
        boxSizing: "border-box",
        display: "grid",
        gridTemplateRows: "15dvh 85dvh",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Box
        component="figcaption"
        sx={{
          display: "grid",
          alignItems: "end",
          minHeight: 0,
          px: { xs: 1.5, md: 2, lg: 4.5, xl: 5 },
          pb: 2,
          overflow: "hidden",
          backgroundColor: titleBandColor,
        }}
      >
        <VisualizationTitle
          {...visualizationCopy.focusTreemap}
          opacity={focusTreemapTitleOpacity}
        />
        <VisualizationTitle
          {...visualizationCopy.annualDelivery}
          opacity={annualDeliveryTitleOpacity}
        />
        <VisualizationTitle
          {...visualizationCopy.demandMet}
          opacity={demandMetTitleOpacity}
        />
        <VisualizationTitle
          {...visualizationCopy.distribution}
          opacity={distributionTitleOpacity}
        />
        <VisualizationTitle
          {...visualizationCopy.optimal}
          opacity={optimalTitleOpacity}
        />
        <VisualizationTitle
          {...visualizationCopy.atRisk}
          opacity={atRiskTitleOpacity}
        />
        <VisualizationTitle
          {...visualizationCopy.tierTreemap}
          opacity={tierTreemapTitleOpacity}
        />
        <VisualizationTitle
          {...visualizationCopy.cwsTierRows}
          opacity={cwsTierRowsTitleOpacity}
        />
        <VisualizationTitle
          {...visualizationCopy.crossGroupComparison}
          opacity={discreteComparisonTitleOpacity}
        />
        <VisualizationTitle
          {...visualizationCopy.scenarioComparison}
          opacity={scenarioComparisonTitleOpacity}
        />
      </Box>
      <Box
        component="svg"
        viewBox="0 0 720 780"
        role="img"
        aria-labelledby="unit-vis-title unit-vis-description"
        preserveAspectRatio="xMidYMid meet"
        sx={{
          display: "block",
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          maxHeight: "100%",
          px: { xs: 1.5, md: 2, lg: 4.5, xl: 5 },
          pb: { xs: 2, md: 2.5, lg: 4, xl: 5 },
          boxSizing: "border-box",
          visibility: LOAD_RESOLUTION_VISUALS ? "visible" : "hidden",
        }}
      >
        <title id="unit-vis-title">
          Community water-system delivery and demand
        </title>
        <desc id="unit-vis-description">
          A community water-system icon inside a circle morphs into a square and
          then a treemap of 74 nodes. The following chart shows annual
          deliveries for one community water system against its constant annual
          demand, normalizes them to percent of demand met, and stacks the 100
          water years as dots.
        </desc>

        <motion.g
          style={{
            opacity: combinedTreemapOpacity,
            scale: tierTreemapScale,
            transformOrigin: "360px 450px",
          }}
          aria-label="Community water system delivery treemap"
        >
          <defs>
            {tiles.map((tile) => (
              <clipPath
                key={tile.data.locationId}
                id={`cws-tile-${tile.data.locationId}`}
              >
                <rect
                  x={treemapBounds.x + tile.x0}
                  y={treemapBounds.y + tile.y0}
                  width={tile.x1 - tile.x0}
                  height={tile.y1 - tile.y0}
                />
              </clipPath>
            ))}
          </defs>
          {tiles.map((tile, tileIndex) => {
            const tierLevel = tierByLocation.get(tile.data.locationId)
            const tierColor = tierLevel
              ? (tierColors[tierLevel] ?? "#fcfbfa")
              : "#fcfbfa"
            const equalLayout = equalTileLayouts.get(tile.data.locationId)
            const continuousLayout = cwsContinuousLayouts.get(
              tile.data.locationId,
            )

            return equalLayout && continuousLayout ? (
              <TierTreemapTile
                key={tile.data.locationId}
                locationId={tile.data.locationId}
                sourceX={treemapBounds.x + tile.x0}
                sourceY={treemapBounds.y + tile.y0}
                sourceWidth={tile.x1 - tile.x0}
                sourceHeight={tile.y1 - tile.y0}
                target={equalLayout}
                continuousTarget={continuousLayout}
                tierColor={tierColor}
                sectionProgress={progress}
                revealOrder={tileIndex}
                tileCount={tiles.length}
                layoutProgress={equalTileProgress}
                continuousProgress={continuousTierProgress}
                scenarioOpacity={baselineTileOpacity}
              />
            ) : null
          })}
          <motion.g style={{ opacity: equalTileProgress }}>
            <motion.g style={{ opacity: discreteTierGuideOpacity }}>
              {[1, 2, 3, 4].map((tierLevel) => (
                <g key={`tier-row-${tierLevel}`}>
                  <text
                    x="92"
                    y={119 + (tierLevel - 1) * 130}
                    textAnchor="end"
                    fill={tierColors[tierLevel]}
                    fontSize="14"
                    fontWeight="700"
                  >
                    {tierNames[tierLevel]}
                  </text>
                  {tierLevel < 4 ? (
                    <line
                      x1="92"
                      x2="690"
                      y1={235 + (tierLevel - 1) * 130}
                      y2={235 + (tierLevel - 1) * 130}
                      stroke="rgba(252, 251, 250, 0.2)"
                      strokeWidth="1"
                    />
                  ) : null}
                </g>
              ))}
            </motion.g>
            <motion.g style={{ opacity: continuousTierProgress }}>
              {[1, 2, 3, 4].map((tierLevel) => (
                <rect
                  key={`continuous-tier-band-${tierLevel}`}
                  x="98"
                  y={105 + (tierLevel - 1) * 130}
                  width="592"
                  height="130"
                  fill={tierColors[tierLevel]}
                  fillOpacity="0.075"
                />
              ))}
              <line
                x1="98"
                x2="98"
                y1="105"
                y2="625"
                stroke="rgba(252, 251, 250, 0.65)"
                strokeWidth="1"
              />
              {occupiedContinuousTicks.map((tick) => {
                const tickY = 105 + (tick - 1) * 130
                const isTierBoundary = Number.isInteger(tick)

                return (
                  <g key={`continuous-tier-${tick}`}>
                    <line
                      x1="92"
                      x2="98"
                      y1={tickY}
                      y2={tickY}
                      stroke="rgba(252, 251, 250, 0.65)"
                      strokeWidth="1"
                    />
                    <line
                      x1="98"
                      x2="690"
                      y1={tickY}
                      y2={tickY}
                      stroke={
                        isTierBoundary
                          ? tierColors[Math.min(tick, 4)]
                          : "rgba(252, 251, 250, 0.12)"
                      }
                      strokeOpacity={isTierBoundary ? 0.7 : 1}
                      strokeWidth="1"
                    />
                    <text
                      x="86"
                      y={tickY + 4}
                      textAnchor="end"
                      fill={
                        isTierBoundary
                          ? tierColors[Math.min(tick, 4)]
                          : "rgba(252, 251, 250, 0.78)"
                      }
                      fontSize={isTierBoundary ? "13" : "11"}
                      fontWeight={isTierBoundary ? "700" : "400"}
                    >
                      {isTierBoundary ? tierNames[tick] : tick.toFixed(1)}
                    </text>
                  </g>
                )
              })}
              <text
                x="24"
                y="365"
                textAnchor="middle"
                fill="rgba(252, 251, 250, 0.78)"
                fontSize="12"
                transform="rotate(-90 24 365)"
              >
                Continuous performance
              </text>
            </motion.g>
            <text
              x="226"
              y="730"
              textAnchor="middle"
              fill="#fcfbfa"
              fontSize="14"
              fontWeight="700"
            >
              Community water systems
            </text>
          </motion.g>
          <motion.g style={{ opacity: agricultureLayoutProgress }}>
            <motion.line
              x1="382"
              x2="382"
              y1="82"
              y2="752"
              stroke="rgba(252, 251, 250, 0.5)"
              strokeWidth="1"
              style={{ pathLength: agricultureLayoutProgress }}
            />
            {agricultureTiles.map((tile) =>
              tile.continuous ? (
                <AgricultureTierTile
                  key={tile.id}
                  discrete={tile.discrete}
                  continuous={tile.continuous}
                  color={tierColors[tile.tierLevel] ?? "#fcfbfa"}
                  continuousProgress={continuousTierProgress}
                  scenarioOpacity={baselineTileOpacity}
                />
              ) : null,
            )}
            <text
              x="531"
              y="730"
              textAnchor="middle"
              fill="#fcfbfa"
              fontSize="14"
              fontWeight="700"
            >
              Agriculture
            </text>
          </motion.g>
        </motion.g>

        <MovingScenarioTiles
          sourceLayouts={scenarioSourceLayouts}
          targetLayouts={scenarioTargetLayouts}
          progress={scenarioMoveProgress}
          opacity={scenarioOverlayOpacity}
        />

        <motion.rect
          x={outlineX}
          y={outlineY}
          width={outlineWidth}
          height={outlineHeight}
          rx={outlineRadius}
          fill="rgba(100, 164, 214, 0.08)"
          stroke="#fcfbfa"
          strokeWidth="7"
          style={{ opacity: outlineOpacity }}
        />
        <foreignObject
          x={360 - openingIconSize / 2}
          y={460 - openingIconSize / 2}
          width={openingIconSize}
          height={openingIconSize}
        >
          <motion.div
            style={{
              width: "100%",
              height: "100%",
              opacity: iconOpacity,
              backgroundColor: tierColors[1],
              mask: `url(${urbanIcon}) center / contain no-repeat`,
              WebkitMask: `url(${urbanIcon}) center / contain no-repeat`,
              filter: "drop-shadow(0 14px 22px rgba(0, 0, 0, 0.35))",
            }}
          />
        </foreignObject>

        <motion.g
          style={{ opacity: demandChartOpacity }}
          aria-label="Annual delivery bars and a constant annual demand line across 100 simulated water years"
        >
          <motion.g style={{ opacity: yAxisGridOpacity }}>
            {annualDeliveryYTicks.map((tick) => {
              const tickY = annualDeliveryYScale(tick)

              return (
                <g key={tick}>
                  <line
                    x1="54"
                    x2="704"
                    y1={tickY}
                    y2={tickY}
                    stroke="rgba(252, 251, 250, 0.18)"
                    strokeWidth="1"
                  />
                  <line
                    x1="54"
                    x2="60"
                    y1={tickY}
                    y2={tickY}
                    stroke="#fcfbfa"
                    strokeWidth="1"
                  />
                  <motion.text
                    x="46"
                    y={tickY + 5}
                    textAnchor="end"
                    fill="#fcfbfa"
                    fontSize="12"
                    style={{ opacity: tafLabelOpacity }}
                  >
                    {tick}
                  </motion.text>
                  <motion.text
                    x="46"
                    y={tickY + 5}
                    textAnchor="end"
                    fill="#fcfbfa"
                    fontSize="12"
                    style={{ opacity: percentLabelOpacity }}
                  >
                    {tick * 10}%
                  </motion.text>
                </g>
              )
            })}
          </motion.g>
          {dotPlotSeries.map((year) => (
            <AnnualDeliveryBar
              key={year.simulationYear}
              x={annualDeliveryXScale(year.simulationYear) ?? 60}
              width={annualDeliveryXScale.bandwidth()}
              targetY={annualDeliveryYScale(year.annualDeliveryTaf)}
              normalizedTargetY={annualDeliveryYScale(
                Math.min(10, (year.annualDeliveryTaf / annualDemandTaf) * 10),
              )}
              progress={deliveryBarProgress}
              normalizationProgress={demandMetProgress}
              markMorphProgress={markMorphProgress}
              dotPlotProgress={dotPlotProgress}
              stackedDotX={year.stackedDotX}
              stackedDotY={year.stackedDotY}
            />
          ))}
          <motion.line
            x1="60"
            x2="704"
            y1={demandLineY}
            y2={demandLineY}
            stroke="#fcfbfa"
            strokeWidth="2.5"
            style={{
              pathLength: demandLinePathLength,
              opacity: barChartStructureOpacity,
            }}
          />
          <motion.text
            x="700"
            y={demandLineLabelY}
            textAnchor="end"
            fill="#fcfbfa"
            fontSize="12"
            fontWeight="700"
            style={{ opacity: tafDemandReferenceOpacity }}
          >
            Demand: {annualDemandTaf.toFixed(2)} TAF
          </motion.text>
          <motion.text
            x="700"
            y={demandLineLabelY}
            textAnchor="end"
            fill="#fcfbfa"
            fontSize="12"
            fontWeight="700"
            style={{ opacity: percentBarTitleOpacity }}
          >
            Demand is met
          </motion.text>
          <motion.line
            x1="60"
            x2="704"
            y1="700"
            y2="700"
            stroke="#fcfbfa"
            strokeWidth="1"
            style={{
              pathLength: xAxisPathLength,
              opacity: barChartStructureOpacity,
            }}
          />
          <motion.line
            x1="60"
            x2="60"
            y1="700"
            y2="710"
            stroke="#fcfbfa"
            strokeWidth="1"
            style={{
              pathLength: xAxisPathLength,
              opacity: barChartStructureOpacity,
            }}
          />
          <motion.line
            x1="704"
            x2="704"
            y1="700"
            y2="710"
            stroke="#fcfbfa"
            strokeWidth="1"
            style={{
              pathLength: xAxisPathLength,
              opacity: barChartStructureOpacity,
            }}
          />
          <motion.line
            x1="60"
            x2={distributionAxisX2}
            y1="700"
            y2={distributionAxisY2}
            stroke="#fcfbfa"
            strokeWidth="1"
            style={{ pathLength: yAxisPathLength }}
          />
          <motion.text
            x="60"
            y="738"
            fill="#fcfbfa"
            fontSize="14"
            style={{ opacity: xAxisContentOpacity }}
          >
            Year 1
          </motion.text>
          <motion.text
            x="704"
            y="738"
            textAnchor="end"
            fill="#fcfbfa"
            fontSize="14"
            style={{ opacity: xAxisContentOpacity }}
          >
            Year 100
          </motion.text>
          {[0, 20, 40, 60, 80, 100].map((tick) => (
            <motion.g
              key={`dot-axis-${tick}`}
              style={{ opacity: dotPlotLabelOpacity }}
            >
              <line
                x1={demandMetXScale(tick)}
                x2={demandMetXScale(tick)}
                y1="700"
                y2="708"
                stroke="#fcfbfa"
                strokeWidth="1"
              />
              <text
                x={demandMetXScale(tick)}
                y="730"
                textAnchor="middle"
                fill="#fcfbfa"
                fontSize="12"
              >
                {tick}%
              </text>
            </motion.g>
          ))}
          <motion.text
            x="382"
            y="768"
            textAnchor="middle"
            fill="#fcfbfa"
            fontSize="13"
            style={{ opacity: dotPlotLabelOpacity }}
          >
            % of water demand met
          </motion.text>
          <motion.g style={{ opacity: stackedGuideOpacity }}>
            <line
              x1="60"
              x2="60"
              y1={yearCountYScale(100)}
              y2="700"
              stroke="#fcfbfa"
              strokeWidth="1"
            />
            {[0, 100].map((count) => {
              const countY = yearCountYScale(count)

              return (
                <g key={`count-extent-${count}`}>
                  <line
                    x1="54"
                    x2="60"
                    y1={countY}
                    y2={countY}
                    stroke="#fcfbfa"
                    strokeWidth="1"
                  />
                  <text
                    x="46"
                    y={countY + 5}
                    textAnchor="end"
                    fill="#fcfbfa"
                    fontSize="12"
                  >
                    {count}
                  </text>
                </g>
              )
            })}
            {[50, 90].map((count) => {
              const countY = yearCountYScale(count)

              return (
                <g key={`count-${count}`}>
                  <line
                    x1="60"
                    x2="704"
                    y1={countY}
                    y2={countY}
                    stroke="rgba(252, 251, 250, 0.42)"
                    strokeWidth="1"
                  />
                  <line
                    x1="54"
                    x2="60"
                    y1={countY}
                    y2={countY}
                    stroke="#fcfbfa"
                    strokeWidth="1"
                  />
                  <text
                    x="46"
                    y={countY + 5}
                    textAnchor="end"
                    fill="#fcfbfa"
                    fontSize="12"
                  >
                    {count}
                  </text>
                </g>
              )
            })}
            <text
              x="14"
              y="420"
              textAnchor="middle"
              fill="#fcfbfa"
              fontSize="13"
              transform="rotate(-90 14 420)"
            >
              Count of years
            </text>
          </motion.g>
          <motion.g style={{ opacity: optimalHighlightOpacity }}>
            <motion.rect
              x="60"
              y={yearCountYScale(8)}
              width={demandMetXScale(70) - 60}
              height={700 - yearCountYScale(8)}
              fill={optimalTierColor}
              fillOpacity="0.14"
              style={{ opacity: optimalCondition2Progress }}
            />
            <motion.rect
              x={demandMetXScale(90)}
              y={yearCountYScale(90)}
              width={704 - demandMetXScale(90)}
              height={700 - yearCountYScale(90)}
              fill={optimalTierColor}
              fillOpacity="0.14"
              style={{ opacity: optimalCondition1Progress }}
            />
            <motion.line
              x1="60"
              x2="704"
              y1={yearCountYScale(90)}
              y2={yearCountYScale(90)}
              stroke={optimalTierColor}
              strokeWidth="3"
              style={{ pathLength: optimalBoundaryProgress }}
            />
            <motion.line
              x1={demandMetXScale(90)}
              x2={demandMetXScale(90)}
              y1={yearCountYScale(100)}
              y2="700"
              stroke={optimalTierColor}
              strokeWidth="2"
              style={{ pathLength: optimalBoundaryProgress }}
            />
            <motion.line
              x1={demandMetXScale(70)}
              x2={demandMetXScale(70)}
              y1={yearCountYScale(100)}
              y2="700"
              stroke={optimalTierColor}
              strokeWidth="2"
              style={{ pathLength: optimalCondition2Progress }}
            />
            <text
              x="68"
              y={yearCountYScale(90) - 9}
              fill={optimalTierColor}
              fontSize="12"
              fontWeight="700"
            >
              90 years
            </text>
            <text
              x={demandMetXScale(90)}
              y="730"
              textAnchor="middle"
              fill={optimalTierColor}
              fontSize="12"
              fontWeight="700"
            >
              90%
            </text>
            <motion.text
              x={demandMetXScale(70)}
              y="730"
              textAnchor="middle"
              fill={optimalTierColor}
              fontSize="12"
              fontWeight="700"
              style={{ opacity: optimalCondition2Progress }}
            >
              70%
            </motion.text>
            <ConditionAnnotation
              number={1}
              color={optimalTierColor}
              x={430}
              y={235}
              lines={[
                "More than 90% of demand is met",
                "in at least 90 years.",
              ]}
              leaderPath={`M 430 280 L 560 280 L ${demandMetXScale(94)} ${yearCountYScale(88)}`}
              progress={optimalCondition1Progress}
            />
            <ConditionAnnotation
              number={2}
              color={optimalTierColor}
              x={78}
              y={570}
              lines={["No years fall below", "70% of demand."]}
              leaderPath={`M 78 615 L 230 615 L ${demandMetXScale(55)} ${yearCountYScale(7)}`}
              progress={optimalCondition2Progress}
            />
          </motion.g>
          <motion.g style={{ opacity: atRiskHighlightOpacity }}>
            <motion.rect
              x="60"
              y={yearCountYScale(8)}
              width={demandMetXScale(50) - 60}
              height={700 - yearCountYScale(8)}
              fill={atRiskTierColor}
              fillOpacity="0.14"
              style={{ opacity: atRiskCondition2Progress }}
            />
            <motion.rect
              x={demandMetXScale(90)}
              y={yearCountYScale(50)}
              width={704 - demandMetXScale(90)}
              height={700 - yearCountYScale(50)}
              fill={atRiskTierColor}
              fillOpacity="0.14"
              style={{ opacity: atRiskCondition1Progress }}
            />
            <motion.line
              x1="60"
              x2="704"
              y1={yearCountYScale(50)}
              y2={yearCountYScale(50)}
              stroke={atRiskTierColor}
              strokeWidth="3"
              style={{ pathLength: atRiskBoundaryProgress }}
            />
            <motion.line
              x1={demandMetXScale(90)}
              x2={demandMetXScale(90)}
              y1={yearCountYScale(100)}
              y2="700"
              stroke={atRiskTierColor}
              strokeWidth="2"
              style={{ pathLength: atRiskBoundaryProgress }}
            />
            <motion.line
              x1={demandMetXScale(50)}
              x2={demandMetXScale(50)}
              y1={yearCountYScale(100)}
              y2="700"
              stroke={atRiskTierColor}
              strokeWidth="2"
              style={{ pathLength: atRiskCondition2Progress }}
            />
            <text
              x="68"
              y={yearCountYScale(50) - 9}
              fill={atRiskTierColor}
              fontSize="12"
              fontWeight="700"
            >
              50 years
            </text>
            <text
              x={demandMetXScale(90)}
              y="730"
              textAnchor="middle"
              fill={atRiskTierColor}
              fontSize="12"
              fontWeight="700"
            >
              90%
            </text>
            <motion.text
              x={demandMetXScale(50)}
              y="730"
              textAnchor="middle"
              fill={atRiskTierColor}
              fontSize="12"
              fontWeight="700"
              style={{ opacity: atRiskCondition2Progress }}
            >
              50%
            </motion.text>
            <ConditionAnnotation
              number={1}
              color={atRiskTierColor}
              x={455}
              y={315}
              lines={["At least 50 years meet more", "than 90% of demand."]}
              leaderPath={`M 455 360 L 590 360 L ${demandMetXScale(92)} ${yearCountYScale(49)}`}
              progress={atRiskCondition1Progress}
            />
            <ConditionAnnotation
              number={2}
              color={atRiskTierColor}
              x={76}
              y={565}
              lines={[
                "No more than 20% of shortfall years",
                "fall below 50% of demand.",
              ]}
              leaderPath={`M 76 610 L 250 610 L ${demandMetXScale(45)} ${yearCountYScale(7)}`}
              progress={atRiskCondition2Progress}
            />
          </motion.g>
        </motion.g>
      </Box>
    </Box>
  )
}

function MovingScenarioTiles({
  sourceLayouts,
  targetLayouts,
  progress,
  opacity,
}: {
  sourceLayouts: ReadonlyMap<string, ScenarioTileLayout>
  targetLayouts: ReadonlyMap<string, ScenarioTileLayout>
  progress: MotionValue<number>
  opacity: MotionValue<number>
}) {
  const orderedTiles = [...targetLayouts.entries()].sort(
    ([aKey, a], [bKey, b]) => {
      const aSource = sourceLayouts.get(aKey) ?? a
      const bSource = sourceLayouts.get(bKey) ?? b
      return (
        Number(aSource.tierLevel !== a.tierLevel) -
          Number(bSource.tierLevel !== b.tierLevel) || aKey.localeCompare(bKey)
      )
    },
  )

  return (
    <motion.g style={{ opacity }}>
      {orderedTiles.map(([key, target]) => {
        const source = sourceLayouts.get(key) ?? target
        return (
          <MovingScenarioTile
            key={`scenario-move-${key}`}
            source={source}
            target={target}
            progress={progress}
          />
        )
      })}
    </motion.g>
  )
}

function MovingScenarioTile({
  source,
  target,
  progress,
}: {
  source: TileLayout & { tierLevel: number }
  target: TileLayout & { tierLevel: number }
  progress: MotionValue<number>
}) {
  const changed = source.tierLevel !== target.tierLevel
  const movingUp = target.tierLevel < source.tierLevel
  const fill = useTransform(
    progress,
    [0, 1],
    [tierColors[source.tierLevel], tierColors[target.tierLevel]],
  )
  const opacity = useTransform(progress, [0, 1], changed ? [1, 1] : [1, 0.5])
  const path = useTransform(progress, (amount) => {
    const left = source.x + (target.x - source.x) * amount
    const top = source.y + (target.y - source.y) * amount
    const right = left + target.width
    const bottom = top + target.height
    const centerX = left + target.width / 2
    const rectangle = [
      [left, top],
      [right, top],
      [right, bottom],
      [left, bottom],
    ]
    const triangle = movingUp
      ? [
          [centerX, top],
          [right, bottom],
          [left, bottom],
          [left, bottom],
        ]
      : [
          [left, top],
          [right, top],
          [centerX, bottom],
          [centerX, bottom],
        ]
    const points = changed
      ? rectangle.map(([rectX, rectY], index) => {
          const [triangleX, triangleY] = triangle[index]!
          return [
            rectX! + (triangleX! - rectX!) * amount,
            rectY! + (triangleY! - rectY!) * amount,
          ]
        })
      : rectangle
    return `M ${points.map(([pointX, pointY]) => `${pointX},${pointY}`).join(" L ")} Z`
  })

  return (
    <motion.path
      d={path}
      fill={fill}
      stroke="rgba(252, 251, 250, 0.42)"
      strokeWidth="1"
      style={{ opacity }}
    />
  )
}

function VisualizationTitle({
  title,
  caption,
  opacity,
}: {
  title: string
  caption: string
  opacity: MotionValue<number>
}) {
  return (
    <motion.div
      style={{
        gridArea: "1 / 1",
        opacity,
        pointerEvents: "none",
        color: "#fcfbfa",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      <Typography component="h2" variant="h6">
        {title}
      </Typography>
      <Typography
        component="p"
        variant="caption"
        sx={{ mt: 0.5, color: "rgba(242, 240, 239, 0.7)" }}
      >
        {caption}
      </Typography>
    </motion.div>
  )
}

function ConditionAnnotation({
  number,
  color,
  x,
  y,
  lines,
  leaderPath,
  progress,
}: {
  number: number
  color: string
  x: number
  y: number
  lines: readonly string[]
  leaderPath: string
  progress: MotionValue<number>
}) {
  return (
    <motion.g style={{ opacity: progress }}>
      <motion.path
        d={leaderPath}
        fill="none"
        stroke={color}
        strokeWidth="1"
        style={{ pathLength: progress }}
      />
      <text x={x} y={y} fill={color} fontSize="11" fontWeight="700">
        Condition
      </text>
      <circle cx={x + 65} cy={y - 4} r="9" fill={color} />
      <text
        x={x + 65}
        y={y}
        textAnchor="middle"
        fill="#fcfbfa"
        fontSize="10"
        fontWeight="700"
      >
        {number}
      </text>
      <text x={x} y={y + 22} fill={color} fontSize="11">
        {lines.map((line, index) => (
          <tspan key={line} x={x} dy={index === 0 ? 0 : 15}>
            {line}
          </tspan>
        ))}
      </text>
    </motion.g>
  )
}

function AgricultureTierTile({
  discrete,
  continuous,
  color,
  continuousProgress,
  scenarioOpacity,
}: {
  discrete: TileLayout
  continuous: TileLayout
  color: string
  continuousProgress: MotionValue<number>
  scenarioOpacity: MotionValue<number>
}) {
  const x = useTransform(continuousProgress, [0, 1], [discrete.x, continuous.x])
  const y = useTransform(continuousProgress, [0, 1], [discrete.y, continuous.y])
  const width = useTransform(
    continuousProgress,
    [0, 1],
    [discrete.width, continuous.width],
  )
  const height = useTransform(
    continuousProgress,
    [0, 1],
    [discrete.height, continuous.height],
  )

  return (
    <motion.rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={color}
      stroke="rgba(252, 251, 250, 0.42)"
      strokeWidth="1"
      style={{ opacity: scenarioOpacity }}
    />
  )
}

function TierTreemapTile({
  locationId,
  sourceX,
  sourceY,
  sourceWidth,
  sourceHeight,
  target,
  continuousTarget,
  tierColor,
  sectionProgress,
  revealOrder,
  tileCount,
  layoutProgress,
  continuousProgress,
  scenarioOpacity,
}: {
  locationId: string
  sourceX: number
  sourceY: number
  sourceWidth: number
  sourceHeight: number
  target: TileLayout
  continuousTarget: TileLayout
  tierColor: string
  sectionProgress: MotionValue<number>
  revealOrder: number
  tileCount: number
  layoutProgress: MotionValue<number>
  continuousProgress: MotionValue<number>
  scenarioOpacity: MotionValue<number>
}) {
  const discreteX = useTransform(layoutProgress, [0, 1], [sourceX, target.x])
  const discreteY = useTransform(layoutProgress, [0, 1], [sourceY, target.y])
  const discreteWidth = useTransform(
    layoutProgress,
    [0, 1],
    [sourceWidth, target.width],
  )
  const discreteHeight = useTransform(
    layoutProgress,
    [0, 1],
    [sourceHeight, target.height],
  )
  const x = useTransform(
    () =>
      discreteX.get() +
      (continuousTarget.x - discreteX.get()) * continuousProgress.get(),
  )
  const y = useTransform(
    () =>
      discreteY.get() +
      (continuousTarget.y - discreteY.get()) * continuousProgress.get(),
  )
  const width = useTransform(
    () =>
      discreteWidth.get() +
      (continuousTarget.width - discreteWidth.get()) * continuousProgress.get(),
  )
  const height = useTransform(
    () =>
      discreteHeight.get() +
      (continuousTarget.height - discreteHeight.get()) *
        continuousProgress.get(),
  )
  const isFocus = locationId === "25_PU"
  const revealStart = isFocus
    ? 0.57
    : 0.61 + (revealOrder / Math.max(1, tileCount - 1)) * 0.025
  const revealEnd = isFocus ? 0.58 : revealStart + 0.012
  const fillOpacity = useTransform(
    sectionProgress,
    [revealStart, revealEnd],
    [0, 1],
  )

  return (
    <motion.g style={{ opacity: scenarioOpacity }}>
      <motion.rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={tierColor}
        style={{ opacity: fillOpacity }}
      />
      <motion.rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke="rgba(252, 251, 250, 0.42)"
        strokeWidth="1.5"
      />
    </motion.g>
  )
}

function AnnualDeliveryBar({
  x,
  width,
  targetY,
  normalizedTargetY,
  progress,
  normalizationProgress,
  markMorphProgress,
  dotPlotProgress,
  stackedDotX,
  stackedDotY,
}: {
  x: number
  width: number
  targetY: number
  normalizedTargetY: number
  progress: MotionValue<number>
  normalizationProgress: MotionValue<number>
  markMorphProgress: MotionValue<number>
  dotPlotProgress: MotionValue<number>
  stackedDotX: number
  stackedDotY: number
}) {
  const animatedTargetY = useTransform(
    normalizationProgress,
    [0, 1],
    [targetY, normalizedTargetY],
  )
  const barY = useTransform(
    () => 700 - (700 - animatedTargetY.get()) * progress.get(),
  )
  const barHeight = useTransform(
    () => (700 - animatedTargetY.get()) * progress.get(),
  )
  const collapseProgress = useTransform(
    markMorphProgress,
    [0, 0.7, 1],
    [0, 1, 1],
  )
  const circleProgress = useTransform(markMorphProgress, [0, 0.7, 1], [0, 0, 1])
  const squareX = useTransform(
    () => x + ((width - 6) / 2) * collapseProgress.get(),
  )
  const squareY = useTransform(() => barY.get() - 3 * collapseProgress.get())
  const squareWidth = useTransform(
    () => width + (6 - width) * collapseProgress.get(),
  )
  const squareHeight = useTransform(
    () => barHeight.get() + (6 - barHeight.get()) * collapseProgress.get(),
  )
  const animatedX = useTransform(
    () =>
      squareX.get() + (stackedDotX - 3 - squareX.get()) * dotPlotProgress.get(),
  )
  const animatedY = useTransform(
    () =>
      squareY.get() + (stackedDotY - 3 - squareY.get()) * dotPlotProgress.get(),
  )
  const radius = useTransform(circleProgress, [0, 1], [0, 3])

  return (
    <motion.rect
      x={animatedX}
      y={animatedY}
      width={squareWidth}
      height={squareHeight}
      rx={radius}
      fill={FreshWaterColor}
    />
  )
}
