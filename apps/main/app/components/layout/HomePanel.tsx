"use client" // Necessary for useTheme hook

import React from "react"
import { Typography, Container, Box } from "@mui/material"
import Image from "next/image"
import { useTheme } from "@mui/material/styles"
import { useTranslation } from "@repo/i18n"

const HomePanel = () => {
  const theme = useTheme()
  const { t } = useTranslation()

  return (
    <Container
      style={{ backgroundColor: theme.palette.primary.main }}
      role="main"
    >
      <Box
        sx={{ display: "grid", gap: 4, gridTemplateColumns: { md: "1fr 1fr" } }}
      >
        {/* Left side - Text content */}
        <Box>
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
            {t("homePanel.title")}
          </Typography>
          <Typography variant="body1">{t("homePanel.pg1")}</Typography>
          <Typography variant="body1">{t("homePanel.pg2")}</Typography>
          <Typography variant="body1">{t("homePanel.pg3")}</Typography>
          <Typography variant="body1">{t("homePanel.pg4")}</Typography>
        </Box>

        {/* Right side - Hero image */}
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
            }}
            role="img"
            aria-hidden="false"
          />
        </Box>
      </Box>
    </Container>
  )
}

export default HomePanel
