"use client"

import { Paragraph, SectionTitle, Visualization } from "@repo/ui"
import { Box, useMediaQuery, useTheme } from "@repo/ui/mui"
import { motion } from "@repo/motion"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  StickyScrollSection,
  useScrollProgress,
  useScrollString,
  useScrollValue,
} from "@repo/scrollytelling"
import TemperatureLineChart from "./vis/TemperatureLineChart"
import SVGLineContainer from "./helpers/SVGLineContainer"
import temperatureContent from "../../public/locales/english/temperature.json"

const TEMPERATURE_GUIDE_VALUE = 57
const TEMPERATURE_GUIDE_OFFSET_PX = -8
const WARMING_TREND_VIEWBOX_HEIGHT = 952
const WARMING_TREND_BASE_Y = 262.094
const WARMING_TREND_DEFAULT_TRANSLATE_Y = 187
const WARMING_TREND_TEXT_OFFSET_Y = -32

type SceneKind = "builder" | "temperature"

function useResponsiveScene(scene: SceneKind) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"))
  const isCompact = useMediaQuery(theme.breakpoints.down("md"))
  const isWide = useMediaQuery(theme.breakpoints.up("xl"))

  return useMemo(() => {
    const height = (() => {
      if (scene === "builder") {
        if (isMobile) return "320svh"
        if (isTablet) return "290svh"
        if (isWide) return "240svh"
        return "260svh"
      }

      if (isMobile) return "340svh"
      if (isTablet) return "300svh"
      if (isWide) return "250svh"
      return "275svh"
    })()

    return {
      stickyProps: {
        height,
        stickyHeight: "100svh",
        stickyTop: 0,
      },
      isCompact,
      chartHeight: isMobile ? 300 : isTablet ? 380 : isWide ? 520 : 480,
      chartPlotWidthPercent: isCompact ? 100 : 90,
      chartAverageLabelPlacement: isCompact ? "below" : "right",
      titleVariant: isCompact ? "h6" : "h5",
    } as const
  }, [isCompact, isMobile, isTablet, isWide, scene])
}

export function TemperatureBuilder() {
  const scene = useResponsiveScene("builder")

  return (
    <StickyScrollSection
      id="opener-builder"
      ariaLabel="Temperature introduction"
      {...scene.stickyProps}
    >
      <TemperatureBuilderContent isCompact={scene.isCompact} />
    </StickyScrollSection>
  )
}

function TemperatureBuilderContent({ isCompact }: { isCompact: boolean }) {
  const progress = useScrollProgress()
  const linePath = useScrollValue(progress, [0.3, 0.7], [0, 1])
  const firstParagraphOpacity = useScrollValue(progress, [0.2, 0.45], [0, 1])
  const secondParagraphOpacity = useScrollValue(progress, [0.4, 0.65], [0, 1])
  const sectionBg = useScrollString(
    progress,
    [0, 0.5],
    ["rgba(46, 82, 130, 0.34)", "rgb(10, 23, 41)"],
  )

  return (
    <>
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: sectionBg,
          pointerEvents: "none",
        }}
      />

      <SVGLineContainer viewBox="0 0 1728 1095">
        <motion.path
          d="M1723 -29C1723 -29 2356 503 1440 211C524 -80.9998 -199 473 463 543C1125 613 1549 567 1187 811C825 1055 -181 1093 -181 1093"
          className="svg-line"
          pathLength={linePath}
        />
      </SVGLineContainer>

      <Box
        className="text-section"
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "100%",
          maxWidth: isCompact ? "42rem" : "64rem",
          mx: isCompact ? 0 : "auto",
          px: { xs: 2, sm: 4, md: 8, lg: 12 },
          py: { xs: 8, md: 10 },
          gap: { xs: 5, sm: 6, md: 8 },
        }}
      >
        <motion.div style={{ opacity: firstParagraphOpacity }}>
          <Paragraph
            className="paragraph"
            blocks={temperatureContent.builder.firstParagraph}
          />
        </motion.div>

        <motion.div style={{ opacity: secondParagraphOpacity }}>
          <Paragraph
            className="paragraph"
            blocks={temperatureContent.builder.secondParagraph}
          />
        </motion.div>
      </Box>
    </>
  )
}

export function Temperature() {
  const scene = useResponsiveScene("temperature")

  return (
    <StickyScrollSection
      id="temperature"
      ariaLabel="Temperature"
      {...scene.stickyProps}
    >
      <TemperatureContent scene={scene} />
    </StickyScrollSection>
  )
}

