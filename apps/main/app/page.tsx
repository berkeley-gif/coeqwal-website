"use client"

import React, { useState } from "react"
import dynamic from "next/dynamic"
import { Box, WaterIcon } from "@repo/ui/mui"
import {
  Header,
  MiniDrawer,
  VerticalDivider,
  SettingsIcon,
  ReportProblemIcon,
  SwapHorizIcon,
  BarChartIcon,
  SlideshowIcon,
} from "@repo/ui"
import { useTranslation } from "@repo/i18n"
import { HeroPanel, TwoColumnPanel } from "@repo/ui"

// Dynamic import components that use client-side features
const MapContainer = dynamic(() => import("./components/MapContainer"), {
  ssr: false, // Disable server-side rendering
})

// Dynamic import the combined panel
const CombinedPanel = dynamic(
  () => import("./features/combinedPanel/CombinedPanel"),
  {
    ssr: true,
  },
)

export default function Home() {
  const { t } = useTranslation()
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [activeSection, setActiveSection] = useState("")

  // Function to check which section is currently visible
  const checkActiveSection = () => {
    const sectionIds = [
      "california-water-panel",
      "managing-water",
      "challenges",
      "alternative-scenarios",
      "scenario-data",
      "presentation-tools",
    ]

    // Find the first section that's currently visible in the viewport
    for (const id of sectionIds) {
      const element = document.getElementById(id)
      if (element) {
        const rect = element.getBoundingClientRect()
        // Check if the element is at least partially visible in the viewport
        if (rect.top <= 100 && rect.bottom >= 100) {
          setActiveSection(id)
          return
        }
      }
    }

    // If no section is active (e.g., at the very top of the page)
    setActiveSection("")
  }

  // Add scroll listener
  React.useEffect(() => {
    window.addEventListener("scroll", checkActiveSection)
    checkActiveSection()

    // Cleanup
    return () => {
      window.removeEventListener("scroll", checkActiveSection)
    }
  }, [])

  // Function to scroll to an element by ID with smooth animation
  const scrollToSection = (elementId: string) => {
    const element = document.getElementById(elementId)
    if (element) {
      // Use the native scrollIntoView with smooth behavior
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })

      setActiveSection(elementId)

      // Close the drawer after navigation
      setDrawerOpen(false)
    }
  }

  // Navigation items for the sidebar drawer
  const navigationItems = [
    {
      text: "How water moves through California",
      icon: <WaterIcon />,
      onClick: () => scrollToSection("california-water-panel"),
      active: activeSection === "california-water-panel",
    },
    {
      text: "Managing California's water",
      icon: <SettingsIcon />,
      onClick: () => scrollToSection("managing-water"),
      active: activeSection === "managing-water",
    },
    {
      text: "Challenges",
      icon: <ReportProblemIcon />,
      onClick: () => scrollToSection("challenges"),
      active: activeSection === "challenges",
    },
    {
      text: "Alternative scenarios",
      icon: <SwapHorizIcon />,
      onClick: () => scrollToSection("alternative-scenarios"),
      active: activeSection === "alternative-scenarios",
    },
    {
      text: "Alternative scenario data",
      icon: <BarChartIcon />,
      onClick: () => scrollToSection("scenario-data"),
      active: activeSection === "scenario-data",
    },
    {
      text: "Alternative scenario presentation tools",
      icon: <SlideshowIcon />,
      onClick: () => scrollToSection("presentation-tools"),
      active: activeSection === "presentation-tools",
    },
  ]

  return (
    <>
      {/* ===== Background Map Layer ===== */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "all",
          zIndex: 0,
        }}
      >
        <MapContainer />
      </Box>

      {/* ===== Navigation Sidebar ===== */}
      <Box
        sx={{
          pointerEvents: "none",
          position: "relative",
          zIndex: 10,
        }}
      >
        <Box sx={{ pointerEvents: "auto" }}>
          <MiniDrawer
            items={navigationItems}
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            position="left"
          />
        </Box>
      </Box>

      {/* ===== Drawer "border" ===== */}
      <VerticalDivider
        left={(theme) =>
          drawerOpen
            ? theme.layout.drawer.width
            : theme.layout.drawer.closedWidth
        }
        animated
      />

      {/* ===== Main Content Area ===== */}
      <Box
        sx={(theme) => ({
          position: "relative",
          zIndex: 20,
          pointerEvents: "none",
          marginLeft: drawerOpen
            ? `${theme.layout.drawer.width}px`
            : `${theme.layout.drawer.closedWidth}px`,
          transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.sharp,
            duration: drawerOpen
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
        })}
      >
        {/* Header - Enable pointer events */}
        <Box sx={{ pointerEvents: "auto" }}>
          <Header />
        </Box>

        {/* Main content sections */}
        <Box
          component="main"
          sx={{
            position: "relative",
          }}
        >
          {/* Hero Panel */}
          <Box sx={{ pointerEvents: "auto" }}>
            <HeroPanel
              title={t("heroPanel.title")}
              content={t("heroPanel.content")}
            />
          </Box>

          {/* Two Column Panel */}
          <Box sx={{ pointerEvents: "auto" }} id="california-water-panel">
            <TwoColumnPanel
              leftTitle={t("CaliforniaWaterPanel.title")}
              leftContent={<div>Content</div>}
              background="transparent"
              sx={{
                color: (theme) => theme.palette.text.secondary,
                "& .MuiTypography-root": {
                  color: "inherit",
                },
              }}
            />
          </Box>

          {/* Combined Panel */}
          <Box sx={{ pointerEvents: "auto" }}>
            <CombinedPanel />
          </Box>
        </Box>
      </Box>
    </>
  )
}
