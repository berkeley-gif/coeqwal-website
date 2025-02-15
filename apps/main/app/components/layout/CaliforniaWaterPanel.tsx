"use client" // necessary for useTheme hook (ugh, maybe change this)

import React, { useRef, useState, useEffect } from "react"
import { Grid2, Typography, Container, Box } from "@mui/material"
import { useTheme } from '@mui/material/styles'

interface CaliforniaWaterPanelProps {
  // Add props
}

const CaliforniaWaterPanel: React.FC<CaliforniaWaterPanelProps> = () => {
  const theme = useTheme()

  // Detect when the panel enters the viewport and fade out the background color
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const currentRef = panelRef.current
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 } // 10% of the panel must be visible to trigger the fade out
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

  const handleButtonClick = () => {
    console.log("Button clicked")
  }

  return (
    <Container
      ref={panelRef}
      // Smoothly transition the background color to transparent
      sx={{
        backgroundColor,
        transition: "background-color 3s ease-in-out",
        minHeight: "100vh",
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
            {`California water`}
          </Typography>
          <Typography variant="body1" aria-label="Introduction">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </Typography>
          <button onClick={handleButtonClick}>Change View</button>
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
          >

          </Box>
        </Grid2>
      </Grid2>
    </Container>
  )
}

export default CaliforniaWaterPanel
