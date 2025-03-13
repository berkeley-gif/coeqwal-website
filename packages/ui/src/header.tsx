"use client"

import { AppBar, Toolbar, Typography, Stack, Button } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { useMediaQuery } from "@mui/material"
import { LanguageSwitcher } from "./languageSwitcher"
import { useTranslation } from "@repo/i18n"

export const useResponsiveButtonVariant = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  return isMobile ? "text" : "pill"
}

export function Header() {
  const { t } = useTranslation()

  const buttonVariant = useResponsiveButtonVariant()

  return (
    <AppBar position="fixed" role="banner">
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography variant="h6">COEQWAL</Typography>
        <Stack direction="row" spacing={2}>
          <LanguageSwitcher />
          <Button
            variant={buttonVariant}
            sx={{
              border: buttonVariant === "text" ? "none" : undefined,
            }}
          >
            {t("header.buttons.getData")}
          </Button>
          <Button
            variant={buttonVariant}
            sx={{
              border: buttonVariant === "text" ? "none" : undefined,
            }}
          >
            {t("header.buttons.aboutCOEQWAL")}
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
