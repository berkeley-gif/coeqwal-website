import React from "react"
import { useTheme } from "@mui/material/styles"
import { Box, Typography } from "@mui/material"
import { useTranslation } from "@repo/i18n"

const IntroInterstitial = () => {
  const theme = useTheme()
  const { t, isLoading, messages } = useTranslation()

  let paragraphKeys: string[] = []

  if (!isLoading) {
    try {
      const introInterstitial = messages.introInterstitial
      if (
        introInterstitial &&
        typeof introInterstitial === "object" &&
        "paragraphs" in introInterstitial
      ) {
        const paragraphs = introInterstitial.paragraphs
        if (paragraphs && typeof paragraphs === "object") {
          paragraphKeys = Object.keys(paragraphs)
        }
      }
    } catch (e) {
      console.error("Error accessing paragraph keys:", e)
    }
  }

  // If still loading, show a minimal placeholder
  if (isLoading) {
    return (
      <Box
        sx={{
          backgroundColor: theme.palette.interstitial.main,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "200px 0",
        }}
      />
    )
  }

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.interstitial.main,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "200px 0",
      }}
    >
      {paragraphKeys.map((key, i) => (
        <Typography
          key={i}
          sx={{
            maxWidth: "800px",
          }}
          variant="h3"
        >
          {t(`introInterstitial.paragraphs.${key}`)}
        </Typography>
      ))}
    </Box>
  )
}

export default IntroInterstitial
