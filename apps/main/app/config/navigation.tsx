import React from "react"
import {
  WaterIcon,
  SettingsIcon,
  ReportProblemIcon,
  SwapHorizIcon,
  BarChartIcon,
  SlideshowIcon,
} from "@repo/ui"

interface NavItem {
  text: string
  icon: React.ReactNode
  onClick: () => void
  active?: boolean
}

// All section IDs in order (used for scroll tracking)
export const sectionIds = [
  "california-water-panel",
  "managing-water",
  "challenges",
  "alternative-scenarios",
  "scenario-data",
  "presentation-tools",
]

// Define the translation keys for each navigation item
export const navigationKeys = {
  "california-water-panel": "secondaryNavigation.californiaWater",
  "managing-water": "secondaryNavigation.managingWater",
  challenges: "secondaryNavigation.challenges",
  "alternative-scenarios": "secondaryNavigation.alternativeScenarios",
  "scenario-data": "secondaryNavigation.scenarioData",
  "presentation-tools": "secondaryNavigation.presentationTools",
}

// Helper function to generate navigation items with active state and scroll behavior
export const getNavigationItems = (
  activeSection: string,
  scrollToSection: (id: string) => void,
  t: (key: string) => string, // Pass the translation function as a parameter
): NavItem[] => {
  return [
    {
      text: t(navigationKeys["california-water-panel"]),
      icon: <WaterIcon />,
      onClick: () => scrollToSection("california-water-panel"),
      active: activeSection === "california-water-panel",
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
      text: t(navigationKeys["alternative-scenarios"]),
      icon: <SwapHorizIcon />,
      onClick: () => scrollToSection("alternative-scenarios"),
      active: activeSection === "alternative-scenarios",
    },
    {
      text: t(navigationKeys["scenario-data"]),
      icon: <BarChartIcon />,
      onClick: () => scrollToSection("scenario-data"),
      active: activeSection === "scenario-data",
    },
    {
      text: t(navigationKeys["presentation-tools"]),
      icon: <SlideshowIcon />,
      onClick: () => scrollToSection("presentation-tools"),
      active: activeSection === "presentation-tools",
    },
  ]
}
