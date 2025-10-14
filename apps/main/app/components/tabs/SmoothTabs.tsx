'use client'

import { motion } from '@repo/motion'
import { TABS, TAB_ORDER, TabKey } from '../../types/tabs'
import { useTabs, setActiveTab, setAutoAdvance } from '../../context/Tabs'
import { Typography } from "@repo/ui/mui"

export default function SmoothTabs() {
    const { state, dispatch, tabsRef, scrollIntentRef } = useTabs()
    const { activeTab, autoAdvanceEnabled } = state


    const onSelect = (tab: TabKey) => {
        if (tab !== activeTab) {
            scrollIntentRef.current = 'user'
            dispatch(setActiveTab(tab))
        }
    }

    // Keyboard support A11y: ArrowLeft/Right, Home/End
    const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
        const idx = TAB_ORDER.indexOf(activeTab)

        if (e.key === 'ArrowRight') onSelect(TAB_ORDER[(idx + 1) % TAB_ORDER.length])
        if (e.key === 'ArrowLeft') onSelect(TAB_ORDER[(idx - 1 + TAB_ORDER.length) % TAB_ORDER.length])
        if (e.key === 'Home') onSelect(TAB_ORDER[0])
        if (e.key === 'End') onSelect(TAB_ORDER[TAB_ORDER.length - 1])
    }

    return (
        <div id="tabs"
            ref={tabsRef}
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 1000,
            }}
        >
            <div
                role="tablist"
                aria-label="tab-sections"
                onKeyDown={handleKeyDown}
                className="tab-container"
                style={{
                    display: 'flex',
                    width: '100%',
                    pointerEvents: 'auto'
                }}
            >
                {TABS.map(({ key, label, panelColor }) => {
                    const selected = key === activeTab
                    return (
                        <button
                            key={key}
                            role="tab"
                            aria-selected={selected}
                            aria-controls={`panel-${key}`}
                            id={`tab-${key}`}
                            onClick={() => onSelect(key)}
                            type="button"
                            tabIndex={selected ? 0 : -1}
                            style={{
                                flex: 1,
                                position: 'relative',
                                padding: '12px 16px',
                                border: 'none',
                                background: panelColor,
                                cursor: 'pointer',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                            }}
                        >
                            {selected && (
                                <motion.span
                                    layoutId="seg-pill"
                                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        right: 0,
                                        bottom: -5,
                                        height: 5,
                                        background: `var(--accent, ${panelColor})`,
                                    }}
                                />
                            )}
                            <Typography variant="h6">{label}</Typography>

                        </button>
                    )
                })}
            </div>
        </div>
    )
}