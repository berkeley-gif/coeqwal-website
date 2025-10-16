// A footer "sentinel" near the bottom of a tab panel

import React from "react"
import { ScrollToButton } from "@repo/ui"

import { useTabs, nextTab } from '../../context/Tabs'
import { TAB_ORDER } from '../../types/tabs'
import { useTabNavigation } from "../../hooks/useTabNavigation"

export default function AutoAdvanceFooter() {
    const { state } = useTabs()
    const { activeTab } = state
    const { navigateToTab } = useTabNavigation()

    const onAdvance = () => {
        const nxt = nextTab(TAB_ORDER, activeTab)!
        navigateToTab(nxt)
    }

    return (
        <div
            data-auto-advance-sentinel
            style={{
                position: 'relative',
                paddingTop: '2rem',
                paddingBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                minHeight: 48,
                justifyContent: 'center',
                gap: 12,
            }}
        >
            <ScrollToButton onClick={onAdvance} delay={0.2} animationComplete style={{ transform: 'translateY(-2px)' }} />
        </div>
    )
}
