"use client"

import { Box, Typography } from "@repo/ui/mui"
import { useEffect, useState } from "react"
import { useMap } from "@repo/map"
import useActiveSection from "../hooks/useActiveSection"
import useStoryStore from "../store"
import Pictogram from "./vis/Pictogram"
import React from "react"
import { useBreakpoint } from "@repo/ui/hooks"
import { pictogramConfig, pictogramTransform } from "./helpers/breakpoints"
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "@repo/motion"

function SectionBenefits() {
  return (
    <>
      <CityPictogram />
      <Agriculture />
      <Economy />
    </>
  )
}

//TODO: fix the chart svg size 
function CityPictogram() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact
  const { sectionRef } = useActiveSection("city", {
    amount: 0.2,
  })
  const { setPaintProperty } = useMap()
  const setTextMarkers = useStoryStore((state) => state.setTextMarkers)
  const breakpoint = useBreakpoint() as keyof typeof pictogramTransform
  const [hasSetMarkers, setHasSetMarkers] = useState(false)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const markers = [
    {
      id: "norcal",
      name: "Southern California",
      latitude: 34.0522,
      longitude: -118.2437,
      radius: 100,
    },
    {
      id: "socal",
      name: "San Francisco Bay Area",
      latitude: 37.7749,
      longitude: -122.4194,
      radius: 100,
    },
  ]
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.2 && latest < 0.95) {
      setPaintProperty("city-boundary-layer", "line-opacity", 1)
      if (!hasSetMarkers) {
        setTextMarkers(markers, "text")
        setHasSetMarkers(true)
      }
    } else if (latest < 0.2 || latest > 0.95) {
      setPaintProperty("city-boundary-layer", "line-opacity", 0)
      setTextMarkers([], "text")
      setHasSetMarkers(false)
    }
  })

  const sentenceOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1])
  const captionOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 0.7])

  return (
    <Box
      height="auto"
      width="100%"
      sx={{
        position: "relative",
      }}
      tabIndex={-1}
      role="region"
    >
      <Box ref={sectionRef} height="150vh" width="100%"></Box>

      <Box
        className="sticky-container container"
        sx={{ justifyContent: "center" }}
      >
        <Pictogram
          partialValue={3373827}
          totalValue={6551627}
          partialLabel={"in 1960 \u2014 3.37M population"}
          totalLabel={"in 2024 \u2014 6.55M population"}
          size={{ width: 400, height: 200 }}
          config={pictogramTransform[breakpoint]?.norcal as pictogramConfig}
          scrollYProgress={scrollYProgress}
        />
        <motion.div
          className="paragraph"
          style={{ marginTop: "5rem" }}
        >
          <motion.div style={{ opacity: sentenceOpacity }}>
            <Typography>{content?.benefits.p1}</Typography>
          </motion.div>
          <motion.div style={{ opacity: captionOpacity }}>
          <Typography variant="caption">
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
            from the U.S. Census Bureau.
          </Typography>
          <Typography variant="caption">
            {" Each icon represents 1 million people."}
            </Typography>
          </motion.div>
        </motion.div>
        <Pictogram
          partialValue={9007878}
          totalValue={22095061}
          partialLabel={"in 1960 \u2014 9.00M population"}
          totalLabel={"in 2024 \u2014 22.01M population"}
          size={{ width: 500, height: 250 }}
          config={pictogramTransform[breakpoint]?.socal as pictogramConfig}
          scrollYProgress={scrollYProgress}
        />
      </Box>
    </Box>
  )
}

function Agriculture() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact
  const { sectionRef } = useActiveSection("agriculture", {
    amount: 0.5,
  })
  const breakpoint = useBreakpoint() as keyof typeof pictogramTransform

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start center", "end start"],
  })

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (value) => {
      console.log(value)
    })
    return unsubscribe
  })

  const sentenceOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1])
  const captionOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 0.7])

  return (
    <Box
      height="auto"
      width="100%"
      sx={{
        position: "relative",
      }}
      tabIndex={-1}
      role="region"
    >
      <Box ref={sectionRef} height="130vh" width="100%">
        {" "}
      </Box>
      <Box
        className="sticky-container container"
        sx={{ justifyContent: "end" }}
      >
        <motion.div
          className="paragraph"
          style={{marginBottom: "20%" }}
        >
          <motion.div style={{ opacity: sentenceOpacity }}>
            <Typography> {content?.benefits.p2}</Typography>
          </motion.div>
          <motion.div style={{ opacity: captionOpacity }}>
            <Typography variant="caption">
              Data source: Cash receipts by state from{" "}
              <a
                href="https://data.ers.usda.gov/reports.aspx?ID=4052#Pf221faeb8bdd40be9b9db688e7036405_19_17iT0R0x5"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "underline" }}
              >
                United States Department of Agriculture
              </a>{" "}
              in current dollars.
            </Typography>
            <Typography variant="caption">
              {" Each icon represents 1 billion dollars."}
            </Typography>
          </motion.div>
        </motion.div>
        <Pictogram
          partialValue={13987139000}
          totalValue={59389887000}
          unit={1000000000}
          partialLabel={"in 1980 \u2014 14B cash receipts"}
          totalLabel={"in 2023 \u2014 59.3B cash receipts"}
          size={{ width: 500, height: 340 }}
          config={
            pictogramTransform[breakpoint]?.agriculture as pictogramConfig
          }
          scrollYProgress={scrollYProgress}
        />
      </Box>
    </Box>
  )
}

function Economy() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact.benefits
  const { sectionRef } = useActiveSection("economy", {
    amount: 0.5,
  })
  const breakpoint = useBreakpoint()

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start center", "end start"],
  })

  const sentenceOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1])
  const captionOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 0.7])

  return (
    <Box
      height="auto"
      width="100%"
      sx={{
        position: "relative",
      }}
      tabIndex={-1}
      role="region"
    >
      <Box ref={sectionRef} height="130vh" width="100%">
        {" "}
      </Box>

      <Box
        className="sticky-container container"
        sx={{ justifyContent: "end" }}
      >
        <motion.div
          className="paragraph"
          style={{ marginBottom: "20%" }}
        >
          <motion.div style={{ opacity: sentenceOpacity }}>
            <Typography>{content?.p3}</Typography>
          </motion.div>
          <motion.div style={{ opacity: captionOpacity }}>
          <Typography variant="caption">
            Data source: GDP by state from{" "}
            <a
              href="https://www.bea.gov/data/gdp/gdp-state"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              U.S. Bureau of Economic Analysis
            </a>{" "}
            in current dollars.
          </Typography>
          <Typography variant="caption">
            {" Each icon represents 100 billion dollars."}
            </Typography>
          </motion.div>
          <Pictogram
            partialValue={327958}
            totalValue={4103124}
            unit={100000}
            partialLabel={"in 1980 \u2014 327B GDP"}
            totalLabel={"in 2024 \u2014 4,103B GDP"}
            size={{ width: 500, height: 350 }}
            config={pictogramTransform[breakpoint]?.economy as pictogramConfig}
            scrollYProgress={scrollYProgress}
          />
        </motion.div>
      </Box>
    </Box>
  )
}

export default SectionBenefits
