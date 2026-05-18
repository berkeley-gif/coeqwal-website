"use client"

import { useMemo } from "react"
import { BaseHeader } from "@repo/ui"
import { Box } from "@repo/ui/mui"

function getManagementThemesOptions() {
  return []
}

function goToMainHome() {
  window.location.href = "/"
}

function goToMainAbout() {
  window.location.href = "/about"
}

function goToMainData() {
  window.location.href = "/data"
}

export default function ManagementContainer() {
  const managementThemesOptions = useMemo(
    () => getManagementThemesOptions(),
    [],
  )

  return (
    <>
      <BaseHeader
        backgroundColor="overlay.waterDark"
        onLogoClick={goToMainHome}
        onAboutClick={goToMainAbout}
        onGetDataClick={goToMainData}
        waterThemesOptions={managementThemesOptions}
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
