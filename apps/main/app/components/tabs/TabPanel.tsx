'use client'

import { useRef } from 'react'

type Props = {
    tabKey: string
    children: React.ReactNode
    className?: string
    selfScroll?: boolean
}

export default function TabPanel({ tabKey, children, className, selfScroll = false }: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null)

    return (
        <div
            id={`panel-${tabKey}`}
            role='tabpanel'
            aria-labelledby={`tab-${tabKey}`}
            className={className}
            ref={containerRef}
            style={selfScroll ? { overflow: 'auto', maxHeight: 'calc(100dvh - 120px)' } : undefined}
            tabIndex={-1}
        >
            <div aria-hidden data-sentinel='top' />
            {children}
            <div aria-hidden data-sentinel='bottom' />
        </div >
    )
}