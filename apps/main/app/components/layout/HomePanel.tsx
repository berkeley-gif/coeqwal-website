"use client" // Necessary for useTheme hook

import React from "react"
import { Typography, Container, Box } from "@mui/material"
import Image from "next/image"
import { useTheme } from "@mui/material/styles"
import Grid from "@mui/material/Grid2"
import { useTranslation } from "@repo/i18n"

const HomePanel: React.FC = () => {
  const theme = useTheme()
  const { t } = useTranslation()

  return (
    <Container
      style={{ backgroundColor: theme.palette.primary.main }}
      role="main"
    >
      <Grid container spacing={2}>
        <Grid size={5}>
          <Box>
            <Typography
              variant="h1"
              sx={{
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
    </Container>
  )
}

export default HomePanel
