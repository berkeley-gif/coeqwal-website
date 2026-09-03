"use client"

import { motion } from "@repo/motion"
import {
  StickyScrollSection,
  useScrollProgress,
  useScrollValue,
} from "@repo/scrollytelling"
import { useBreakpoint } from "@repo/ui/hooks"
import { Box, Stack, Typography, useMediaQuery } from "@repo/ui/mui"
import type { ReactNode } from "react"
import { useStoryline } from "../store"
import { pictogramConfig, pictogramTransform } from "./helpers/breakpoints"
import Pictogram from "./vis/Pictogram"

// Narrower laptop screens (or short-viewport wide screens) get a compact
// layout: pictogram(s) and text stacked in a single flex column instead of
// the full-bleed wide layout's absolutely-positioned overlay. Pictogram.tsx's
// config.shift left/top percentages are tuned for the full-width visual
// area, so compact mode centers pictograms with flexbox instead of relying
// on those percentages (see `layout="flow"` on Pictogram).
const compactBenefitsQuery =
  "(min-width: 1200px) and (max-width: 1535.95px), (min-width: 1200px) and (max-height: 800px)"

type BenefitTextProps = {
  sentence: ReactNode
  source: ReactNode
  sentenceOpacity: ReturnType<typeof useScrollValue>
  captionOpacity: ReturnType<typeof useScrollValue>
}

function BenefitText({
  sentence,
  source,
  sentenceOpacity,
  captionOpacity,
}: BenefitTextProps) {
  return (
    <Stack spacing={1} className="paragraph" sx={{ pointerEvents: "auto" }}>
      <motion.div style={{ opacity: sentenceOpacity }}>
        <Typography variant="body1">{sentence}</Typography>
      </motion.div>
      <motion.div style={{ opacity: captionOpacity }}>
        <Typography variant="caption" component="div">
          {source}
        </Typography>
      </motion.div>
    </Stack>
  )
}

type BenefitFrameProps = {
  isCompact: boolean
  /** Pictogram(s) rendered above the text (in compact mode's stacked column). */
  visualBefore: ReactNode
  /** An additional pictogram rendered below the text (compact mode only — e.g. City's second pictogram). */
  visualAfter?: ReactNode
  sentence: ReactNode
  source: ReactNode
  sentenceOpacity: ReturnType<typeof useScrollValue>
  captionOpacity: ReturnType<typeof useScrollValue>
  /** Wide-layout only: vertical position of the text block. */
  narrativeTop?: string
}

function BenefitFrame({
  isCompact,
  visualBefore,
  visualAfter,
  sentence,
  source,
  sentenceOpacity,
  captionOpacity,
  narrativeTop = "65%",
}: BenefitFrameProps) {
  const textProps = { sentence, source, sentenceOpacity, captionOpacity }

  if (isCompact) {
    // Compact (narrower laptop) layout: pictogram(s) and text share a single
    // stacked flex column so the vertical order (and therefore "pictogram
    // above text" / "text between the two pictograms") is guaranteed by DOM
    // order instead of independently-tuned absolute-position percentages.
    return (
      <Box
        sx={{
          position: "absolute",
          left: "0%",
          width: "58%",
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "2rem",
        }}
      >
        {visualBefore}
        <BenefitText {...textProps} />
        {visualAfter}
      </Box>
    )
  }

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      <Box aria-hidden sx={{ position: "absolute", inset: 0 }}>
        {visualBefore}
        {visualAfter}
      </Box>
      <Box
        component="article"
        sx={{
          position: "absolute",
          top: narrativeTop,
          left: 0,
          maxWidth: "68rem",
        }}
      >
        <BenefitText {...textProps} />
      </Box>
    </Box>
  )
}

export default function CityPictogram() {
  return (
    <StickyScrollSection
      id="benefits-city"
      ariaLabel="Population growth supported by California water infrastructure"
      height="180vh"
      stickyHeight="100vh"
      stickyTop={0}
    >
      <CityPictogramContent />
    </StickyScrollSection>
  )
}

