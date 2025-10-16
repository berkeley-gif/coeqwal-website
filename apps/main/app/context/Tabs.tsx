'use client'

import React, {
    createContext,
    useContext,
    useMemo,
    useReducer,
    useRef,
    type ReactNode,
    type RefObject,
} from 'react'

import type { TabKey } from '../types/tabs'

type State = {
    activeTab: TabKey
    autoAdvanceEnabled: boolean
    locked: boolean
}

export function nextTab(order: TabKey[], current: TabKey): TabKey | undefined {
    const i = order.indexOf(current)
    return (order[(i + 1) % order.length])
}

export function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

export type Action =
    | { type: 'SET_ACTIVE_TAB'; tab: TabKey }
    | { type: 'SET_AUTO_ADVANCE'; enabled: boolean }
    | { type: 'SET_LOCK'; locked: boolean }

function tabsReducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_ACTIVE_TAB':
            if (state.locked) return state
            return { ...state, activeTab: action.tab }
        case 'SET_AUTO_ADVANCE':
            return { ...state, autoAdvanceEnabled: action.enabled }
        case 'SET_LOCK':
            return { ...state, locked: action.locked }
        default:
            return state
    }
}

const initialState: State = {
    activeTab: 'learn',
    autoAdvanceEnabled: true,
    locked: false,
}

type TabsContextShape = {
  state: State
  dispatch: React.Dispatch<Action>
  tabsRef: React.MutableRefObject<HTMLDivElement | null>
  panelRef: React.MutableRefObject<HTMLDivElement | null>
  hasEnteredTabsRef: React.MutableRefObject<boolean>
  scrollIntentRef: React.MutableRefObject<'none' | 'user' | 'sync'>
}

const TabsContext = createContext<TabsContextShape | null>(null)

export function TabsProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(tabsReducer, initialState)

    const tabsRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    const scrollIntentRef = useRef<'none' | 'user' | 'sync'>('none')

    // 🚦 prevents any auto scroll-align before user actually reaches tabs or clicks a tab
    const hasEnteredTabsRef = useRef<boolean>(false)

    const value = useMemo(
        () => ({ state, dispatch, tabsRef, panelRef, scrollIntentRef, hasEnteredTabsRef }),
        [state]
    )

    return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>
}

export function useTabs() {
    const ctx = useContext(TabsContext)
    if (!ctx) throw new Error('useTabs must be used inside <TabsProvider>')
    return ctx
}

// Optional action creators (nice for DX)
export const setActiveTab = (tab: TabKey): Action => ({ type: 'SET_ACTIVE_TAB', tab })
export const setAutoAdvance = (enabled: boolean): Action => ({ type: 'SET_AUTO_ADVANCE', enabled })
export const setLock = (locked: boolean): Action => ({ type: 'SET_LOCK', locked })
