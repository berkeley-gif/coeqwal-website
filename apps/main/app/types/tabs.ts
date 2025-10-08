export type TabKey = "learn" | "inquire" | "explore" | "empower"

export const TAB_ORDER: TabKey[] = ["learn", "inquire", "explore", "empower"]

export const TABS = TAB_ORDER.map((k) => ({ key: k, label: k }))