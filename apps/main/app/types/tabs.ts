import { themeValues } from "@repo/ui/themes/theme"
export type TabKey = "learn" | "explore" | "share"

const getFooterText = (k: TabKey) => {
  switch (k) {
    case "learn":
      return "Explore water allocation scenarios"
    case "explore":
      return "Go to tools"
    case "share":
      return "Learn about water management in California"
    default:
      return "Next section"
  }
}

export const TAB_ORDER: TabKey[] = ["learn", "explore", "share"]

const getLabel = (k: TabKey) => {
  if (k === "share") return "Share"
  return k
}

export const TABS = TAB_ORDER.map((k) => ({
  key: k,
  label: getLabel(k),
  panelColor: themeValues.palette.tabPanels[k],
  footerText: getFooterText(k),
}))
