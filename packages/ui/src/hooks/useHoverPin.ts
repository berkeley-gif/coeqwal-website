"use client"

import { useState, useCallback, useRef, useEffect } from "react"

export interface UseHoverPinOptions<T> {
  /** Custom equality check for items. Default: `===` */
  isEqual?: (a: T, b: T) => boolean
  /** ms to suppress hover re-trigger after unpinning. Default: 200 */
  suppressionMs?: number
  /** Fires whenever the derived `activeItem` changes */
  onActiveChange?: (item: T | null) => void
}

export interface UseHoverPinReturn<T> {
  hoveredItem: T | null
  pinnedItem: T | null
  /** `pinnedItem ?? hoveredItem` */
  activeItem: T | null
  isPinned: boolean
  handlers: {
    onMouseEnter: (item: T) => void
    onMouseLeave: () => void
    onClick: (item: T) => void
  }
  clearAll: () => void
}

/**
 * Generic hover-to-preview / click-to-pin state machine.
 *
 * Hover sets a transient preview. Click pins (persists until toggled off).
 * After unpinning, hover is briefly suppressed to avoid flicker.
 */
export function useHoverPin<T>(
  options: UseHoverPinOptions<T> = {},
): UseHoverPinReturn<T> {
  const {
    isEqual = (a, b) => a === b,
    suppressionMs = 200,
    onActiveChange,
  } = options

  const [hovered, setHovered] = useState<T | null>(null)
  const [pinned, setPinned] = useState<T | null>(null)
  const suppressUntilRef = useRef(0)
  const onActiveChangeRef = useRef(onActiveChange)
  onActiveChangeRef.current = onActiveChange

  const active = pinned ?? hovered

  // Fire the callback in an effect (after render) so we never trigger
  // a setState in another component during this component's render.
  const prevActiveRef = useRef<T | null>(null)
  useEffect(() => {
    const prev = prevActiveRef.current
    const changed =
      prev === null && active !== null
        ? true
        : prev !== null && active === null
          ? true
          : prev !== null && active !== null
            ? !isEqual(prev, active)
            : false
    prevActiveRef.current = active
    if (changed) {
      onActiveChangeRef.current?.(active)
    }
  })

  const onMouseEnter = useCallback(
    (item: T) => {
      if (Date.now() < suppressUntilRef.current) return
      setHovered((prev) => {
        if (prev !== null && isEqual(prev, item)) return prev
        return item
      })
    },
    [isEqual],
  )

  const onMouseLeave = useCallback(() => {
    setHovered(null)
  }, [])

  const onClick = useCallback(
    (item: T) => {
      setPinned((prev) => {
        if (prev !== null && isEqual(prev, item)) {
          suppressUntilRef.current = Date.now() + suppressionMs
          return null
        }
        return item
      })
    },
    [isEqual, suppressionMs],
  )

  const clearAll = useCallback(() => {
    setHovered(null)
    setPinned(null)
  }, [])

  return {
    hoveredItem: hovered,
    pinnedItem: pinned,
    activeItem: active,
    isPinned: pinned !== null,
    handlers: { onMouseEnter, onMouseLeave, onClick },
    clearAll,
  }
}
