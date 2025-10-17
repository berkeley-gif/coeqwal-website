import { themeValues } from "@repo/ui/themes/theme"
export type TabKey = "learn" | "explore" | "empower"

export const TAB_ORDER: TabKey[] = ["learn", "explore", "empower"]

export const TABS = TAB_ORDER.map((k, i) => ({
  key: k,
  label: k,
  panelColor: themeValues.palette.tabPanels[k],
}))
