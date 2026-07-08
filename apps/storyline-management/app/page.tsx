"use client"

import { useMemo } from "react"
import {
  BaseHeader,
  getStorylineWaterThemesOptions,
  goToMainAbout,
  goToMainData,
  goToMainHome,
} from "@repo/ui"
import { Box } from "@repo/ui/mui"

export default function ManagementContainer() {
  const waterThemesOptions = useMemo(() => getStorylineWaterThemesOptions(), [])

  return (
    <>
      <BaseHeader
        backgroundColor="overlay.waterDark"
        onLogoClick={goToMainHome}
        onAboutClick={goToMainAbout}
        onGetDataClick={goToMainData}
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
