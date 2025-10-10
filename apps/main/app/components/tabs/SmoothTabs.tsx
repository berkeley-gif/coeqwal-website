'use client'

import { motion } from '@repo/motion'
import { useEffect, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { TABS, TAB_ORDER, TabKey } from '../../types/tabs'
import { useTabs } from '../../context/Tabs'

export default function SmoothTabs() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { activeTab, setActiveTab } = useTabs()

    // Read ?tab= from URL and convert it to a tabKey
    const tabFromUrl = useMemo<TabKey | null>(() => {
        const qp = searchParams?.get('tab')
        return qp && TAB_ORDER.includes(qp as TabKey) ? (qp as TabKey) : null
    }, [searchParams])

    // Set the active tab from URL or set the URL from tab
    useEffect(() => {
        // If URL has a ?tab=... -> set the active tab
        if (tabFromUrl && tabFromUrl !== activeTab) {
            setActiveTab(tabFromUrl)
        }
    }, [tabFromUrl, activeTab, setActiveTab])


    // Write ?tab= ONLY if it changes (prevents feedback loops)
    const replaceTabParam = (tab: TabKey) => {
        if (searchParams?.get('tab') === tab) return

        const sp = new URLSearchParams(searchParams?.toString())
        sp.set('tab', tab)
        router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
    }


    const onSelect = (tab: TabKey) => {
        if (tab !== activeTab) {
            setActiveTab(tab)
        }

        replaceTabParam(tab)
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
                                        bottom: -2,
                                        height: 2,
                                        background: `var(--accent, ${panelColor})`,
                                        borderRadius: 2,
                                    }}
                                />
                            )}
                            {label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}