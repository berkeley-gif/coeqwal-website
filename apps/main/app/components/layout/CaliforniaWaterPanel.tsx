"use client" // necessary for useTheme hook (ugh, maybe change this)

import React, { useRef, useState, useEffect } from "react"
import { Grid2, Typography, Container, Box, Button } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { useMainAppTranslation } from "../../../i18n/useMainAppTranslation"
import VisibilityIcon from "@mui/icons-material/Visibility"

type CaliforniaWaterPanelProps = Record<string, unknown>

const CaliforniaWaterPanel: React.FC<CaliforniaWaterPanelProps> = () => {
  const theme = useTheme()
  const { t } = useMainAppTranslation()

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
          <Typography variant="body1">{t("CaliforniaWaterPanel.pg1")}<VisibilityIcon sx={{ ml: 1 }} /></Typography>
          <Typography variant="body1">{t("CaliforniaWaterPanel.pg2")}<VisibilityIcon sx={{ ml: 1 }} /></Typography>
          <Typography variant="body1">{t("CaliforniaWaterPanel.pg3")}<VisibilityIcon sx={{ ml: 1 }} /></Typography>
          <Typography variant="body1">{t("CaliforniaWaterPanel.pg4")}<VisibilityIcon sx={{ ml: 1 }} /></Typography>
          <Typography variant="body1">{t("CaliforniaWaterPanel.pg5")}<VisibilityIcon sx={{ ml: 1 }} /></Typography>
          <Typography variant="body1">{t("CaliforniaWaterPanel.pg6")}<VisibilityIcon sx={{ ml: 1 }} /></Typography>
          <Typography variant="body1">{t("CaliforniaWaterPanel.pg7")}<VisibilityIcon sx={{ ml: 1 }} /></Typography>
        </Grid2>

        {/* Right side - Hero image */}
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
