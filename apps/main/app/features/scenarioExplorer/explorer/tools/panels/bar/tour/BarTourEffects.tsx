"use client"

/**
 * BarTourEffects. Mounted by the tour runner only while the bar tour is
 * active. Opens the map for Step 7 and closes it again once the tour
 * moves past that step or is dismissed, matching the spec's "Highlight
 * 'Show map' and open map panel" / Step 10's "Hide map" operations.
 *
 * Same snapshot-in-a-ref/restore-on-cleanup shape as ListTourEffects'
 * key-operations effect.
 */

import { useEffect, useRef } from "react"
import { useExplorerStore, useWorkspaceSlice } from "../../../../store"
import type { TourEffectsProps } from "../../../tour/types"

const MAP_STEP_ID = "bar.step7.showMap"

export default function BarTourEffects({ step }: TourEffectsProps) {
    const setShowMap = useWorkspaceSlice((s) => s.setShowMap)
    const mapDemoRef = useRef<{ prevShowMap: boolean } | null>(null)

    useEffect(() => {
        if (!step) return
        if (step.id !== MAP_STEP_ID) return
        const prevShowMap = useExplorerStore.getState().showMap
        mapDemoRef.current = { prevShowMap }
        if (!prevShowMap) {
            setShowMap(true)
        }
        return () => {
            const snap = mapDemoRef.current
            mapDemoRef.current = null
            if (!snap) return
            if (!snap.prevShowMap) {
                setShowMap(false)
            }
        }
    }, [step, setShowMap])

    return null
}
