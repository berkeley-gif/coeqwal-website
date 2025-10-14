// FILE: context/Tabs.tsx
'use client'

import React, {
    createContext,
    useContext,
    useMemo,
    useReducer,
    useRef,
    type ReactNode,
} from 'react'

export type TabKey = 'learn' | 'explore' | 'empower'

type State = {
    activeTab: TabKey
    autoAdvanceEnabled: boolean
    locked: boolean
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
    panelRef: React.MutableRefObject<HTMLElement | null>
    // Who triggered the last tab change? Don't scroll automatically on load
    scrollIntentRef: React.MutableRefObject<'none' | 'user' | 'sync'>
}

const TabsContext = createContext<TabsContextShape | null>(null)

export function TabsProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(tabsReducer, initialState)

    const tabsRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLElement>(null)

    const scrollIntentRef = useRef<'none' | 'user' | 'sync'>('none')

    const value = useMemo(
        () => ({ state, dispatch, tabsRef, panelRef, scrollIntentRef }),
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
