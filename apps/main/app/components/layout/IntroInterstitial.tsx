import React from "react"
import { useTheme } from "@mui/material/styles"
import { Box, Typography } from "@mui/material"
import { useTranslation } from "@repo/i18n"

const IntroInterstitial = () => {
  const theme = useTheme()
  const { t } = useTranslation()

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
      <Typography
        sx={{
          maxWidth: "800px",
        }}
        variant="h3"
      >
        {t("introInterstitial.pg1")}
      </Typography>
    </Box>
  )
}

export default IntroInterstitial
