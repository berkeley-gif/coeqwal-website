'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTabs, setActiveTab, nextTab, clamp } from '../context/Tabs'
import { TAB_ORDER } from '../types/tabs'

type Options = {
    rootMarginBottom?: number
    intentThreshold?: number
    intentWindowMs?: number
    cooldownMs?: number
    minDwellMs?: number
    /** If content scrolls in a custom container, pass it here; otherwise leave null for window. */
    rootEl?: Element | null
    /** Turn on console logs to tune behavior */
    debug?: boolean
}

export function useAutoAdvanceTabs() {
    return true
}
