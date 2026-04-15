"use client"

import React, {
  createContext,
  useContext,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react"

import type { TabKey } from "../types/tabs"

type State = {
  activeTab: TabKey
  autoAdvanceEnabled: boolean
  locked: boolean
}

export function nextTab(order: TabKey[], current: TabKey): TabKey | undefined {
  const i = order.indexOf(current)
  return order[(i + 1) % order.length]
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export type Action =
  | { type: "SET_ACTIVE_TAB"; tab: TabKey }
  | { type: "SET_AUTO_ADVANCE"; enabled: boolean }
  | { type: "SET_LOCK"; locked: boolean }

function tabsReducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_ACTIVE_TAB":
      if (state.locked) return state
      return { ...state, activeTab: action.tab }
    case "SET_AUTO_ADVANCE":
      return { ...state, autoAdvanceEnabled: action.enabled }
    case "SET_LOCK":
      return { ...state, locked: action.locked }
    default:
      return state
  }
}

const initialState: State = {
  activeTab: "learn",
  autoAdvanceEnabled: true,
  locked: false,
}

type TabsContextShape = {
  state: State
  dispatch: React.Dispatch<Action>
  tabsRef: React.RefObject<HTMLDivElement | null>
  subNavRef: React.RefObject<HTMLDivElement | null>
  panelRef: React.RefObject<HTMLDivElement | null>
  hasEnteredTabsFirstTime: boolean
  setHasEnteredTabsFirstTime: React.Dispatch<React.SetStateAction<boolean>>
  scrollIntentRef: React.RefObject<"none" | "user" | "sync">
  isInTabsArea: boolean
  setIsInTabsArea: React.Dispatch<React.SetStateAction<boolean>>
  isHeaderDark: boolean
  setIsHeaderDark: React.Dispatch<React.SetStateAction<boolean>>
  isPastHero: boolean
  setIsPastHero: React.Dispatch<React.SetStateAction<boolean>>
}

const TabsContext = createContext<TabsContextShape | null>(null)

export function TabsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tabsReducer, initialState)

  const tabsRef = useRef<HTMLDivElement>(null)
  const subNavRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const scrollIntentRef = useRef<"none" | "user" | "sync">("none")

  // checks if tabs have been entered (once)
  const [hasEnteredTabsFirstTime, setHasEnteredTabsFirstTime] =
    React.useState(false)

  // checks if we are in the tabs area
  const [isInTabsArea, setIsInTabsArea] = React.useState(false)

  // tracks whether header should use dark (blue) text instead of white
  const [isHeaderDark, setIsHeaderDark] = React.useState(false)

  // tracks whether user has scrolled past 50% of the hero section
  const [isPastHero, setIsPastHero] = React.useState(false)

  const value = useMemo(
    () => ({
      state,
      dispatch,
      tabsRef,
      subNavRef,
      panelRef,
      scrollIntentRef,
      hasEnteredTabsFirstTime,
      setHasEnteredTabsFirstTime,
      isInTabsArea,
      setIsInTabsArea,
      isHeaderDark,
      setIsHeaderDark,
      isPastHero,
      setIsPastHero,
    }),
    [state, hasEnteredTabsFirstTime, isInTabsArea, isHeaderDark, isPastHero],
  )

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>
}

/**
 * Hook to access tabs context.
 * Returns safe defaults when used outside TabsProvider (e.g., on /data page).
 * This allows components like Header to use isInTabsArea without requiring
 * every page to be wrapped in TabsProvider.
 */
export function useTabs() {
  const ctx = useContext(TabsContext)

  // Return safe defaults for pages without TabsProvider
  if (!ctx) {
    return {
      state: initialState,
      dispatch: () => {},
      tabsRef: { current: null } as React.RefObject<HTMLDivElement | null>,
      subNavRef: { current: null } as React.RefObject<HTMLDivElement | null>,
      panelRef: { current: null } as React.RefObject<HTMLDivElement | null>,
      hasEnteredTabsFirstTime: false,
      setHasEnteredTabsFirstTime: () => {},
      scrollIntentRef: { current: "none" as const } as React.RefObject<
        "none" | "user" | "sync"
      >,
      isInTabsArea: false,
      setIsInTabsArea: () => {},
      isHeaderDark: false,
      setIsHeaderDark: () => {},
      isPastHero: false,
      setIsPastHero: () => {},
    }
  }

  return ctx
}

// Optional action creators (nice for DX)
export const setActiveTab = (tab: TabKey): Action => ({
  type: "SET_ACTIVE_TAB",
  tab,
})
export const setAutoAdvance = (enabled: boolean): Action => ({
  type: "SET_AUTO_ADVANCE",
  enabled,
})
export const setLock = (locked: boolean): Action => ({
  type: "SET_LOCK",
  locked,
})
