'use client'

import React, { createContext, useContext, useMemo, useReducer } from 'react'
import type { Tabkey } from '../types/tabs'

type State = {
    activeTab: any;
    autoAdvanceEnabled: boolean;
    interactionLock: boolean; // pause auto-advance while manipulating maps
}

// --- Actions ---
type Action =
    | { type: "SET_ACTIVE_TAB"; tab: TabKey }
    | { type: "SET_AUTO_ADVANCE"; enabled: boolean }
    | { type: "SET_LOCK"; locked: boolean }

// --- Initial state --- 
const initialState: State = {
    activeTab: "learn",
    autoAdvanceEnabled: true,
    interactionLock: false,
}

// --- Reducer ---
function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "SET_ACTIVE_TAB":
            return { ...state, activeTab: action.tab }
        case "SET_AUTO_ADVANCE":
            return { ...state, autoAdvanceEnabled: action.enabled }
        case "SET_LOCK":
            return { ...state, interactionLock: action.locked }
        default:
            return state;
    }
}

type Ctx = State & {
    setActiveTab: (tab: TabKey) => void
    setAutoAdvanceEnabled: (v: boolean) => void
    setInteractionLock: (v: boolean) => void
}

const TabsContext = createContext<Ctx | null>(null)

// --- Provider ---
export function TabsProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState)

    const value = useMemo<Ctx>(
        () => ({
            ...state,
            setActiveTab: (tab) => dispatch({ type: "SET_ACTIVE_TAB", tab }),
            setAutoAdvanceEnabled: (v) => dispatch({ type: "SET_AUTO_ADVANCE", enabled: v }),
            setInteractionLock: (v) => dispatch({ type: "SET_LOCK", locked: v }),
        }),
        [state]
    )

    return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>
}

// --- Hook ---
export function useTabs() {
    const ctx = useContext(TabsContext)

    if (!ctx) throw new Error("useTabs must be used within TabsProvider")
    return ctx
}
