import React from "react"
import { useTheme } from "@mui/material/styles"
import { Box, Typography } from "@mui/material"
import { useTranslation } from "@repo/i18n"

const IntroInterstitial = () => {
  const theme = useTheme()
  const { t, isLoading } = useTranslation()
  
  let paragraphKeys: string[] = [];
  
  // Only try to get paragraph keys if not loading
  if (!isLoading) {
    // Manually create keys for the paragraphs
    for (let i = 1; i <= 1; i++) {  // todo: fix
      paragraphKeys.push(`pg${i}`);
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
    );
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
