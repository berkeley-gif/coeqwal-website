"use client"

import { Box, Typography, Stack, useTheme } from "@repo/ui/mui"
import TemperatureLineChart from "./vis/TemperatureLineChart"
import SVGLineContainer from "./helpers/SVGLineContainer"
import StickyContainer from "./helpers/StickyContainer"
import { motion, useScroll, useTransform } from "@repo/motion"
import { useRef } from "react"

//TODO: update text-section styles
export function TemperatureBuilder() {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })
  const linePath = useTransform(scrollYProgress, [0.3, 0.7], [0, 1])
  const sectionBg = useTransform(
    scrollYProgress,
    [0, 0.5],
    ["rgba(46, 82, 130, 0.34)", "rgba(34, 63, 103, 0.56)"],
  )

  return (
    <StickyContainer
      sectionID="opener-builder"
      stickyRollHeight="150vh"
      sectionRef={sectionRef}
    >
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

      {/* Text section*/}
      <Box
        className="text-section"
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "100%",
          paddingLeft: "30%",
          paddingRight: "20%",
        }}
      >
        <Box className="paragraph">
          <Typography variant="body1">
            {
              "California’s water system is under pressure to meet multiple demands."
            }
          </Typography>
          <Typography variant="body1">
            {"People need clean drinking water."}
          </Typography>
          <Typography variant="body1">
            {"Farms need water to grow food."}
          </Typography>
          <Typography variant="body1" gutterBottom>
            {"Fish and wildlife need water to survive."}
          </Typography>
          <Typography variant="body1" style={{ fontWeight: "bold" }}>
            {"Climate change is making matters worse."}
          </Typography>
        </Box>
        <Box
          className="paragraph"
          sx={{ marginTop: "6rem", marginBottom: "5rem" }}
        >
          <Typography variant="body1">
            <span className="highlight-text">{"Warmer temperatures"}</span>
            {", "}
          </Typography>
          <Typography variant="body1">
            {"less predictable rain and snow, "}
          </Typography>
          <Typography variant="body1">
            {"and higher sea levels are stressing"}
          </Typography>
          <Typography variant="body1">
            {"both our water infrastructure and living environment."}
          </Typography>
        </Box>
      </Box>
    </StickyContainer>
  )
}

export function Temperature() {
  const sectionRef = useRef(null)
  const theme = useTheme()

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  const linePath = useTransform(scrollYProgress, [0.6, 0.8], [0, 1])
  const textOpacity = useTransform(scrollYProgress, [0.65, 0.75], [0, 1])
  const sectionBg = useTransform(
    scrollYProgress,
    [0.35, 0.7],
    ["rgba(34, 63, 103, 0.56)", "#172a48"],
  )

  return (
    <StickyContainer
      sectionID="temperature"
      stickyRollHeight="200vh"
      sectionRef={sectionRef}
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
          id="warmingTrendPath"
          d="M-124 328.925C-124 328.925 1252 139.712 1543 39.7122C1834 -60.2881 1824 272.712 1688 528.712"
          //d="M-120 364.258C-120 364.258 976 229.257 1264 47.2572C1400.13 -38.7677 1585.63 8.97369 1728 110.281"
          className="svg-line glow-effect"
          transform="translate(50, 130)"
          pathLength={linePath}
          /*style={{
                strokeDasharray: pathLength,
                strokeDashoffset: pathLength * (1 - lineProgress),
                // Remove transition for direct control via scroll
                willChange: 'stroke-dashoffset'
            }}*/
        />
        <motion.path
          id="warmingTrendTextPath"
          d="M-124 328.925C-124 328.925 1252 139.712 1543 39.7122C1834 -60.2881 1824 272.712 1688 528.712"
          fill="none"
          stroke="none"
          transform="translate(50, 108)"
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
            href="#warmingTrendTextPath"
            startOffset="50.5%"
            textAnchor="middle"
          >
            Overall Warming Trend
          </textPath>
        </motion.text>
        {/* Arrow  */}
        {/* <g 
            transform="translate(1680, 80) rotate(-20)"
            style={{
            opacity: scrollProgress > 0.85 ? Math.min(1, (scrollProgress - 0.85) / 0.15) : 0,
            transition: 'opacity 0.2s ease-out'
            }}
        > 
            <path d="M1 2L29 11L13 35" stroke="#F1B143" strokeWidth="4" fill="none" />
        </g> */}
      </SVGLineContainer>

      <Box
        className="text-section"
        width="100%"
        height="70%"
        sx={{
          position: "relative",
          display: "flex",
          paddingTop: "5rem",
          pointerEvents: "auto",
        }}
      >
        <Stack
          direction="column"
          spacing={1}
          alignItems="flex-start"
          sx={{ width: "100%" }}
        >
          <Typography variant="h5" sx={{ textAlign: "left" }}>
            California Annual Average Temperature
          </Typography>
          <Typography
            variant="caption"
            sx={{ opacity: 0.7, textAlign: "left" }}
          >
            Data source:{" "}
            <a
              href="https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/statewide/time-series/4/tavg/12/12/1960-2026"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              NOAA
            </a>
          </Typography>
          <TemperatureLineChart scrollProgress={scrollYProgress} />
        </Stack>
      </Box>

      <Box
        width="100%"
        height="30%"
        className="text-section"
        sx={{
          position: "relative",
          display: "flex",
          marginTop: "-5rem",
          flexDirection: "column",
          justifyContent: "start",
          pointerEvents: "auto",
        }}
      >
        <Box className="paragraph">
          <Typography variant="h3">
            {"A "}
            <span className="highlight-text">Warmer</span>
            {" Future"}
          </Typography>
        </Box>
        <Box className="paragraph">
          <Typography variant="body1">
            {
              "Year after year, rising global temperatures reveal that our climate is changing. "
            }
          </Typography>
          <Typography variant="body1">
            {
              "Since 1960, California’s average temperature has increased by about 2°F (1.1°C). "
            }
          </Typography>
          <Typography variant="body1">
            {
              "Climate models predict that average temperatures may increase by an additional 6-9°F by the end of the century."
            }
          </Typography>
        </Box>
      </Box>
    </StickyContainer>
  )
}

export default Temperature
