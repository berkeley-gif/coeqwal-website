"use client" // necessary for useTheme hook (ugh, maybe change this)

import React, {
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react"
import { Typography, Container, Box, Button } from "@mui/material"
import { useTheme, Theme } from "@mui/material/styles"
import { useMediaQuery } from "@mui/material"
import { useMainAppTranslation } from "../../../i18n/useMainAppTranslation"
import VisibilityIcon from "@mui/icons-material/Visibility"
import { paragraphMapViews } from "../../../lib/mapViews"
import { useMap } from "../../context/MapContext"

interface CaliforniaWaterPanelProps {
  onFlyTo: (longitude: number, latitude: number, zoom?: number) => void
  onAnimateBands: () => void
}

const CaliforniaWaterPanel = forwardRef(function CaliforniaWaterPanel(
  { onFlyTo, onAnimateBands }: CaliforniaWaterPanelProps,
  ref
) {
  const theme = useTheme<Theme>()
  const { t } = useMainAppTranslation()
  const { setViewState } = useMap()
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

  const backgroundColor = isVisible ? "transparent" : theme.palette.secondary.main

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

  // This will animate if paragraphIndex === 0, flyto otherwise
  function handleVisibilityClick(paragraphIndex: number) {
    if (paragraphIndex === 0) {
      // Only animate the bands, no flyTo
      onAnimateBands()
    } else {
      const bpKey = getBreakpointKey()
      const coords = paragraphMapViews[paragraphIndex][bpKey]
      onFlyTo(coords.longitude, coords.latitude, coords.zoom)

      setViewState(prev => ({
        ...prev,
        ...coords,
        transitionDuration: 2000,
        bearing: 0,
        pitch: 0,
      }))
    }
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

  useImperativeHandle(ref, () => ({})) // If needed, expose methods

  return (
    <Container
      ref={panelRef}
      sx={{
        backgroundColor,
        transition: "background-color 3s ease-in-out",
        minHeight: "100vh",
        pointerEvents: "none",
        "& .MuiButton-root, & .MuiSvgIcon-root": {
          pointerEvents: "auto",
        },
      }}
      role="main"
    >
      <Box
        sx={{
          display: "grid",
          gap: { xs: 2, lg: 16 },
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }
        }}
      >
        {/* Left side text */}
        <Box>
          <Typography
            variant="h1"
            sx={{ whiteSpace: { xs: "normal", md: "pre-wrap" } }}
            gutterBottom
          >
            {t("CaliforniaWaterPanel.title")}
          </Typography>

          {paragraphKeys.map((key, i) => (
            <Typography key={i} variant="body1">
              {t(key)}
              <VisibilityIcon
                sx={{ ml: 1, cursor: "pointer" }}
                onClick={() => handleVisibilityClick(i)}
              />
            </Typography>
          ))}
        </Box>

        {/* Right side (currently empty) */}
        <Box
          sx={{
            order: { xs: 1, md: 2 },
            width: { xs: "80%", md: "100%" },
            margin: "0 auto",
          }}
        />
      </Box>

      <Button
        onClick={() => handleVisibilityClick(0)}
        sx={{ pointerEvents: "auto", mt: 3 }}
      >
        Animate bands (Paragraph 0)
      </Button>
    </Container>
  )
})

// Helps React DevTools identify this component
CaliforniaWaterPanel.displayName = "CaliforniaWaterPanel"

export default CaliforniaWaterPanel
