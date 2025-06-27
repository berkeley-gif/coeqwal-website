"use client"

import { Box, Typography } from "@repo/ui/mui"
import { useEffect, useState } from "react"
import { useMap } from "@repo/map"
import useActiveSection from "../hooks/useActiveSection"
import useStoryStore from "../store"
import ConcentricCircle from "./vis/ConcentricCircle"
import Pictogram from "./vis/Pictogram"
import { PeopleIcon, MoneyBagIcon, FarmIcon } from "./helpers/Icons"
import React from "react"
import { useBreakpoint } from "@repo/ui/hooks"
import { concentricTransform } from "./helpers/breakpoints"
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "@repo/motion"

function SectionBenefits() {
  const pictogram = true

  return (
    <>
      {pictogram ? <CityPictogram /> : <CityConcentric />}
      <Agriculture />
      <Economy />
    </>
  )
}

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

  const norCalData = {
    past: { year: "in 1960 \u2014 ", value: 3373827, annotation: "3.37M" },
    present: {
      year: "in 2024 \u2014",
      value: 6551627,
      annotation: "6.55M",
    },
    icon: PeopleIcon,
    title: "SF Bay",
  }

  const soCalData = {
    past: { year: "in 1960 \u2014 ", value: 9007878, annotation: "9.00M" },
    present: {
      year: "in 2024 \u2014",
      value: 22095061,
      annotation: "22.01M",
    },
    icon: PeopleIcon,
    title: "SoCal",
  }

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

  const pictogramTransform = {
    lg: {
      norcal: {
        shift: {
          left: "38%",
          top: "2%",
        },
        scale: "scale(0.6)",
        iconSize: 24,
        spacing: 2,
      },
      socal: {
        shift: {
          left: "61%",
          top: "37%",
        },
        scale: "scale(0.6)",
        iconSize: 24,
        spacing: 2,
      },
    },
    xl: {
      norcal: {
        shift: {
          left: "45%",
          top: "2%",
        },
        scale: "scale(0.8)",
        iconSize: 32,
        spacing: 2.5,
      },
      socal: {
        shift: {
          left: "60%",
          top: "40%",
        },
        scale: "scale(0.8)",
        iconSize: 32,
        spacing: 2.5,
      },
    },
  }

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
          partialValue={norCalData.past.value}
          totalValue={norCalData.present.value}
          partialLabel={"in 1960 \u2014 3.37M"}
          totalLabel={"in 2024 \u2014 6.55M"}
          size={{ width: 600, height: 300 }}
          config={pictogramTransform[breakpoint]?.norcal}
          scrollYProgress={scrollYProgress}
        />
        <motion.div
          className="paragraph"
          style={{ opacity: sentenceOpacity, marginTop: "5rem" }}
        >
          <Typography>{content?.benefits.p1}</Typography>
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
        <Pictogram
          partialValue={soCalData.past.value}
          totalValue={soCalData.present.value}
          partialLabel={"in 1960 \u2014 9.00M"}
          totalLabel={"in 2024 \u2014 22.01M"}
          size={{ width: 600, height: 320 }}
          config={pictogramTransform[breakpoint]?.socal}
          scrollYProgress={scrollYProgress}
        />
      </Box>
    </Box>
  )
}

function CityConcentric() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact
  const { sectionRef } = useActiveSection("city", {
    amount: 0.5,
  })
  const { setPaintProperty } = useMap()
  const [startAnimation, setStartAnimation] = useState(false)
  const setTextMarkers = useStoryStore((state) => state.setTextMarkers)
  const breakpoint = useBreakpoint()
  const [hasSetMarkers, setHasSetMarkers] = useState(false)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const norCalData = {
    past: { year: "in 1960 \u2014 ", value: 3373827, annotation: "3.37M" },
    present: {
      year: "in 2024 \u2014",
      value: 6551627 * 2.5,
      annotation: "6.55M",
    },
    icon: PeopleIcon,
    title: "SF Bay",
  }

  const soCalData = {
    past: { year: "in 1960 \u2014 ", value: 9007878, annotation: "9.00M" },
    present: {
      year: "in 2024 \u2014",
      value: 22095061 * 2.5,
      annotation: "22.01M",
    },
    icon: PeopleIcon,
    title: "SoCal",
  }

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0.3 && latest < 0.8) {
      setPaintProperty("city-boundary-layer", "line-opacity", 1)
      if (!hasSetMarkers) {
        setTextMarkers(markers, "text")
        setHasSetMarkers(true)
      }
    } else if (latest < 0.3 || latest > 0.8) {
      setPaintProperty("city-boundary-layer", "line-opacity", 0)
      setTextMarkers([], "text")
      setHasSetMarkers(false)
    }
  })

  const sentenceOpacity = useTransform(scrollYProgress, [0.3, 0.5], [0, 1])

  useEffect(() => {
    const unsubscribe = sentenceOpacity.on("change", (value) => {
      if (value > 0.8) {
        setStartAnimation(true)
      }
    })
    return unsubscribe
  }, [sentenceOpacity])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="130vh"
      width="80vw"
      sx={{ justifyContent: "center" }}
    >
      <ConcentricCircle
        size={
          concentricTransform[breakpoint]?.norcal?.size ?? {
            width: 0,
            height: 0,
          }
        }
        data={norCalData}
        shift={concentricTransform[breakpoint]?.norcal?.shift ?? [0, 0]}
        clipId="norcal"
        delay={0}
        startAnimation={startAnimation}
        radius={concentricTransform[breakpoint]?.norcal?.radius ?? 10}
      />
      <motion.div className="paragraph" style={{ opacity: sentenceOpacity }}>
        <Typography>{content?.benefits.p1}</Typography>
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
          {" The circle radius linearly scales with the growth rate."}
        </Typography>
      </motion.div>
      <ConcentricCircle
        size={
          concentricTransform[breakpoint]?.socal?.size ?? {
            width: 0,
            height: 0,
          }
        }
        data={soCalData}
        shift={concentricTransform[breakpoint]?.socal?.shift ?? [0, 0]}
        clipId="socal"
        delay={1}
        startAnimation={startAnimation}
        radius={concentricTransform[breakpoint]?.socal?.radius ?? 10}
      />
    </Box>
  )
}

