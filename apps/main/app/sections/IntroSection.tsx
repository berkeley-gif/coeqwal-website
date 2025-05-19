import React from "react"
import { BasePanel } from "@repo/ui"
import { Box, Typography, useTheme } from "@mui/material"

const IntroSection: React.FC = () => {
  const theme = useTheme()

  return (
    <BasePanel
      id="intro"
      fullHeight
      includeHeaderSpacing
      sx={{
        backgroundColor: "#fff",
        padding: { xs: 3, md: 6 },
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          ml: { xs: 3, md: 6 },
        }}
      >
        <Typography
          variant="h1"
          sx={{
            color: "#007C92",
            mb: 1,
            fontSize: "clamp(2rem, 6vw, 6rem)",
          }}
        >
          LEARN
        </Typography>
        <Typography
          variant="h1"
          sx={{
            color: "#007C92",
            mb: 1,
            fontSize: "clamp(2rem, 6vw, 6rem)",
          }}
        >
          EXPLORE
        </Typography>

        <Typography
          variant="h1"
          sx={{
            color: "#007C92",
            fontSize: "clamp(2rem, 6vw, 6rem)",
          }}
        >
          EMPOWER
        </Typography>
      </Box>
    </BasePanel>
  )
}

export default IntroSection
