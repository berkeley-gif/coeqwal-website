import React from "react"
import {
  WaterIcon,
  SettingsIcon,
  ReportProblemIcon,
  SwapHorizIcon,
  BarChartIcon,
  SlideshowIcon,
} from "@repo/ui"

// Define the interface here to avoid import issues
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

// Helper function to generate navigation items with active state and scroll behavior
export const getNavigationItems = (
  activeSection: string,
  scrollToSection: (id: string) => void,
): NavItem[] => [
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
