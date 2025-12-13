/**
 * useTierTooltipState - Unified state management for tier/outcome tooltips
 *
 * Provides consistent tooltip behavior:
 * - Close when clicking different info icon (switch)
 * - Close on click outside
 * - Close on X button
 * - Close on scroll
 *
 * @example
 * ```tsx
 * const { openTooltip, handleToggle, handleClose } = useTierTooltipState()
 *
 * <InfoIconButton
 *   isActive={openTooltip === outcome}
 *   onClick={() => handleToggle(outcome)}
 * />
 * ```
 */

import { useState, useCallback, useRef, useEffect } from "react"

interface UseTierTooltipStateOptions {
  /** Close tooltip when user scrolls (default: true) */
  closeOnScroll?: boolean
}

export function useTierTooltipState(options: UseTierTooltipStateOptions = {}) {
  const { closeOnScroll = true } = options

  const [openTooltip, setOpenTooltip] = useState<string | null>(null)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  // Track the timestamp of the last toggle to ignore immediate click-away events
  const lastToggleTimeRef = useRef<number>(0)

  // Handle toggle - the core logic for opening/closing tooltips
  const handleToggle = useCallback((id: string) => {
    lastToggleTimeRef.current = Date.now()

    setOpenTooltip((prev) => {
      if (prev === id) {
        // Same tooltip - toggle off
        return null
      } else if (prev !== null) {
        // Different tooltip open - close first, then open new one
        setTimeout(() => {
          lastToggleTimeRef.current = Date.now()
          setOpenTooltip(id)
        }, 50)
        return null
      } else {
        // No tooltip open - just open
        return id
      }
    })
  }, [])

  // Handle toggle with anchor - same logic but also tracks anchor element
  const handleToggleWithAnchor = useCallback(
    (id: string, anchorElement: HTMLElement) => {
      lastToggleTimeRef.current = Date.now()

      setOpenTooltip((prev) => {
        if (prev === id) {
          // Same tooltip - toggle off
          setAnchor(null)
          return null
        } else if (prev !== null) {
          // Different tooltip open - close first, then open new one
          setAnchor(null)
          setTimeout(() => {
            lastToggleTimeRef.current = Date.now()
            setOpenTooltip(id)
            setAnchor(anchorElement)
          }, 50)
          return null
        } else {
          // No tooltip open - just open
          setAnchor(anchorElement)
          return id
        }
      })
    },
    [],
  )

  // Handle close - called by ClickAwayListener, X button, scroll, etc.
  // Ignores events within 50ms of a toggle to prevent race conditions
  // (ClickAwayListener fires on mouseUp which is ~10-30ms before onClick)
  const handleClose = useCallback(() => {
    const timeSinceToggle = Date.now() - lastToggleTimeRef.current
    if (timeSinceToggle > 50) {
      setOpenTooltip(null)
      setAnchor(null)
    }
  }, [])

  // Force close - always closes, used for X button
  const forceClose = useCallback(() => {
    setOpenTooltip(null)
    setAnchor(null)
  }, [])

  // Close on scroll
  useEffect(() => {
    if (!openTooltip || !closeOnScroll) return

    const handleScroll = () => {
      setOpenTooltip(null)
      setAnchor(null)
    }

    window.addEventListener("scroll", handleScroll, true)
    return () => window.removeEventListener("scroll", handleScroll, true)
  }, [openTooltip, closeOnScroll])

  return {
    openTooltip,
    anchor,
    handleToggle,
    handleToggleWithAnchor,
    handleClose,
    forceClose,
  }
}

export default useTierTooltipState
