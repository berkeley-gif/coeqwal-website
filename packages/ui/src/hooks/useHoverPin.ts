"use client"

import { useState, useCallback, useRef } from "react"

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

  const fireChange = useCallback(
    (next: T | null) => onActiveChangeRef.current?.(next),
    [],
  )

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
          fireChange(null)
          return null
        }
        fireChange(item)
        return item
      })
    },
    [isEqual, suppressionMs, fireChange],
  )

  const clearAll = useCallback(() => {
    setHovered(null)
    setPinned(null)
    fireChange(null)
  }, [fireChange])

  return {
    hoveredItem: hovered,
    pinnedItem: pinned,
    activeItem: active,
    isPinned: pinned !== null,
    handlers: { onMouseEnter, onMouseLeave, onClick },
    clearAll,
  }
}
