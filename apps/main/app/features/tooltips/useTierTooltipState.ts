/**
 * useTierTooltipState - Unified state management for tier/outcome tooltips
 *
 * Provides consistent tooltip behavior:
 * - Close when clicking different info icon (switch)
 * - Close on click outside
 * - Close on X button
 * - Close on scroll
 *
 * WCAG 4.1.2: Tracks scenario context so tooltips can display
 * scenario-specific data alongside tier definitions.
 *
 * @example
 * ```tsx
 * const { openTooltip, handleToggle, handleClose, scenarioContext } = useTierTooltipState()
 *
 * <InfoIconButton
 *   isActive={openTooltip === outcome}
 *   onClick={() => handleToggle(outcome)}
 * />
 * ```
 */

import { useState, useCallback, useRef, useEffect } from "react"

/**
 * Chart data point for tier visualization
 * Matches the ChartDataPoint type from scenarios/components/shared/types
 */
export interface TooltipChartDataPoint {
  label: string
  color: string
  value: number
  tierType?: "single_value" | "multi_value"
}

export interface TooltipScenarioContext {
  scenarioId: string
  scenarioLabel: string
  /** Chart data for the specific outcome - contains tier distribution or level */
  chartData?: TooltipChartDataPoint[]
}

interface UseTierTooltipStateOptions {
  /** Close tooltip when user scrolls (default: true) */
  closeOnScroll?: boolean
}

export function useTierTooltipState(options: UseTierTooltipStateOptions = {}) {
  const { closeOnScroll = true } = options

  const [openTooltip, setOpenTooltip] = useState<string | null>(null)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [scenarioContext, setScenarioContext] = useState<TooltipScenarioContext | null>(null)

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
          setScenarioContext(null)
          return null
        } else if (prev !== null) {
          // Different tooltip open - close first, then open new one
          setAnchor(null)
          setScenarioContext(null)
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

  // Handle toggle with anchor and scenario context - for accessibility
  // This allows the tooltip to display scenario-specific data
  const handleToggleWithContext = useCallback(
    (id: string, anchorElement: HTMLElement, context: TooltipScenarioContext) => {
      lastToggleTimeRef.current = Date.now()

      setOpenTooltip((prev) => {
        if (prev === id) {
          // Same tooltip - toggle off
          setAnchor(null)
          setScenarioContext(null)
          return null
        } else if (prev !== null) {
          // Different tooltip open - close first, then open new one
          setAnchor(null)
          setScenarioContext(null)
          setTimeout(() => {
            lastToggleTimeRef.current = Date.now()
            setOpenTooltip(id)
            setAnchor(anchorElement)
            setScenarioContext(context)
          }, 50)
          return null
        } else {
          // No tooltip open - just open
          setAnchor(anchorElement)
          setScenarioContext(context)
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
      setScenarioContext(null)
    }
  }, [])

  // Force close - always closes, used for X button
  const forceClose = useCallback(() => {
    setOpenTooltip(null)
    setAnchor(null)
    setScenarioContext(null)
  }, [])

  // Close on scroll
  useEffect(() => {
    if (!openTooltip || !closeOnScroll) return

    const handleScroll = () => {
      setOpenTooltip(null)
      setAnchor(null)
      setScenarioContext(null)
    }

    window.addEventListener("scroll", handleScroll, true)
    return () => window.removeEventListener("scroll", handleScroll, true)
  }, [openTooltip, closeOnScroll])

  return {
    openTooltip,
    anchor,
    scenarioContext,
    handleToggle,
    handleToggleWithAnchor,
    handleToggleWithContext,
    handleClose,
    forceClose,
  }
}

export default useTierTooltipState
