"use client" // Necessary for useTheme hook

import React from "react"
import { Typography, Container, Box } from "@mui/material"
import Image from "next/image"
import { useTheme } from "@mui/material/styles"
import Grid from "@mui/material/Grid2"
import { useTranslation } from "@repo/i18n"

const HomePanel: React.FC = () => {
  const theme = useTheme()
  const { t, messages } = useTranslation()

  let paragraphKeys: string[] = []

  try {
    const homePanel = messages.homePanel
    if (
      homePanel &&
      typeof homePanel === "object" &&
      "paragraphs" in homePanel
    ) {
      const paragraphs = homePanel.paragraphs
      if (paragraphs && typeof paragraphs === "object") {
        paragraphKeys = Object.keys(paragraphs)
      }
    }
  } catch (e) {
    console.error("Error accessing paragraph keys:", e)
  }

  return (
    <Container
      style={{ backgroundColor: theme.palette.primary.main }}
      role="main"
    >
      <Grid container spacing={2}>
        <Grid size={6}>
          <Box>
            <Typography
              variant="h1"
              sx={{
                marginTop: "40vh",
                paddingRight: "50px",
              }}
              gutterBottom
              aria-level={1}
            >
              {t("homePanel.title")}
            </Typography>
            {paragraphKeys.map((key, i) => (
              <Typography key={i} variant="body2">
                {t(`homePanel.paragraphs.${key}`)}
              </Typography>
            ))}
          </Box>
        </Grid>

        <Grid size={6} sx={{ position: "relative" }}>
          <Box
            sx={{
              position: "absolute",
              top: "40px",
              left: "-40px",
              width: "112%",
              height: "auto",
              margin: "0 auto",
            }}
          >
            <Image
              src="/images/hero.png"
              alt="Illustration of people living in a community in a California landscape with mountains, meadows, forests, and rivers"
              width={1893}
              height={1584}
              style={{
                width: "100%",
                height: "auto",
                objectFit: "contain",
                objectPosition: "center",
                marginTop: "10vh",
              }}
              role="img"
              aria-hidden="false"
            />
          </Box>
        </Grid>
      </Grid>
    </Container>
  )
}

export default HomePanel
