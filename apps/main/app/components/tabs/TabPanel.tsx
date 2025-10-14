'use client'

import { forwardRef, type ReactNode } from 'react'

type Props = {
    tabKey: string
    children: React.ReactNode
}
const TabPanel = forwardRef<HTMLDivElement, Props>(
    ({ tabKey, children }, ref) => (
        <div
            ref={ref}
            role="tabpanel"
            id={`panel-${tabKey}`}
            aria-labelledby={`tab-${tabKey}`}
            style={{ padding: '2rem' }}
        >
            {children}
        </div>
    )
)

TabPanel.displayName = 'TabPanel'

export default TabPanel