"use client"

import { Box, Typography } from "@repo/ui/mui"
import { useRef } from "react"
import { useStoryline } from "../store"
import Pictogram from "./vis/Pictogram"
import React from "react"
import { useBreakpoint } from "@repo/ui/hooks"
import { pictogramConfig, pictogramTransform } from "./helpers/breakpoints"
import { motion, useScroll, useTransform } from "@repo/motion"

//TODO: fix the chart svg size
export default function CityPictogram() {
  const storyline = useStoryline()
  const content = storyline?.impact
  const sectionRef = useRef(null)
  const breakpoint = useBreakpoint() as keyof typeof pictogramTransform

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const sentenceOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.3, 0.95, 0.99],
    [0, 1, 1, 0],
  )
  const captionOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.3, 0.95, 0.99],
    [0, 0.7, 0.7, 0],
  )

  return (
    <Box
      height="auto"
      sx={{
        position: "relative",
      }}
      tabIndex={-1}
      role="region"
    >
      <Box
        ref={sectionRef}
        height="150vh"
        width="100%"
        sx={{ position: "relative" }}
      ></Box>

      <Box
        className="sticky-container"
        sx={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "clip",
          isolation: "isolate",
        }}
      >
        <Pictogram
          partialValue={3373827}
          totalValue={6551627}
          partialLabel={"in 1960 \u2014 3.37M population"}
          totalLabel={"in 2024 \u2014 6.55M population"}
          size={{ width: 450, height: 200 }}
          config={pictogramTransform[breakpoint]?.norcal as pictogramConfig}
          scrollYProgress={scrollYProgress}
        />
        <Box
          sx={{
            position: "absolute",
            top: "35%",
            left: 0,
            pointerEvents: "auto",
          }}
        >
          <motion.div className="paragraph" style={{ marginTop: "5rem" }}>
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
        </Box>
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

export function Agriculture() {
  const storyline = useStoryline()
  const content = storyline?.impact
  const sectionRef = useRef(null)
  const breakpoint = useBreakpoint() as keyof typeof pictogramTransform

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const sentenceOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.3, 0.9, 0.97],
    [0, 1, 1, 0],
  )
  const captionOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.3, 0.9, 0.97],
    [0, 0.7, 0.7, 0],
  )

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
      <Box ref={sectionRef} height="150vh" width="100%">
        {" "}
      </Box>
      <Box
        className="sticky-container container"
        sx={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "clip",
          isolation: "isolate",
          justifyContent: "end",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "65%",
            left: 0,
            transform: "translateY(-50%)",
            pointerEvents: "auto",
          }}
        >
          <motion.div className="paragraph" style={{ marginBottom: "20%" }}>
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
        </Box>
        <Pictogram
          partialValue={13987139000}
          totalValue={59389887000}
          unit={1000000000}
          partialLabel={"in 1980 \u2014 14B cash receipts"}
          totalLabel={"in 2023 \u2014 59.3B cash receipts"}
          size={{ width: 550, height: 340 }}
          config={
            pictogramTransform[breakpoint]?.agriculture as pictogramConfig
          }
          scrollYProgress={scrollYProgress}
        />
      </Box>
    </Box>
  )
}

export function Economy() {
  const storyline = useStoryline()
  const content = storyline?.impact.benefits
  const sectionRef = useRef(null)
  const breakpoint = useBreakpoint()

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const sentenceOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.3, 0.9, 0.97],
    [0, 1, 1, 0],
  )
  const captionOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.3, 0.9, 0.97],
    [0, 0.7, 0.7, 0],
  )

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
      <Box ref={sectionRef} height="150vh" width="100%">
        {" "}
      </Box>

      <Box
        className="sticky-container container"
        sx={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "clip",
          isolation: "isolate",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "65%",
            left: 0,
            transform: "translateY(-50%)",
            pointerEvents: "auto",
          }}
        >
          <motion.div className="paragraph" style={{ marginBottom: "20%" }}>
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
          </motion.div>
        </Box>
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
      </Box>
    </Box>
  )
}
