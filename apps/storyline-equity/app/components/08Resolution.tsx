"use client"

import {
  ScrollElement,
  StickyScrollSection,
  useScrollProgress,
} from "@repo/scrollytelling"
import { motion, useTransform, type MotionValue } from "@repo/motion"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"
import { themeValues } from "@repo/ui/themes/theme"
import { hierarchy, scaleBand, scaleLinear, treemap } from "d3"
import { useMemo } from "react"
import type { TierLocationAssignment } from "@repo/data/coeqwal"
import cwsDeliveryMedians from "../../public/data/community-water-systems/node-delivery-medians.json"
import cwsTiers from "../../public/data/community-water-systems/tiers.json"
import agricultureTiers from "../../public/data/agriculture/tiers.json"
import { FreshWaterColor } from "./helpers/colorPalette"
import { useStorylineTierAssignments } from "./hooks/useStorylineTierAssignments"

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
const scenarioNames: Record<string, readonly string[]> = {
  s0020: ["Current operations"],
  s0035: [
    "Prioritize human health delivery levels",
    "to community water systems",
  ],
  s0027: ["Groundwater pumping limits", "in the Central Valley"],
}
const visualizationCopy = {
  focusTreemap: {
    title: "Drinking Water Delivery across Communities",
    caption:
      "Each rectangle is one community within the same community water system; size represents their typical annual surface-water delivery (median). This is s0020 baseline scenario.",
  },
  annualDelivery: {
    title: "Annual Water Deliveries for a Community",
    caption:
      "Each bar shows surface-water delivery in one simulated water year; the line marks drinking-water demand.",
  },
  demandMet: {
    title: "Annual Drinking Water Demand Met for a Community",
    caption:
      "Annual delivery is expressed as a percentage of drinking-water demand.",
  },
  distribution: {
    title: "Distribution of Annual Demand Met",
    caption:
      "Each dot represents one simulated water year, positioned by the percentage of demand met.",
  },
  optimal: {
    title: "Optimal Water Delivery Conditions",
    caption:
      "COEQWAL define thresholds to interpret and evaluate complex Calsim water allocation simulation outcomes.",
  },
  atRisk: {
    title: "At-risk Water Delivery Conditions",
    caption:
      "The same outcomes are evaluated against the At-risk decision boundaries.",
  },
  tierTreemap: {
    title: "Drinking Water Outcome across Communities in Tiers",
    caption:
      "Each community retains its area, scaled by its typical annual surface-water delivery (median), and is colored by its assigned tiers.",
  },
  cwsTierRows: {
    title: "Community water systems grouped by tier",
    caption:
      "Equal-size rectangles emphasize how many community water systems fall within each tier.",
  },
  crossGroupComparison: {
    title: "Comparing tiers across water-user groups",
    caption:
      "Community water systems and agricultural areas are shown with equal-size units and a shared tier scale.",
  },
  continuousComparison: {
    title: "Position within each tier",
    caption:
      "Each unit moves to its continuous tier value, showing whether its outcome tends toward the better or worse edge of its discrete tier.",
  },
  scenarioComparison: {
    title: "Comparing system-wide outcomes across management strategies",
    caption:
      "Each scenario shows how the same locations are distributed across tiers, revealing changes in overall system performance and who benefits or faces greater risk.",
  },
} as const
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
          text: "COEQWAL cannot undo historical inequities, but it can make their impacts visible and support more informed decisions.",
        },
        {
          text: "Under the stress of climate change, communities and ecosystems can respond differently to water decisions.",
        },
        {
          text: "To understand how these responses shape water equity, COEQWAL simulates and evaluates the water allocation outcomes across different strategies, known as scenarios. ",
        },
      ],
      [
        {
          text: "Let's focus on one community in one community water system in one scenario to see how COEQWAL interprets drinking water futures.",
        },
      ],
    ],
  },
  {
    paragraphs: [
      [
        {
          text: "Each COEQWAL scenario simulates water deliveries across 100 years of hydrologic variability.",
        },
        {
          segments: [
            {
              text: "For each year, COEQWAL compares annual surface-water ",
            },
            { text: "delivery", mark: "strong" },
            {
              text: " with annual drinking-water ",
            },
            { text: "demand", mark: "strong" },
            { text: "." },
          ],
        },
        {
          text: "Each comparison becomes the percentage of demand met, which together show the reliability of deliveries and the severity of shortfalls.",
        },
      ],
    ],
  },
  {
    title: "From simulating to interpreting water allocation",
    paragraphs: [
      [
        {
          segments: [
            {
              text: "Looking at the possible range of annual allocation outcomes through Calsim simulations, COEQWAL researchers define ",
            },
            { text: "thresholds", mark: "strong" },
            {
              text: " that reflect the risk of water scarcity for communities and ecosystems.",
            },
          ],
        },

        {
          text: "In community water systems, these thresholds take into account the reliability of water deliveries and the severity of shortfalls.",
        },
      ],
      [
        {
          segments: [
            { text: "For example, a community is considered " },
            { text: "optimal", mark: "optimalName" },
            { text: " if " },
            {
              text: "more than 90% of demand is met in at least 90 years, and no year falls below 70%",
              mark: "optimalDefinition",
            },
            {
              text: ", which is not the case for this community in this scenario.",
            },
          ],
        },
      ],
    ],
  },
  {
    title: [
      { text: "Interpreting water allocation through " },
      { text: "tiers", mark: "strong" },
    ],
    paragraphs: [
      [
        {
          segments: [
            {
              text: "In COEQWAL, this community is considered ",
            },
            { text: "at risk", mark: "atRiskName" },
            { text: ", meaning that " },
            {
              text: "it is not meeting its water needs in a significant number of years",
              mark: "atRiskDefinition",
            },
            { text: "." },
          ],
        },
      ],
      [
        {
          segments: [
            { text: "This is how COEQWAL translates these outcomes into " },
            { text: "4 tiers", mark: "strong" },
            { text: " \u2014 " },
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
          text: "The tiers offer a shared scale to compare conditions of different drinking water communities within one scenario, allowing us to understand overall performance of community water systems.",
        },
      ],
    ],
  },
  {
    title: "Tiers: A common yardstick for distributional equity",
    paragraphs: [
      [
        {
          text: "Communities and ecosystems experience water decisions in different ways.",
        },
        {
          text: "Those outcomes are measured in different units and scales, making them difficult to compare.",
        },
      ],
      [
        {
          text: "COEQWAL translates these diverse outcomes into tiers, allowing us to see how impacts are distributed across communities and ecosystems.",
        },
      ],
    ],
  },
  {
    paragraphs: [
      [
        {
          text: "By placing outcomes for different water users on the same tier scale, COEQWAL can bring them together into a system-wide view.",
        },
        {
          text: "Comparing that view across scenarios shows how the overall water system performs under different water- management strategies, making it easier to see who benefits, who is at risk, and how those patterns shift under different decisions. ",
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

const comparisonTileSize = 14
const comparisonTileGap = 3
const continuousBinWidth = 0.2

function toScenarioTierData(
  locations: readonly TierLocationAssignment[] | undefined,
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

export default function Resolution() {
  return (
    <StickyScrollSection
      id="frame-7"
      ariaLabel="How COEQWAL translates modeled outcomes into tiers"
      height={`${frameCount * 200}vh`}
    >
      <Box
        sx={{
          width: "calc(100vw - 5rem)",
          height: "100dvh",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 50dvw" },
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
            maxWidth: "75ch",
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
  const { byScenario: tierQueries } = useStorylineTierAssignments()
  const s0020TierResults = tierQueries.s0020.data?.results
  const cwsTierLocations = useMemo(
    () =>
      s0020TierResults?.CWS_DEL?.locations.map((location) => ({
        locationId: location.location_id,
        tierLevel: location.tier_level,
        tierContinuous:
          location.tier_continuous === undefined
            ? location.tier_level
            : Number(location.tier_continuous),
      })) ?? cwsTiers.locations,
    [s0020TierResults],
  )
  const agricultureTierLocations = useMemo(
    () =>
      s0020TierResults?.AG_REV?.locations ??
      agricultureTiers.results.AG_REV.locations,
    [s0020TierResults],
  )
  const scenarioComparisons = useMemo(
    () => ({
      s0020: {
        cws: s0020TierResults?.CWS_DEL
          ? toScenarioTierData(s0020TierResults.CWS_DEL.locations)
          : cwsTierLocations.map((location) => ({
              id: location.locationId,
              tierLevel: location.tierLevel,
            })),
        agriculture: s0020TierResults?.AG_REV
          ? toScenarioTierData(s0020TierResults.AG_REV.locations)
          : agricultureTierLocations.map((location) => ({
              id: location.location_id,
              tierLevel: location.tier_level,
            })),
      },
      s0035: {
        cws: toScenarioTierData(
          tierQueries.s0035.data?.results.CWS_DEL?.locations,
        ),
        agriculture: toScenarioTierData(
          tierQueries.s0035.data?.results.AG_REV?.locations,
        ),
      },
      s0027: {
        cws: toScenarioTierData(
          tierQueries.s0027.data?.results.CWS_DEL?.locations,
        ),
        agriculture: toScenarioTierData(
          tierQueries.s0027.data?.results.AG_REV?.locations,
        ),
      },
    }),
    [
      agricultureTierLocations,
      cwsTierLocations,
      s0020TierResults,
      tierQueries.s0027.data,
      tierQueries.s0035.data,
    ],
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
  const scenarioComparisonProgress = useTransform(
    progress,
    [0.86, 0.89],
    [0, 1],
  )
  const s0035RevealProgress = useTransform(progress, [0.89, 0.91], [0, 1])
  const s0035MoveProgress = useTransform(progress, [0.91, 0.96], [0, 1])
  const s0027RevealProgress = useTransform(progress, [0.96, 0.975], [0, 1])
  const s0027MoveProgress = useTransform(progress, [0.975, 0.998], [0, 1])
  const discreteTierGuideOpacity = useTransform(
    () => equalTileProgress.get() * (1 - continuousTierProgress.get()),
  )
  const combinedTreemapOpacity = useTransform(
    () =>
      Math.max(treemapOpacity.get(), tierTreemapProgress.get()) *
      (1 - scenarioComparisonProgress.get()),
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
      (1 - scenarioComparisonProgress.get()),
  )
  const scenarioComparisonTitleOpacity = scenarioComparisonProgress
  return (
    <Box
      component="figure"
      sx={{
        m: 0,
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 0,
        boxSizing: "border-box",
        pt: {
          xs: "4px",
          md: "8px",
          lg: "clamp(10px, 1.5vh, 18px)",
          xl: "clamp(12px, 1.75vh, 22px)",
        },
        pr: {
          xs: "12px",
          md: "16px",
          lg: "clamp(36px, 3vw, 52px)",
          xl: "clamp(40px, 3.25vw, 64px)",
        },
        pb: {
          xs: "16px",
          md: "20px",
          lg: "clamp(40px, 5vh, 58px)",
          xl: "clamp(44px, 5.5vh, 68px)",
        },
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 720 900"
        role="img"
        aria-labelledby="unit-vis-title unit-vis-description"
        preserveAspectRatio="xMidYMid meet"
        sx={{
          display: "block",
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          maxHeight: "100%",
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
                Continuous tier
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
        <motion.image
          href="/map-icons/urban/water_user_urban-01.svg"
          x="285"
          y="385"
          width="150"
          height="150"
          style={{
            opacity: iconOpacity,
            filter: "drop-shadow(0 14px 22px rgba(0, 0, 0, 0.35))",
          }}
        />

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

        <motion.g style={{ opacity: scenarioComparisonProgress }}>
          <MiniScenarioTierPanel
            scenarioId="s0020"
            x={42}
            y={180}
            width={286}
            height={380}
            cws={scenarioComparisons.s0020.cws}
            agriculture={scenarioComparisons.s0020.agriculture}
            revealProgress={scenarioComparisonProgress}
          />
          <MiniScenarioTierPanel
            scenarioId="s0035"
            x={382}
            y={82}
            width={308}
            height={300}
            cws={scenarioComparisons.s0035.cws}
            agriculture={scenarioComparisons.s0035.agriculture}
            revealProgress={s0035RevealProgress}
            showTiles={false}
          />
          <MovingScenarioTiles
            source={{ x: 42, y: 180, width: 286, height: 380 }}
            target={{ x: 382, y: 82, width: 308, height: 300 }}
            sourceCws={scenarioComparisons.s0020.cws}
            sourceAgriculture={scenarioComparisons.s0020.agriculture}
            targetCws={scenarioComparisons.s0035.cws}
            targetAgriculture={scenarioComparisons.s0035.agriculture}
            progress={s0035MoveProgress}
          />
          <MiniScenarioTierPanel
            scenarioId="s0027"
            x={382}
            y={410}
            width={308}
            height={300}
            cws={scenarioComparisons.s0027.cws}
            agriculture={scenarioComparisons.s0027.agriculture}
            revealProgress={s0027RevealProgress}
            showTiles={false}
          />
          <MovingScenarioTiles
            source={{ x: 42, y: 180, width: 286, height: 380 }}
            target={{ x: 382, y: 410, width: 308, height: 300 }}
            sourceCws={scenarioComparisons.s0020.cws}
            sourceAgriculture={scenarioComparisons.s0020.agriculture}
            targetCws={scenarioComparisons.s0027.cws}
            targetAgriculture={scenarioComparisons.s0027.agriculture}
            progress={s0027MoveProgress}
          />
        </motion.g>

        <VisualizationTitleOverlay
          {...visualizationCopy.focusTreemap}
          opacity={focusTreemapTitleOpacity}
          x={50}
        />
        <VisualizationTitleOverlay
          {...visualizationCopy.annualDelivery}
          opacity={annualDeliveryTitleOpacity}
        />
        <VisualizationTitleOverlay
          {...visualizationCopy.demandMet}
          opacity={demandMetTitleOpacity}
        />
        <VisualizationTitleOverlay
          {...visualizationCopy.distribution}
          opacity={distributionTitleOpacity}
        />
        <VisualizationTitleOverlay
          {...visualizationCopy.optimal}
          opacity={optimalTitleOpacity}
        />
        <VisualizationTitleOverlay
          {...visualizationCopy.atRisk}
          opacity={atRiskTitleOpacity}
        />
        <VisualizationTitleOverlay
          {...visualizationCopy.tierTreemap}
          opacity={tierTreemapTitleOpacity}
          x={50}
        />
        <VisualizationTitleOverlay
          {...visualizationCopy.cwsTierRows}
          opacity={cwsTierRowsTitleOpacity}
          x={98}
        />
        <VisualizationTitleOverlay
          {...visualizationCopy.crossGroupComparison}
          opacity={discreteComparisonTitleOpacity}
          x={98}
        />
        <VisualizationTitleOverlay
          {...visualizationCopy.scenarioComparison}
          opacity={scenarioComparisonTitleOpacity}
          x={42}
        />
      </Box>
    </Box>
  )
}

type MiniScenarioBounds = {
  x: number
  y: number
  width: number
  height: number
}

const miniScenarioLabelWidth = 72
const miniScenarioHeaderHeight = 48
const miniScenarioFooterHeight = 42

function getMiniScenarioTileLayouts(
  bounds: MiniScenarioBounds,
  cws: readonly ScenarioTierDatum[],
  agriculture: readonly ScenarioTierDatum[],
) {
  const labelWidth = miniScenarioLabelWidth
  const headerHeight = miniScenarioHeaderHeight
  const footerHeight = miniScenarioFooterHeight
  const plotTop = bounds.y + headerHeight
  const plotHeight = bounds.height - headerHeight - footerHeight
  const rowHeight = plotHeight / 4
  const plotLeft = bounds.x + labelWidth
  const plotWidth = bounds.width - labelWidth
  const groupWidth = plotWidth / 2
  const tileSize = 6
  const tileGap = 1.5
  const columns = Math.max(
    1,
    Math.floor((groupWidth - 12) / (tileSize + tileGap)),
  )
  const layouts = new Map<string, TileLayout & { tierLevel: number }>()

  const addGroup = (
    group: "cws" | "agriculture",
    records: readonly ScenarioTierDatum[],
    groupX: number,
  ) => {
    ;([1, 2, 3, 4] as const).forEach((tierLevel) => {
      records
        .filter((record) => record.tierLevel === tierLevel)
        .forEach((record, index) => {
          layouts.set(`${group}:${record.id}`, {
            x: groupX + 6 + (index % columns) * (tileSize + tileGap),
            y:
              plotTop +
              (tierLevel - 1) * rowHeight +
              8 +
              Math.floor(index / columns) * (tileSize + tileGap),
            width: tileSize,
            height: tileSize,
            tierLevel,
          })
        })
    })
  }

  addGroup("cws", cws, plotLeft)
  addGroup("agriculture", agriculture, plotLeft + groupWidth)
  return layouts
}

function MovingScenarioTiles({
  source,
  target,
  sourceCws,
  sourceAgriculture,
  targetCws,
  targetAgriculture,
  progress,
}: {
  source: MiniScenarioBounds
  target: MiniScenarioBounds
  sourceCws: readonly ScenarioTierDatum[]
  sourceAgriculture: readonly ScenarioTierDatum[]
  targetCws: readonly ScenarioTierDatum[]
  targetAgriculture: readonly ScenarioTierDatum[]
  progress: MotionValue<number>
}) {
  const sourceLayouts = useMemo(
    () => getMiniScenarioTileLayouts(source, sourceCws, sourceAgriculture),
    [source, sourceAgriculture, sourceCws],
  )
  const targetLayouts = useMemo(
    () => getMiniScenarioTileLayouts(target, targetCws, targetAgriculture),
    [target, targetAgriculture, targetCws],
  )

  return (
    <g>
      {[...targetLayouts.entries()].map(([key, targetLayout]) => {
        const sourceLayout = sourceLayouts.get(key)
        return (
          <MovingScenarioTile
            key={`s0020-to-s0035-${key}`}
            source={sourceLayout ?? targetLayout}
            target={targetLayout}
            progress={progress}
            enters={!sourceLayout}
          />
        )
      })}
    </g>
  )
}

function MovingScenarioTile({
  source,
  target,
  progress,
  enters,
}: {
  source: TileLayout & { tierLevel: number }
  target: TileLayout & { tierLevel: number }
  progress: MotionValue<number>
  enters: boolean
}) {
  const x = useTransform(progress, [0, 1], [source.x, target.x])
  const y = useTransform(progress, [0, 1], [source.y, target.y])
  const fill = useTransform(
    progress,
    [0, 1],
    [tierColors[source.tierLevel], tierColors[target.tierLevel]],
  )
  const opacity = useTransform(
    progress,
    [0, 0.15, 1],
    enters ? [0, 1, 1] : [1, 1, 1],
  )

  return (
    <motion.rect
      x={x}
      y={y}
      width={target.width}
      height={target.height}
      fill={fill}
      stroke="rgba(252, 251, 250, 0.58)"
      strokeWidth="0.7"
      style={{ opacity }}
    />
  )
}

function MiniScenarioTierPanel({
  scenarioId,
  x,
  y,
  width,
  height,
  cws,
  agriculture,
  revealProgress,
  showTiles = true,
}: {
  scenarioId: string
  x: number
  y: number
  width: number
  height: number
  cws: readonly ScenarioTierDatum[]
  agriculture: readonly ScenarioTierDatum[]
  revealProgress: MotionValue<number>
  showTiles?: boolean
}) {
  const labelWidth = miniScenarioLabelWidth
  const headerHeight = miniScenarioHeaderHeight
  const footerHeight = miniScenarioFooterHeight
  const plotTop = y + headerHeight
  const plotHeight = height - headerHeight - footerHeight
  const rowHeight = plotHeight / 4
  const plotLeft = x + labelWidth
  const plotWidth = width - labelWidth
  const groupWidth = plotWidth / 2
  const dividerX = plotLeft + groupWidth
  const tileSize = 6
  const tileGap = 1.5
  const columns = Math.max(
    1,
    Math.floor((groupWidth - 12) / (tileSize + tileGap)),
  )
  const revealHeight = useTransform(revealProgress, [0, 1], [0, height])
  const clipId = `scenario-tier-panel-${scenarioId}`

  const renderTiles = (records: readonly ScenarioTierDatum[], groupX: number) =>
    ([1, 2, 3, 4] as const).flatMap((tierLevel) =>
      records
        .filter((record) => record.tierLevel === tierLevel)
        .map((record, index) => (
          <rect
            key={`${scenarioId}-${groupX}-${record.id}`}
            x={groupX + 6 + (index % columns) * (tileSize + tileGap)}
            y={
              plotTop +
              (tierLevel - 1) * rowHeight +
              8 +
              Math.floor(index / columns) * (tileSize + tileGap)
            }
            width={tileSize}
            height={tileSize}
            fill={tierColors[tierLevel]}
            stroke="rgba(252, 251, 250, 0.42)"
            strokeWidth="0.6"
          />
        )),
    )

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <motion.rect x={x} y={y} width={width} height={revealHeight} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <text x={x} y={y + 14} fill="#fcfbfa" fontSize="14" fontWeight="700">
          {(scenarioNames[scenarioId] ?? [scenarioId]).map((line, index) => (
            <tspan key={line} x={x} dy={index === 0 ? 0 : 16}>
              {line}
            </tspan>
          ))}
        </text>
        {[1, 2, 3, 4].map((tierLevel) => {
          const rowY = plotTop + (tierLevel - 1) * rowHeight

          return (
            <g key={`${scenarioId}-tier-${tierLevel}`}>
              <rect
                x={plotLeft}
                y={rowY}
                width={plotWidth}
                height={rowHeight}
                fill={tierColors[tierLevel]}
                fillOpacity="0.055"
              />
              <text
                x={plotLeft - 8}
                y={rowY + 17}
                textAnchor="end"
                fill={tierColors[tierLevel]}
                fontSize="13"
                fontWeight="700"
              >
                {tierNames[tierLevel]}
              </text>
              <line
                x1={plotLeft}
                x2={x + width}
                y1={rowY}
                y2={rowY}
                stroke={tierColors[tierLevel]}
                strokeOpacity="0.55"
                strokeWidth="0.7"
              />
            </g>
          )
        })}
        <line
          x1={dividerX}
          x2={dividerX}
          y1={plotTop}
          y2={plotTop + plotHeight}
          stroke="rgba(252, 251, 250, 0.5)"
          strokeWidth="0.8"
        />
        {showTiles ? renderTiles(cws, plotLeft) : null}
        {showTiles ? renderTiles(agriculture, dividerX) : null}
        <text
          x={plotLeft + groupWidth / 2}
          y={y + height - 22}
          textAnchor="middle"
          fill="#fcfbfa"
          fontSize="12"
          fontWeight="700"
        >
          <tspan x={plotLeft + groupWidth / 2}>Community water</tspan>
          <tspan x={plotLeft + groupWidth / 2} dy="14">
            systems
          </tspan>
        </text>
        <text
          x={dividerX + groupWidth / 2}
          y={y + height - 15}
          textAnchor="middle"
          fill="#fcfbfa"
          fontSize="12"
          fontWeight="700"
        >
          Agriculture
        </text>
      </g>
    </g>
  )
}

function VisualizationTitleOverlay({
  title,
  caption,
  opacity,
  x = 60,
  y = 792,
}: {
  title: string
  caption: string
  opacity: MotionValue<number>
  x?: number
  y?: number
}) {
  return (
    <motion.foreignObject
      x={x}
      y={y}
      width={720 - x - 16}
      height={96}
      style={{ opacity, pointerEvents: "none" }}
    >
      <div style={{ width: "100%", color: "#fcfbfa" }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: "-0.015em",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 3,
            color: "rgba(242, 240, 239, 0.7)",
            fontSize: 14,
            fontWeight: 400,
            lineHeight: 1.2,
          }}
        >
          {caption}
        </div>
      </div>
    </motion.foreignObject>
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
}: {
  discrete: TileLayout
  continuous: TileLayout
  color: string
  continuousProgress: MotionValue<number>
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
    <g>
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
        stroke={isFocus ? "#fcfbfa" : "rgba(252, 251, 250, 0.42)"}
        strokeWidth={isFocus ? 5 : 1.5}
      />
    </g>
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
