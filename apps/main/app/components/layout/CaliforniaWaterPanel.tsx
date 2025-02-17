"use client" // necessary for useTheme hook (ugh, maybe change this)

import React, { useRef, useState, useEffect } from "react"
import { Grid2, Typography, Container, Box, Button } from "@mui/material"
import { useTheme, Theme } from "@mui/material/styles"
import { useMediaQuery } from "@mui/material"
import { useMainAppTranslation } from "../../../i18n/useMainAppTranslation"
import VisibilityIcon from "@mui/icons-material/Visibility"
import { paragraphMapViews } from "../../../lib/mapViews"
import { useMap } from "../../context/MapContext"

interface CaliforniaWaterPanelProps {
  // The parent passes this in so we can call .flyTo() on the map
  onFlyTo: (longitude: number, latitude: number, zoom?: number) => void
}

export default function CaliforniaWaterPanel({ onFlyTo }: CaliforniaWaterPanelProps) {
  const theme = useTheme<Theme>()
  const { t } = useMainAppTranslation()
  const { setViewState } = useMap() // from MapContext
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    if (panelRef.current) {
      observer.observe(panelRef.current)
    }
    return () => {
      if (panelRef.current) {
        observer.unobserve(panelRef.current)
      }
    }
  }, [])

  // Ex: fade background color in/out if panel is visible
  const backgroundColor = isVisible ? "transparent" : theme.palette.secondary.main

  // Breakpoints
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

    // Imperatively fly the map
    onFlyTo(coords.longitude, coords.latitude, coords.zoom)

    // Optionally also update MapContext so your app state is consistent
    setViewState((prev) => ({
      ...prev,
      ...coords,
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
      <Button
        onClick={() => handleVisibilityClick(0)}
        sx={{
          pointerEvents: "auto",
          mt: 3,
        }}
      >
        Fly to Paragraph 0
      </Button>
    </Container>
  )
}
