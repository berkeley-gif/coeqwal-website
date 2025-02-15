"use client" // necessary for useTheme hook (ugh, maybe change this)

import React, { useState } from 'react'
import { Grid2, Typography, Container, Box } from "@mui/material"
import { useTheme } from '@mui/material/styles'

const CaliforniaWaterPanel: React.FC<CaliforniaWaterPanelProps> = () => {
  const theme = useTheme()

  const handleButtonClick = () => {
    console.log("Button clicked")
  }

  return (
    <Container style={{ backgroundColor: theme.palette.secondary.main }} role="main">
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
