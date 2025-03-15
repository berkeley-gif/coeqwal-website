"use client"

import React, { useRef, forwardRef, useCallback, useEffect } from "react"
import { Typography, Container, Box } from "@mui/material"
import { useTheme, Theme } from "@mui/material/styles"
import { useTranslation } from "@repo/i18n"
import VisibilityIcon from "@mui/icons-material/Visibility"
import { initialMapView } from "../../../lib/mapViews"
import { useMap } from "../../context/MapContext"
import { LearnMoreButton } from "@repo/ui/learnMoreButton"

interface BaselinePanelProps {
  onFlyTo: (longitude: number, latitude: number, zoom?: number, pitch?: number, bearing?: number) => void
  onLearnMoreClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}

const BaselinePanel = forwardRef<HTMLDivElement, Omit<BaselinePanelProps, 'onFlyTo'>>(({
  onLearnMoreClick
}, ref) => {
  const theme = useTheme<Theme>()
  const { t, messages } = useTranslation()
  const { flyTo, setViewState } = useMap()
  const panelRef = useRef<HTMLDivElement>(null)

  // Setup IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry.isIntersecting) {
        flyTo(
          initialMapView.longitude,
          initialMapView.latitude,
          initialMapView.zoom,
          initialMapView.pitch,
          initialMapView.bearing
        )
      }
    }, {
      rootMargin: '100px'
    })

    if (panelRef.current) {
      observer.observe(panelRef.current)
    }

    return () => {
      if (panelRef.current) {
        observer.unobserve(panelRef.current)
      }
    }
  }, [flyTo])

  let paragraphKeys: string[] = []
  if (messages.BaselinePanel && typeof messages.BaselinePanel === "object" && "paragraphs" in messages.BaselinePanel) {
    const paragraphs = messages.BaselinePanel.paragraphs
    if (paragraphs && typeof paragraphs === "object") {
      paragraphKeys = Object.keys(paragraphs)
    }
  }

  return (
    <Container
      ref={ref}
      sx={{
        backgroundColor: "transparent",
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
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        }}
      >
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
              {t("BaselinePanel.title")}
            </Typography>
          {paragraphKeys.map((key, i) => (
            <Typography key={i} variant="body1">
              {t(`BaselinePanel.paragraphs.${key}`)}
              <VisibilityIcon
                sx={{ ml: 1, cursor: "pointer" }}
                onClick={() => flyTo(
                  initialMapView.longitude,
                  initialMapView.latitude,
                  initialMapView.zoom,
                  initialMapView.pitch,
                  initialMapView.bearing
                )}
              />
            </Typography>
          ))}
          <LearnMoreButton onClick={onLearnMoreClick} />
        </Box>
      </Box>
    </Container>
  )
})

// Helps React DevTools identify this component
BaselinePanel.displayName = "BaselinePanel"

export default BaselinePanel