function CityPictogramContent() {
  const content = useStoryline()?.impact
  const breakpoint = useBreakpoint() as keyof typeof pictogramTransform
  const isCompact = useMediaQuery(compactBenefitsQuery)
  const progress = useScrollProgress()
  const sentenceOpacity = useScrollValue(
    progress,
    [0.1, 0.3, 0.95, 0.99],
    [0, 1, 1, 0],
  )
  const captionOpacity = useScrollValue(
    progress,
    [0.1, 0.3, 0.95, 0.99],
    [0, 0.7, 0.7, 0],
  )
  return (
    <BenefitFrame
      isCompact={isCompact}
      narrativeTop="48%"
      sentence={content?.benefits.p1}
      sentenceOpacity={sentenceOpacity}
      captionOpacity={captionOpacity}
      source={
        <>
          Data source:{" "}
          <a
            href="https://www2.census.gov/library/publications/decennial/1960/population-volume-1/vol-01-06-c.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            1960
          </a>{" "}
          and{" "}
          <a
            href="https://www.census.gov/quickfacts/geo/chart/santaclaracountycalifornia/PST045224"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            2024
          </a>{" "}
          from the U.S. Census Bureau. Each icon represents 1 million people.
        </>
      }
      visualBefore={
        <Pictogram
          partialValue={3373827}
          totalValue={6551627}
          partialLabel="in 1960 — 3.37M population"
          totalLabel="in 2024 — 6.55M population"
          size={{ width: 450, height: 200 }}
          config={pictogramTransform[breakpoint]?.norcal as pictogramConfig}
          scrollYProgress={progress}
          layout={isCompact ? "flow" : "absolute"}
        />
      }
      visualAfter={
        <Pictogram
          partialValue={9007878}
          totalValue={22095061}
          partialLabel="in 1960 — 9.00M population"
          totalLabel="in 2024 — 22.01M population"
          size={{ width: 500, height: 250 }}
          config={pictogramTransform[breakpoint]?.socal as pictogramConfig}
          scrollYProgress={progress}
          layout={isCompact ? "flow" : "absolute"}
        />
      }
    />
  )
}

export function Agriculture() {
  return (
    <StickyScrollSection
      id="benefits-agriculture"
      ariaLabel="Growth in California agricultural productivity"
      height="180vh"
      stickyHeight="100vh"
      stickyTop={0}
    >
      <AgricultureContent />
    </StickyScrollSection>
  )
}

function AgricultureContent() {
  const content = useStoryline()?.impact
  const breakpoint = useBreakpoint() as keyof typeof pictogramTransform
  const isCompact = useMediaQuery(compactBenefitsQuery)
  const progress = useScrollProgress()
  const sentenceOpacity = useScrollValue(
    progress,
    [0.1, 0.3, 0.9, 0.97],
    [0, 1, 1, 0],
  )
  const captionOpacity = useScrollValue(
    progress,
    [0.1, 0.3, 0.9, 0.97],
    [0, 0.7, 0.7, 0],
  )
  return (
    <BenefitFrame
      isCompact={isCompact}
      narrativeTop="67%"
      sentence={content?.benefits.p2}
      sentenceOpacity={sentenceOpacity}
      captionOpacity={captionOpacity}
      source={
        <>
          Data source: Cash receipts by state from{" "}
          <a
            href="https://data.ers.usda.gov/reports.aspx?ID=4052#Pf221faeb8bdd40be9b9db688e7036405_19_17iT0R0x5"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            United States Department of Agriculture
          </a>{" "}
          in current dollars. Each icon represents 1 billion dollars.
        </>
      }
      visualBefore={
        <Pictogram
          partialValue={13987139000}
          totalValue={59389887000}
          unit={1000000000}
          partialLabel="in 1980 — 14B cash receipts"
          totalLabel="in 2023 — 59.3B cash receipts"
          size={{ width: 550, height: 340 }}
          config={
            pictogramTransform[breakpoint]?.agriculture as pictogramConfig
          }
          scrollYProgress={progress}
          layout={isCompact ? "flow" : "absolute"}
        />
      }
    />
  )
}

export function Economy() {
  return (
    <StickyScrollSection
      id="benefits-economy"
      ariaLabel="Growth in California's economy"
      height="180vh"
      stickyHeight="100vh"
      stickyTop={0}
    >
      <EconomyContent />
    </StickyScrollSection>
  )
}

function EconomyContent() {
  const content = useStoryline()?.impact.benefits
  const breakpoint = useBreakpoint() as keyof typeof pictogramTransform
  const isCompact = useMediaQuery(compactBenefitsQuery)
  const progress = useScrollProgress()
  const sentenceOpacity = useScrollValue(
    progress,
    [0.1, 0.3, 0.9, 0.97],
    [0, 1, 1, 0],
  )
  const captionOpacity = useScrollValue(
    progress,
    [0.1, 0.3, 0.9, 0.97],
    [0, 0.7, 0.7, 0],
  )
  return (
    <BenefitFrame
      isCompact={isCompact}
      narrativeTop="79%"
      sentence={content?.p3}
      sentenceOpacity={sentenceOpacity}
      captionOpacity={captionOpacity}
      source={
        <>
          Data source: GDP by state from{" "}
          <a
            href="https://www.bea.gov/data/gdp/gdp-state"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            U.S. Bureau of Economic Analysis
          </a>{" "}
          in current dollars. Each icon represents 100 billion dollars.
        </>
      }
      visualBefore={
        <Pictogram
          partialValue={327958}
          totalValue={4103124}
          unit={100000}
          partialLabel="in 1980 — 327B GDP"
          totalLabel="in 2024 — 4,103B GDP"
          size={{ width: 500, height: 350 }}
          config={pictogramTransform[breakpoint]?.economy as pictogramConfig}
          scrollYProgress={progress}
          layout={isCompact ? "flow" : "absolute"}
        />
      }
    />
  )
}
