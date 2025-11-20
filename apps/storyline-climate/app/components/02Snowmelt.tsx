"use client"

import { Box, Typography, SvgIcon } from "@repo/ui/mui"
import { motion, useScroll, useTransform } from "@repo/motion"
import useActiveSection from "../hooks/useActiveSection"
import SnowpackContainer from "./vis/Snowpack"
import TemperatureLineChart from "./vis/TemperatureLineChart"
import { OffWhiteColor } from "./helpers/colorPalette"
import { useEffect, useRef, useState } from "react"
import { useInView } from "framer-motion"

function SectionStarter() {
  return (
    <>
      <Temperature />
      <Snowmelt />
    </>
  )
}

function Temperature() {
  const { sectionRef } = useActiveSection("temperature", { amount: 0.5 })
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      // Cancel any pending animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      // Use requestAnimationFrame for smoother updates
      rafRef.current = requestAnimationFrame(() => {
        if (!containerRef.current) return

        const container = containerRef.current
        const rect = container.getBoundingClientRect()
        const windowHeight = window.innerHeight

        // Calculate how far through the sticky container we've scrolled
        const containerHeight = container.offsetHeight
        const contentHeight = windowHeight
        const scrollRange = containerHeight - contentHeight

        // Progress from 0 to 1 as we scroll through the container
        let progress = -rect.top / scrollRange
        progress = Math.max(0, Math.min(1, progress))

        setScrollProgress(progress)
      })
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const pathLength = 2500

  return (
    // Outer container that creates the scroll range
    <div
      ref={containerRef}
      style={{
        position: "relative",
        height: "300vh", // 3x viewport height for scroll range
        width: "100%",
      }}
    >
      {/* Sticky inner container using your CSS class */}
      <Box
        id="temperature"
        className="container-left sticky-container"
        ref={sectionRef}
        tabIndex={-1}
        role="region"
        sx={{
          position: "sticky",
          top: 0,
          paddingLeft: "5rem",
          paddingRight: "5rem",
          color: OffWhiteColor,
        }}
      >
        {/* ===== Background Line SVG===== */}
        <Box
          component="svg"
          viewBox="0 0 1728 367"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMinYMid meet"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
            pointerEvents: "none",
            opacity: 0.6,
          }}
        >
          <path
            d="M-120 364.258C-120 364.258 976 229.257 1264 47.2572C1400.13 -38.7677 1585.63 8.97369 1728 110.281"
            stroke="#F1B143"
            strokeWidth="4"
            fill="none"
            transform="translate(0, -270)"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: pathLength,
              strokeDashoffset: pathLength * (1 - scrollProgress),
              // Remove transition for direct control via scroll
              willChange: "stroke-dashoffset",
            }}
          />

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
        </Box>

        {/* ===== Foreground Chart ===== */}
        <Box
          width="100%"
          height="60%"
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: "5rem",
            zIndex: 1,
          }}
        >
          <TemperatureLineChart />
        </Box>

        {/* ===== Text Section ===== */}
        <Box
          width="100%"
          height="40%"
          className="text-container-left"
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <Box className="paragraph">
            <Typography variant="body1">
              California's water system is under pressure to meet multiple
              demands.
            </Typography>
            <Typography variant="body1">
              People need clean drinking water. Farms need water to grow food.
              Fish and wildlife need water to survive.
            </Typography>
          </Box>
          <Box className="paragraph">
            <Typography variant="body1">
              Climate change is making matters worse.
            </Typography>
          </Box>
          <Box className="paragraph">
            <Typography variant="body1">
              Warmer temperatures, less predictable rain and snow, and higher
              sea levels are stressing both our water infrastructure and living
              environment.
            </Typography>
          </Box>
          <Box
            className="paragraph"
            component="article"
            aria-labelledby="opener-throughline"
          >
            <Typography
              id="throughline-heading"
              variant="body1"
              sx={{ fontWeight: "bold" }}
            >
              How can we limit the impacts of climate change on California's
              water future?
            </Typography>
          </Box>
        </Box>
      </Box>
    </div>
  )
}

