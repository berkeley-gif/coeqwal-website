"use client" // necessary for useTheme hook (ugh, maybe change this)

import React, { useRef, useState, useEffect } from "react"
import { Grid2, Typography, Container, Box, Button } from "@mui/material"
import { useTheme, Theme } from "@mui/material/styles"
import { useMediaQuery } from "@mui/material"
import { useMainAppTranslation } from "../../../i18n/useMainAppTranslation"
import VisibilityIcon from "@mui/icons-material/Visibility"
import { paragraphMapViews } from "../../../lib/mapViews"
import { useMap } from "../../context/MapContext"

const CaliforniaWaterPanel: React.FC = () => {
  const theme = useTheme<Theme>()
  const { t } = useMainAppTranslation()
  const { setViewState } = useMap() // direct from context

  // Detect when the panel enters the viewport and fade out the background color
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const currentRef = panelRef.current
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }, // 10% of the panel must be visible to trigger the fade out
    )

    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [])

  // When the panel is visible, switch the background color to "transparent"
  // otherwise, use the MUI theme's secondary color
  const backgroundColor = isVisible
    ? "transparent"
    : theme.palette.secondary.main

  // Identify which breakpoint class is active
  const isXs = useMediaQuery(theme.breakpoints.down("sm"))
  const isSm = useMediaQuery(theme.breakpoints.only("sm"))
  const isMd = useMediaQuery(theme.breakpoints.only("md"))
  const isLg = useMediaQuery(theme.breakpoints.only("lg"))
  const isXl = useMediaQuery(theme.breakpoints.only("xl"))

  function getBreakpointKey() {
    if (isXs) return "xs"
    if (isSm) return "sm"
    if (isMd) return "md"
    if (isLg) return "lg"
    if (isXl) return "xl"
    return "xl"
  }

  // Called on each paragraph icon click
  function handleVisibilityClick(paragraphIndex: number) {
    const bpKey = getBreakpointKey()
    const coords = paragraphMapViews[paragraphIndex][bpKey]

    setViewState((prev) => ({
      ...prev,
      ...coords,
      // If desired, add map transition (for react-map-gl < v8):
      // transitionDuration: 1000,
      // transitionInterpolator: new FlyToInterpolator(),
    }))
  }

  const paragraphKeys = [
    "CaliforniaWaterPanel.pg1",
    "CaliforniaWaterPanel.pg2",
    "CaliforniaWaterPanel.pg3",
    "CaliforniaWaterPanel.pg4",
    "CaliforniaWaterPanel.pg5",
    "CaliforniaWaterPanel.pg6",
    "CaliforniaWaterPanel.pg7",
  ] as const

  return (
    <Container
      ref={panelRef}
      // Smoothly transition the background color to transparent
      sx={{
        backgroundColor,
        transition: "background-color 3s ease-in-out",
        minHeight: "100vh",

        // Pass pointer events through the panel unless it's a button or icon
        pointerEvents: "none",
        "& .MuiButton-root, & .MuiSvgIcon-root": {
          pointerEvents: "auto",
        },
      }}
      role="main"
    >
      <Grid2 container spacing={{ xs: 2, lg: 16 }}>
        {/* Left side - Text content */}
        <Grid2 size={{ xs: 12, md: 6 }} order={{ xs: 2, md: 1 }}>
          <Typography
            variant="h1"
            sx={{
              whiteSpace: {
                xs: "normal",
                md: "pre-wrap",
              },
            }}
            gutterBottom
            aria-level={1}
          >
            {t("CaliforniaWaterPanel.title")}
          </Typography>
          {/* There are 7 paragraphs with their icons */}
          {paragraphKeys.map((key, i) => (
            <Typography key={i} variant="body1">
              {t(key)}
              <VisibilityIcon
                sx={{ ml: 1, cursor: "pointer" }}
                onClick={() => handleVisibilityClick(i)}
              />
            </Typography>
          ))}
        </Grid2>

        {/* Right side - currently empty */}
        <Grid2 size={{ xs: 12, md: 6 }} order={{ xs: 1, md: 2 }}>
          <Box
            sx={{
              width: {
                xs: "80%",
                md: "100%",
              },
              margin: "0 auto",
            }}
          ></Box>
        </Grid2>
      </Grid2>
      <Button onClick={() => alert("Clicked!")}>Click me</Button>
    </Container>
  )
}

export default CaliforniaWaterPanel