function Agriculture() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact
  const { sectionRef } = useActiveSection("agriculture", {
    amount: 0.5,
  })
  const [startAnimation, setStartAnimation] = useState(false)
  const breakpoint = useBreakpoint()

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const prodData = {
    past: { year: "in 1980 \u2014", value: 13987139000, annotation: "14B" },
    present: {
      year: "in 2023 \u2014",
      value: 59389887000,
      annotation: "59.3B",
    },
    icon: FarmIcon,
    title: "Yield",
  }

  const sentenceOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1])

  useEffect(() => {
    const unsubscribe = sentenceOpacity.on("change", (value) => {
      if (value > 0.8) {
        setStartAnimation(true)
      }
    })
    return unsubscribe
  }, [sentenceOpacity])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="70vh"
      width="70vw"
      sx={{ justifyContent: "center" }}
    >
      <motion.div className="paragraph" style={{ opacity: sentenceOpacity }}>
        <Typography> {content?.benefits.p2}</Typography>
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
          {" The circle radius linearly scales with the growth rate."}
        </Typography>
      </motion.div>
      <ConcentricCircle
        size={
          concentricTransform[breakpoint]?.agriculture?.size ?? {
            width: 0,
            height: 0,
          }
        }
        data={prodData}
        shift={concentricTransform[breakpoint]?.agriculture?.shift ?? [0, 0]}
        clipId="almond"
        delay={1}
        startAnimation={startAnimation}
        radius={concentricTransform[breakpoint]?.agriculture?.radius ?? 10}
      />
    </Box>
  )
}

function Economy() {
  const storyline = useStoryStore((state) => state.storyline)
  const content = storyline?.impact.benefits
  const { sectionRef } = useActiveSection("economy", {
    amount: 0.5,
  })
  const [startAnimation, setStartAnimation] = useState(false)
  const breakpoint = useBreakpoint()

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  })

  const economyData = {
    past: { year: "in 1980 \u2014", value: 327958, annotation: "$327B" },
    present: { year: "in 2024 \u2014", value: 4103124, annotation: "$4,103B" },
    icon: MoneyBagIcon,
    title: "GDP",
  }

  const sentenceOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1])

  useEffect(() => {
    const unsubscribe = sentenceOpacity.on("change", (value) => {
      if (value > 0.8) {
        setStartAnimation(true)
      }
    })
    return unsubscribe
  }, [sentenceOpacity])

  return (
    <Box
      ref={sectionRef}
      className="container"
      height="130vh"
      width="90vw"
      sx={{ justifyContent: "center" }}
    >
      <motion.div className="paragraph" style={{ opacity: sentenceOpacity }}>
        <Typography>{content?.p3}</Typography>
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
          {" The circle radius linearly scales with the growth rate."}
        </Typography>
      </motion.div>
      <ConcentricCircle
        size={
          concentricTransform[breakpoint]?.economy?.size ?? {
            width: 0,
            height: 0,
          }
        }
        data={economyData}
        shift={concentricTransform[breakpoint]?.economy?.shift ?? [0, 0]}
        clipId="economy"
        delay={1}
        startAnimation={startAnimation}
        radius={concentricTransform[breakpoint]?.economy?.radius ?? 10}
      />
    </Box>
  )
}

export default SectionBenefits
