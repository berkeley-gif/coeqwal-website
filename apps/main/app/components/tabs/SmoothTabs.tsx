'use client'

import { motion } from '@repo/motion'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { TABS, TAB_ORDER, TabKey } from '../../types/tabs'
import { useTabs } from '../../context/Tabs'

const tabToPath = (tab: TabKey) => `/${tab}`

export default function SmoothTabs() {
    const router = useRouter()
    const pathname = usePathname()
    const { activeTab, setActiveTab, autoAdvanceEnabled, setAutoAdvanceEnabled } = useTabs()

    // Read /<tab> from URL and align the state on load
    useEffect(() => {
        const seg = pathname?.split('/').filter(Boolean).at(-1)

        if (seg && TAB_ORDER.includes(seg as TabKey)) setActiveTab(seg as TabKey)
    }, [pathname, setActiveTab])

    const onSelect = (tab: TabKey | undefined) => {
        if (tab) {
            setActiveTab(tab)
            router.replace(tabToPath(tab))
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
            style={{
                width: '100%'
            }}
        >
            <div
                role="tablist"
                aria-label="tab-sections"
                onKeyDown={handleKeyDown}
                className="tab-container"
                style={{
                    margin: 'auto',
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                }}
            >
                <div className="tabs"
                    style={{
                        position: 'relative',
                        display: 'flex',
                        gap: '10px',
                    }}
                >
                    {TABS.map(({ key, label }) => {
                        const selected = key === activeTab

                        return (
                            <button
                                key={key}
                                role='tab'
                                aria-selected={selected}
                                aria-constrols={`panel-${key}`}
                                id={`tab-${key}`}
                                onClick={() => onSelect(key)}
                                className="tab__button"
                                style={{
                                    position: 'relative',
                                    zIndex: 10,
                                    cursor: 'pointer',

                                }}
                            >
                                {selected && (
                                    <motion.span
                                        layoutId='tab-pill'
                                        className='tab__pill'
                                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                        style={{ position: 'absolute', background: 'var(--accent, white)' }}
                                    />
                                )}
                                {label}
                            </button>
                        )
                    })}
                </div>

                {/* UX Toggle for auto-advance behavior */}
                <label
                    style={{
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                    <input type="checkbox" checked={autoAdvanceEnabled} onChange={(e) => setAutoAdvanceEnabled(e.target.checked)} />
                    Auto-advance
                </label>
            </div>
        </div >
    )

}