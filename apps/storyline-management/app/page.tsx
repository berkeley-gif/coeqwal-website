"use client"

import { useMemo } from "react"
import {
  BaseHeader,
  getWaterThemeOptions,
  goToMainAbout,
  goToMainData,
  goToMainHome,
  goToMainLearn,
  goToMainExplore,
} from "@repo/ui"
import { Box } from "@repo/ui/mui"

export default function ManagementContainer() {
  const waterThemesOptions = useMemo(() => getWaterThemeOptions(), [])

  return (
    <>
      <BaseHeader
        backgroundColor="overlay.waterDark"
        onLogoClick={goToMainHome}
        onAboutClick={goToMainAbout}
        onGetDataClick={goToMainData}
        onGetStartedClick={goToMainLearn}
        onToolsClick={goToMainExplore}
        waterThemesOptions={waterThemesOptions}
      />
      <Box
        component="main"
        sx={{
          position: "relative",
          color: "brand.textPrimary",
          minHeight: "100vh",
        }}
      >
        {/* Content will go here */}
      </Box>
    </>
  )
}
