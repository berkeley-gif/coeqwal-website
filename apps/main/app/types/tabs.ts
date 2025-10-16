export type TabKey = "learn" | "explore" | "empower"

export const TAB_ORDER: TabKey[] = ["learn", "explore", "empower"]

export const TAB_COLORS: string[] = ["#2d89b6", "#F4BF4D", "#589DA5"]

export const TABS = TAB_ORDER.map((k, i) => ({
  key: k,
  label: k,
  panelColor: TAB_COLORS[i],
}))
