export type TabKey = "learn" | "explore" | "empower"

export const TAB_ORDER: TabKey[] = ["learn", "explore", "empower"]

export const TAB_COLORS: string[] = ["#7B9D3F", "#FFD87E", "#64A4D6"]

export const TABS = TAB_ORDER.map((k, i) => ({ key: k, label: k, panelColor: TAB_COLORS[i] }))