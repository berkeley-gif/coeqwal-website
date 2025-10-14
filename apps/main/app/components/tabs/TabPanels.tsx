'use client'

import { useMemo, useEffect } from "react"
import { AnimatePresence, motion } from '@repo/motion'
import { useTabs } from '../../context/Tabs'
import { TABS, TabKey } from '../../types/tabs'
import TabPanel from '../../components/tabs/TabPanel'
import AutoHeight from '../../components/common/AutoHeight'
import { useScrollTabsIntoViewOnChange } from '../../hooks/useScrollTabsIntoViewOnChange'

import LearnPanel from '../tabPanels/Learn'
import ExplorePanel from '../tabPanels/Explore'

const panelVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 }
}

type Props = {
    tabsRef: React.RefObject<HTMLDivElement>
}

export default function TabPanels() {
    const { state, panelRef } = useTabs()
    const { activeTab } = state


    useScrollTabsIntoViewOnChange({
        behavior: 'smooth',
        offsetPx: 0
    })

    useEffect(() => {
        console.log('activeTab: ', activeTab)
    }, [activeTab])

    const panelColor: string = useMemo(() => {
        return TABS.find(t => t.key === activeTab)?.panelColor ?? 'fffff'
    }, [activeTab])

    const render = (tab: TabKey) => {
        switch (tab) {
            case 'learn':
                return (
                    <TabPanel tabKey='learn'>
                        <LearnPanel />
                    </TabPanel>
                )
            case 'explore':
                return (
                    <TabPanel tabKey='explore'>
                        <ExplorePanel />

                    </TabPanel>
                )
            case 'empower':
                return (
                    <TabPanel tabKey='empower'>
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
                        ref={panelRef}
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