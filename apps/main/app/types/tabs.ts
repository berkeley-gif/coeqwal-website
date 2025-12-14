import { themeValues } from "@repo/ui/themes/theme"
export type TabKey = "learn" | "explore" | "empower"

const getFooterText = (k: TabKey) => {
  switch (k) {
    case "learn":
      return "Explore water allocation scenarios"
    case "explore":
      return "Share your results"
    case "empower":
      return "Learn about water management in California"
    default:
      return "Next section"
  }
}

export const TAB_ORDER: TabKey[] = ["learn", "explore", "empower"]

export const TABS = TAB_ORDER.map((k, i) => ({
  key: k,
  label: k,
  panelColor: themeValues.palette.tabPanels[k],
  footerText: getFooterText(k),
}))