function TemperatureContent({
  scene,
}: {
  scene: ReturnType<typeof useResponsiveScene>
}) {
  const progress = useScrollProgress()
  const theme = useTheme()
  const warmingTrendAlignment = useWarmingTrendAlignment()

  const linePath = useScrollValue(progress, [0.6, 0.8], [0, 1])
  const textOpacity = useScrollValue(progress, [0.65, 0.75], [0, 1])
  const chartHeadingOpacity = useScrollValue(progress, [0, 0.4], [0, 1])
  const bottomTitleOpacity = useScrollValue(progress, [0.5, 0.72], [0, 1])
  const bottomParagraphOpacity = useScrollValue(progress, [0.7, 0.8], [0, 1])
  const sectionBg = useScrollString(
    progress,
    [0.35, 0.7],
    ["rgba(34, 63, 103, 0.56)", "#172a48"],
  )

  return (
    <Box
      ref={warmingTrendAlignment.sectionRef}
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
      }}
    >
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: sectionBg,
          pointerEvents: "none",
        }}
      />

      <SVGLineContainer viewBox="0 0 1728 952">
        <motion.path
          id="responsiveWarmingTrendPath"
          d="M-112 262.094C-112 262.094 1255 121.095 1546 21.0942C1837 -78.9061 1824 234.095 1678 490.095C1532 746.095 1767 1062.06 1273 1030.06"
          className="svg-line glow-effect"
          transform={`translate(50, ${warmingTrendAlignment.lineTranslateY})`}
          pathLength={linePath}
        />
        <motion.path
          id="responsiveWarmingTrendTextPath"
          d="M-112 262.094C-112 262.094 1255 121.095 1546 21.0942C1837 -78.9061 1824 234.095 1678 490.095C1532 746.095 1767 1062.06 1273 1030.06"
          fill="none"
          stroke="none"
          transform={`translate(50, ${warmingTrendAlignment.textTranslateY})`}
        />
        <motion.text
          fill="#F1B143"
          fontWeight="bold"
          style={{
            fontSize: theme.typography.caption.fontSize,
            opacity: textOpacity,
          }}
        >
          <textPath
            href="#responsiveWarmingTrendTextPath"
            startOffset={scene.isCompact ? "46%" : "38.5%"}
            textAnchor="middle"
          >
            {temperatureContent.warmingTrendLabel}
          </textPath>
        </motion.text>
      </SVGLineContainer>

      <Box
        className="text-section"
        sx={{
          position: "relative",
          display: "flex",
          width: "100%",
          minHeight: 0,
          flex: scene.isCompact ? "0 1 64%" : "0 1 70%",
          pt: { xs: 7, sm: 8, md: 10 },
          px: { xs: 1.5, sm: 3, md: 6, lg: 8 },
          pointerEvents: "auto",
        }}
      >
        <Visualization
          title={temperatureContent.chart.title}
          source={temperatureContent.chart.source}
          titleVariant={scene.titleVariant}
          headerSx={{
            width: "100%",
            maxWidth: scene.isCompact ? "100%" : "52rem",
          }}
          headerWrapper={(header) => (
            <motion.div style={{ opacity: chartHeadingOpacity }}>
              {header}
            </motion.div>
          )}
          sx={{ width: "100%" }}
        >
          <Box
            ref={warmingTrendAlignment.chartRef}
            sx={{
              width: "100%",
              overflow: "hidden",
            }}
          >
            <TemperatureLineChart
              scrollProgress={progress}
              temperatureGuideValue={TEMPERATURE_GUIDE_VALUE}
              onTemperatureGuideYChange={warmingTrendAlignment.setChartGuideY}
              chartHeight={scene.chartHeight}
              plotWidthPercent={scene.chartPlotWidthPercent}
              averageLabelPlacement={scene.chartAverageLabelPlacement}
            />
          </Box>
        </Visualization>
      </Box>

      <Box
        className="text-section"
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: scene.isCompact ? "center" : "start",
          width: "100%",
          minHeight: 0,
          flex: scene.isCompact ? "1 1 36%" : "1 1 30%",
          mt: { xs: 0, md: "-4rem", lg: "-5rem" },
          px: { xs: 2, sm: 4, md: 8, lg: 12 },
          pb: { xs: 5, md: 7 },
          pointerEvents: "auto",
        }}
      >
        <Box sx={{ maxWidth: { xs: "42rem", lg: "58rem" } }}>
          <motion.div style={{ opacity: bottomTitleOpacity }}>
            <SectionTitle
              className="paragraph"
              text={temperatureContent.future.title}
            />
          </motion.div>
          <motion.div style={{ opacity: bottomParagraphOpacity }}>
            <Paragraph
              className="paragraph"
              blocks={temperatureContent.future.body}
            />
          </motion.div>
        </Box>
      </Box>
    </Box>
  )
}

export default Temperature

function useWarmingTrendAlignment() {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<HTMLDivElement | null>(null)
  const [chartGuideY, setChartGuideY] = useState<number | null>(null)
  const [lineTranslateY, setLineTranslateY] = useState(
    WARMING_TREND_DEFAULT_TRANSLATE_Y,
  )

  const measure = useCallback(() => {
    const section = sectionRef.current
    const chart = chartRef.current
    if (!section || !chart || chartGuideY === null) return

    const sectionRect = section.getBoundingClientRect()
    const chartRect = chart.getBoundingClientRect()
    if (sectionRect.height <= 0) return

    const guideYInSection =
      chartRect.top -
      sectionRect.top +
      chartGuideY +
      TEMPERATURE_GUIDE_OFFSET_PX
    const guideYInViewBox =
      (guideYInSection / sectionRect.height) * WARMING_TREND_VIEWBOX_HEIGHT

    setLineTranslateY(guideYInViewBox - WARMING_TREND_BASE_Y)
  }, [chartGuideY])

  useEffect(() => {
    measure()

    const observer = new ResizeObserver(() => requestAnimationFrame(measure))
    const section = sectionRef.current
    const chart = chartRef.current

    if (section) observer.observe(section)
    if (chart) observer.observe(chart)
    window.addEventListener("resize", measure)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [measure])

  return {
    sectionRef,
    chartRef,
    lineTranslateY,
    textTranslateY: lineTranslateY + WARMING_TREND_TEXT_OFFSET_Y,
    setChartGuideY,
  }
}
