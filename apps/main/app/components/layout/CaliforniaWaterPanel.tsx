"use client"

import React, {
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react"
import { Typography, Container, Box } from "@mui/material"
import { useTheme, Theme } from "@mui/material/styles"
import { useMediaQuery } from "@mui/material"
import { useTranslation } from "@repo/i18n"
import VisibilityIcon from "@mui/icons-material/Visibility"
import { paragraphMapViews } from "../../../lib/mapViews"
import { useMap } from "../../context/MapContext"
import { LearnMoreButton } from "@repo/ui/learnMoreButton"

interface CaliforniaWaterPanelProps {
  onFlyTo: (longitude: number, latitude: number, zoom?: number) => void
  onAnimateBands: () => void
  onLearnMoreClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}

const CaliforniaWaterPanel = forwardRef(function CaliforniaWaterPanel(
  { onFlyTo, onAnimateBands, onLearnMoreClick }: CaliforniaWaterPanelProps,
  ref,
) {
  const theme = useTheme<Theme>()
  const { t, isLoading, messages } = useTranslation()
  const { setViewState } = useMap()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [clientReady, setClientReady] = useState(false)

  useEffect(() => {
    const currentPanelRef = panelRef.current
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 },
    )
    if (currentPanelRef) {
      observer.observe(currentPanelRef)
    }
    return () => {
      if (currentPanelRef) {
        observer.unobserve(currentPanelRef)
      }
    }
  }, [])

  useEffect(() => {
    setClientReady(true)
  }, [])

  const backgroundColor = isVisible
    ? "transparent"
    : theme.palette.secondary.main

  const isXs = useMediaQuery(theme.breakpoints.down("sm"))
  const isSm = useMediaQuery(theme.breakpoints.only("sm"))
  const isMd = useMediaQuery(theme.breakpoints.only("md"))
  const isLg = useMediaQuery(theme.breakpoints.only("lg"))
  const isXl = useMediaQuery(theme.breakpoints.up("xl"))

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

      setViewState((prev) => ({
        ...prev,
        ...coords,
        transitionDuration: 2000,
        bearing: 0,
        pitch: 0,
      }))
    }
  }

  let paragraphKeys: string[] = []

  if (!isLoading) {
    try {
      const paragraphs = messages.CaliforniaWaterPanel?.paragraphs
      if (paragraphs && typeof paragraphs === "object") {
        paragraphKeys = Object.keys(paragraphs)
      }
    } catch (e) {
      console.error("Error accessing paragraph keys:", e)
    }
  }

  useImperativeHandle(ref, () => ({})) // If needed, expose methods

  if (isLoading) {
    // Return a placeholder that doesn't interfere with the IntersectionObserver
    return (
      <Container
        ref={panelRef}
        sx={{
          backgroundColor,
          transition: "background-color 3s ease-in-out",
          minHeight: "100vh",
        }}
        role="main"
      >
        <Box style={{ minHeight: 200 }} />
      </Container>
    )
  }

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
      {!clientReady ? (
        <Box style={{ minHeight: 200 }} />
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: { xs: 2, lg: 16 },
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          }}
        >
          {/* Left side text */}
          <Box
            sx={{
              marginTop: "150px",
            }}
          >
            <Typography
              variant="h1"
              sx={{ whiteSpace: { xs: "normal", md: "pre-wrap" } }}
              gutterBottom
            >
              {t("CaliforniaWaterPanel.title")}
            </Typography>

            {paragraphKeys.map((key, i) => (
              <Typography key={i} variant="body1">
                {t(`CaliforniaWaterPanel.paragraphs.${key}`)}
                <VisibilityIcon
                  sx={{ ml: 1, cursor: "pointer" }}
                  onClick={() => handleVisibilityClick(i)}
                />
              </Typography>
            ))}
            <LearnMoreButton onClick={onLearnMoreClick} />
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
      )}
    </Container>
  )
})

// Helps React DevTools identify this component
CaliforniaWaterPanel.displayName = "CaliforniaWaterPanel"

export default CaliforniaWaterPanel
