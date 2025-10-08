'use client'

import { AnimatePresence, motion } from '@repo/motion'
import dynamic from 'next/dynamic'

import { useEffect } from 'react'
import { useAutoAdvanceTabs } from '../../hooks/useAutoAdvance'
import { useTabs } from '../../context/Tabs'
import { TabKey } from '../../types/tabs'
import TabPanel from '../../components/tabs/TabPanel'
import AutoHeight from '../../components/common/AutoHeight'

// import maps dynamically
//const MapPanel = dynamic(() => import("@/components/maps/MapPanel"), { ssr: false });

const panelVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 }
}

export default function TabPanels() {
    const { activeTab } = useTabs()

    useAutoAdvanceTabs({ idleMs: 260, fastPathShortPanels: true })

    useEffect(() => {
        console.log('activeTab: ', activeTab)
    }, [activeTab])

    const render = (tab: TabKey) => {
        switch (tab) {
            case 'learn':
                return (
                    <TabPanel tabKey='learn' selfScroll>
                        <h2>Learn</h2>
                        <p style={{ height: '2000px' }}>Intro content… (replace with real copy)</p>
                    </TabPanel>
                )
            case 'inquire':
                return (
                    <TabPanel tabKey='inquire' selfScroll>
                        <h2>Inquire</h2>
                        <p style={{ height: '1000px' }}>Inquire content… (replace with real copy)</p>
                    </TabPanel>
                )
            case 'explore':
                return (
                    <TabPanel tabKey='explore' selfScroll>
                        <h2>Explore</h2>
                        <p style={{ height: '500px' }}>Explore content… (replace with real copy)</p>
                    </TabPanel>
                )
            case 'inquire':
                return (
                    <TabPanel tabKey='empower' selfScroll>
                        <h2>Empower</h2>
                        <p style={{ height: '300px' }}>Empower content… (replace with real copy)</p>
                    </TabPanel>
                )
        }
    }

    return (
        <AutoHeight style={{ position: 'relative' }}>
            <AnimatePresence mode='popLayout' initial={false}>
                <motion.div
                    key={activeTab}
                    variants={panelVariants}
                    initial='center'
                    animate='center'
                    exit='exit'
                    transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                >
                    {render(activeTab)}
                </motion.div>
            </AnimatePresence>
        </AutoHeight>
    )
}