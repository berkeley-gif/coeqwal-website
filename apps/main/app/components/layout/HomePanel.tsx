"use client" // Necessary for useTheme hook

import React, { useState, useEffect } from "react"
import { Typography, Container, Box } from "@mui/material"
import Image from "next/image"
import { useTheme } from "@mui/material/styles"
import { useMainAppTranslation } from "../../../i18n/useMainAppTranslation"
import { useUiLocale } from "@repo/ui/context/UiLocaleContext"
import Grid from "@mui/material/Grid2"

const HomePanel = () => {
  const theme = useTheme()
  const { t } = useMainAppTranslation()
  const { locale } = useUiLocale()
  const [clientReady, setClientReady] = useState(false)

  useEffect(() => {
    setClientReady(true)
  }, [])

  return (
    <Container
      style={{ backgroundColor: theme.palette.primary.main }}
      role="main"
    >
      {/* On the server, or prior to mount, render an empty shell to avoid mismatch */}
      {!clientReady ? (
        <Box style={{ minHeight: 200 /* or a spinner/skeleton */ }} />
      ) : (
        <Grid container spacing={2}>
          {/* Left side - Text content */}
          <Grid size={5}>
            <Box
              sx={{
                // maxWidth: {
                //   xs: "normal",
                //   md: locale === "en" ? "500px" : "normal",
                // },
              }}
            >
              <Typography
                variant="h1"
                sx={{
                  // maxWidth: {
                  //   xs: "normal",
                  //   md: locale === "en" ? "500px" : "normal",
                  // },
                  marginTop: "40vh",
                }}
                gutterBottom
                aria-level={1}
              >
                {t("homePanel.title")}
              </Typography>
              <Typography variant="body2">{t("homePanel.pg1")}</Typography>
            </Box>
          </Grid>

          {/* Right side - Hero image */}
          <Grid size={7}>
            <Box
              sx={{
                width: {
                  xs: "80%",
                  md: "100%",
                },
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
      )}
    </Container>
  )
}

export default HomePanel
