'use client'

/**
 * TabPanels
 * - Renders the active tab's panel with a nice crossfade/slide.
 * - Keeps URL <-> state in sync on load or on manual URL edits (deep-link safe).
 */

import { useMemo, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from '@repo/motion'

import { useTabs } from '../../context/Tabs'
import { TABS, TabKey } from '../../types/tabs'
import TabPanel from '../../components/tabs/TabPanel'
import AutoHeight from '../../../../../packages/ui/src/components/common/AutoHeight'
import { useTabNavigation } from "../../hooks/useTabNavigation"
import { useScrollTabsIntoViewOnChange } from "../../hooks/useScrollTabsIntoViewOnChange"
import { useMarkTabsEnteredOnScroll } from '../../hooks/useMarkTabsEnteredOnScroll'

import LearnPanel from '../tabPanels/Learn'
import ExplorePanel from '../tabPanels/Explore'

const panelVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 }
}

export default function TabPanels() {
    const searchParams = useSearchParams()
    const { state, panelRef } = useTabs()
    const { activeTab } = state
    const { navigateToTab } = useTabNavigation()

    // Change url when entering tab
    useMarkTabsEnteredOnScroll()

    // Scroll to tab top on every tab change
    useScrollTabsIntoViewOnChange({ behavior: 'smooth', offsetPx: 0 })

    const didInitRef = useRef(false)
    useEffect(() => {
        if (didInitRef.current) return
        didInitRef.current = true

        const urlTab = searchParams.get('tab') as TabKey | null
        if (urlTab && urlTab !== activeTab) {
            navigateToTab(urlTab)
        }
    }, []) // ← run exactly once

    // Background color tied to active tab
    const panelColor: string = useMemo(() => {
        return TABS.find(t => t.key === activeTab)?.panelColor ?? 'fffff'
    }, [activeTab])

    const render = (tab: TabKey) => {
        switch (tab) {
            case 'learn':
                return (
                    <TabPanel
                        tabKey='learn'
                        ref={panelRef}
                    >
                        <LearnPanel />
                    </TabPanel>
                )
            case 'explore':
                return (
                    <TabPanel
                        tabKey='explore'
                        ref={panelRef}
                    >
                        <ExplorePanel />
                    </TabPanel>
                )
            case 'empower':
                return (
                    <TabPanel
                        tabKey='empower'
                        ref={panelRef}
                    >
                        <h2>Empower</h2>
                        <p style={{ height: '500px' }}>Coming soon...</p>
                    </TabPanel>
                )
        }
    }

    return (
        <AutoHeight>
            <motion.div
                animate={{ backgroundColor: panelColor }}
                transition={{ type: 'spring', stiffness: 180, damping: 26 }}
                style={{
                    position: 'relative',
                    borderRadius: 0
                }}
            >
                <AnimatePresence mode='wait' initial={false}>
                    <motion.div
                        key={activeTab}
                        variants={panelVariants}
                        initial='center'
                        animate='center'
                        exit='exit'
                        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                        style={{ position: 'relative' }}
                    >
                        {render(activeTab)}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </AutoHeight >
    )
}