function Snowmelt() {
  const { sectionRef } = useActiveSection("snowmelt", { amount: 0.5 })
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const [scrollProgress, setScrollProgress] = useState(0) // 0..1

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const el = containerRef.current
        if (!el) return

        const rect = el.getBoundingClientRect()
        const winH = window.innerHeight
        const containerH = el.offsetHeight
        const contentH = winH
        const scrollRange = Math.max(1, containerH - contentH)

        let p = -rect.top / scrollRange // 0..1 as we pass the sticky window
        if (p < 0) p = 0
        else if (p > 1) p = 1

        setScrollProgress(p)
      })
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // You can tweak this if your path is longer/shorter than Temperature’s.
  // (Or swap to getTotalLength() if you want auto-measure.)
  const pathLength = 2500

  return (
    // Outer container creates scroll range
    <div
      ref={containerRef}
      style={{
        position: "relative",
        height: "300vh",
        width: "100%",
      }}
    >
      {/* Sticky inner container */}
      <Box
        id="snowmelt"
        className="container-row sticky-container"
        ref={sectionRef}
        tabIndex={-1}
        role="region"
        sx={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: "100%",
          overflow: "hidden",
          color: OffWhiteColor,
        }}
      >
        {/* ===== Background Line SVG ===== */}
        <Box
          component="svg"
          viewBox="0 0 1608 647"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMinYMid meet"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
            pointerEvents: "none",
            opacity: 0.6,
          }}
        >
          <path
            d="M2 -33C2 -33 196 235 658 343C1120 451 1702 645 1702 645"
            stroke="#F1B143"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform="translate(0, -120)" // can be adjusted
            style={{
              strokeDasharray: pathLength,
              strokeDashoffset: pathLength * (1 - scrollProgress),
              willChange: "stroke-dashoffset",
            }}
          />
        </Box>

        {/* ===== Foreground content (Left column text) ===== */}
        <Box
          width="50%"
          height="100%"
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 2,
            position: "relative",
            zIndex: 1,
            pr: "10px",
          }}
        >
          <Box className="paragraph" component="article">
            <Typography variant="h4">
              {"Losing Nature's Water Storage"}
            </Typography>
          </Box>
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {
                "For decades, California has relied on mountain snowpacks as a natural water storage."
              }
            </Typography>
            <Typography variant="body1">
              {
                "Snow builds up in winter, then melts slowly, feeding rivers through the long, dry summer."
              }
            </Typography>
            <Typography variant="body1">
              {
                "The snowmelt has consistently maintained river flows to provide water for farms, cities, and ecosystems."
              }
            </Typography>
          </Box>
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {"But warmer winters mean "}
              <span className="highlight-text">
                {"more precipitation falls as rain"}
              </span>
              {" instead of snow. And "}
              <span className="highlight-text">
                {"the snowpack we do receive melts earlier"}
              </span>
              {" in the year."}
            </Typography>
            <Typography variant="body1">
              {
                "Higher temperatures also cause water to evaporate faster from soils and plants."
              }
            </Typography>
          </Box>
          <Box className="paragraph" component="article">
            <Typography variant="body1">
              {"The impact is that "}
              <span style={{ fontWeight: "bold" }}>
                {"less water is available"}
              </span>
              {
                " in rivers and reservoirs during the dry summer when we — humans and ecosystems — "
              }
              <span style={{ fontWeight: "bold" }}>{"need it most"}</span>
              {"."}
            </Typography>
          </Box>
        </Box>

        {/* ===== Right column: icon + chart ===== */}
        <Box
          width="50%"
          height="100%"
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            px: "20px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Box
            component="img"
            src="/icons/snowflake_icon.svg"
            alt="Snowflake icon"
            sx={{
              display: "block",
              mb: 2,
              ml: 2,
              width: 48,
              height: 48,
              filter: "invert(1) brightness(100%)",
            }}
          />
          <Box width="100%" height="50%">
            <SnowpackContainer />
          </Box>
        </Box>
      </Box>
    </div>
  )
}

export default SectionStarter
