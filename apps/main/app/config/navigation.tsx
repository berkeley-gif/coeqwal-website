interface NavItem {
  text: string
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
  "tab1": "secondaryNavigation.tab1",
  "tab2": "secondaryNavigation.tab2",
  "tab3": "secondaryNavigation.tab3"
}

// Helper function to generate navigation items with active state and scroll behavior
export const getNavigationItems = (
  activeSection: string,
  scrollToSection: (id: string) => void,
  t: (key: string) => string, // Pass the translation function as a parameter
): NavItem[] => {
  return [
    {
      text: t(navigationKeys["tab1"]),
      onClick: () => scrollToSection("california-water"),
      active: activeSection === "california-water",
    },
    {
      text: t(navigationKeys["tab2"]),
      onClick: () => scrollToSection("managing-water"),
      active: activeSection === "managing-water",
    },
    {
      text: t(navigationKeys["tab3"]),
      onClick: () => scrollToSection("challenges"),
      active: activeSection === "challenges",
    }
  ]
}
