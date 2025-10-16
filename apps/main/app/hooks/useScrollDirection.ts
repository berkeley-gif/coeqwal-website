/**
 * Determines if the user is scrolling up or down
 */

'use client'

import { useEffect, useRef, useState } from 'react'

export function useScrollDirection(target?: HTMLElement | Window | null) {
    const [dir, setDir] = useState<'up' | 'down'>('down')
    const lastY = useRef<number>(0)

    useEffect(() => {
        const elem = target ?? window

        const getY = () => ("scrollY" in window ? window.scrollY : (elem as HTMLElement).scrollTop)

        const onScroll = () => {
            const y = getY()
            setDir(y > lastY.current ? 'down' : 'up')
            lastY.current = y
        }

        elem.addEventListener('scroll', onScroll as any, { passive: true })

        return () => elem.removeEventListener('scroll', onScroll as any)
    }, [target])
}