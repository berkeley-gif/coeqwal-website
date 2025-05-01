import React from "react"
import {
  WaterIcon,
  SettingsIcon,
  ReportProblemIcon,
  SwapHorizIcon,
  BarChartIcon,
  SlideshowIcon,
} from "@repo/ui/mui"

interface NavItem {
  text: string
  icon: React.ReactNode
  onClick: () => void
  active?: boolean
}

// All section IDs in order (used for scroll tracking)
export const sectionIds = [
  "hero",
  "california-water",
  "managing-water",
  "challenges",
  "calsim",
  "invitation",
  "combined-panel",
]

// Define the translation keys for each navigation item
export const navigationKeys = {
  hero: "secondaryNavigation.home",
  "california-water": "secondaryNavigation.californiaWater",
  "managing-water": "secondaryNavigation.managingWater",
  challenges: "secondaryNavigation.challenges",
  calsim: "secondaryNavigation.calsim",
  invitation: "secondaryNavigation.explore",
  "combined-panel": "secondaryNavigation.scenarioSearch",
}

// Helper function to generate navigation items with active state and scroll behavior
export const getNavigationItems = (
  activeSection: string,
  scrollToSection: (id: string) => void,
  t: (key: string) => string, // Pass the translation function as a parameter
): NavItem[] => {
  return [
    {
      text: t(navigationKeys["california-water"]),
      icon: <WaterIcon />,
      onClick: () => scrollToSection("california-water"),
      active: activeSection === "california-water",
    },
    {
      text: t(navigationKeys["managing-water"]),
      icon: <SettingsIcon />,
      onClick: () => scrollToSection("managing-water"),
      active: activeSection === "managing-water",
    },
    {
      text: t(navigationKeys["challenges"]),
      icon: <ReportProblemIcon />,
      onClick: () => scrollToSection("challenges"),
      active: activeSection === "challenges",
    },
    {
      text: t(navigationKeys["calsim"]),
      icon: <SwapHorizIcon />,
      onClick: () => scrollToSection("calsim"),
      active: activeSection === "calsim",
    },
    {
      text: t(navigationKeys["invitation"]),
      icon: <BarChartIcon />,
      onClick: () => scrollToSection("invitation"),
      active: activeSection === "invitation",
    },
    {
      text: t(navigationKeys["combined-panel"]),
      icon: <SlideshowIcon />,
      onClick: () => scrollToSection("combined-panel"),
      active: activeSection === "combined-panel",
    },
  ]
}
