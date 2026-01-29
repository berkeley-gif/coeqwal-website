"use client"

/**
 * TierTooltipPortal - Renders tier tooltip via MUI Popper (desktop) or Modal (mobile)
 *
 * Desktop: Uses Popper for automatic viewport boundary handling with dynamic arrow
 * Mobile: Uses centered modal with vertical scrolling
 *
 * WCAG 4.1.2: When scenarioScore is provided, displays the scenario's actual
 * tier level alongside tier definitions, making chart data accessible to
 * screen reader users.
 */

import React, { useEffect, useMemo, useState } from "react"
import {
  Box,
  Popper,
  Portal,
  ClickAwayListener,
  useTheme,
  useMediaQuery,
  Fade,
} from "@repo/ui/mui"
import type { PopperProps } from "@repo/ui/mui"
import { TooltipCloseButton } from "@repo/ui"
import TierTooltipContent from "./TierTooltipContent"
import type { OutcomeScoreData } from "../scenarios/hooks"
import type { TooltipChartDataPoint } from "./useTierTooltipState"

interface TierTooltipPortalProps {
  /** The outcome name to show tooltip for (null = hidden) */
  outcome: string | null
  /** Anchor element for positioning (replaces manual position calculation) */
  anchorEl: HTMLElement | null
  /** Called when user clicks away */
  onClose: () => void
  /** Called when user clicks close button */
  onForceClose: () => void
  /** Optional: Current scenario's score data for this outcome (for accessibility) */
  scenarioScore?: OutcomeScoreData | null
  /** Optional: Scenario label for context */
  scenarioLabel?: string
  /** Optional: Chart data for tier distribution display */
  chartData?: TooltipChartDataPoint[]
}

// ============================================================================
// DESKTOP TOOLTIP (Popper with dynamic arrow)
// ============================================================================

/**
 * Arrow component that points toward the anchor element
 * Popper's arrow modifier sets the top/left position dynamically
 */
function TooltipArrow({
  placement,
  setRef,
}: {
  placement: string
  setRef: (el: HTMLDivElement | null) => void
}) {
  const theme = useTheme()
  const isHorizontal =
    placement.startsWith("left") || placement.startsWith("right")
  const pointsRight = placement.startsWith("left")
  const pointsDown = placement.startsWith("top")

  // Arrow size for the rotated square
  const arrowSize = 12

  if (isHorizontal) {
    // Horizontal placement - arrow on left or right edge
    // Popper sets `top` style to align arrow with anchor
    return (
      <Box
        ref={setRef}
        sx={{
          position: "absolute",
          width: arrowSize,
          height: arrowSize,
          // Position on the edge of the tooltip
          ...(pointsRight ? { right: -arrowSize / 2 } : { left: -arrowSize / 2 }),
          "&::before": {
            content: '""',
            position: "absolute",
            width: arrowSize,
            height: arrowSize,
            backgroundColor: theme.palette.background.paper,
            transform: "rotate(45deg)",
            border: theme.border.light,
            ...(pointsRight
              ? {
                  borderLeft: "none",
                  borderBottom: "none",
                  boxShadow: "2px -2px 4px rgba(0, 0, 0, 0.05)",
                }
              : {
                  borderRight: "none",
                  borderTop: "none",
                  boxShadow: "-2px 2px 4px rgba(0, 0, 0, 0.05)",
                }),
          },
        }}
      />
    )
  } else {
    // Vertical placement - arrow on top or bottom edge
    // Popper sets `left` style to align arrow with anchor
    return (
      <Box
        ref={setRef}
        sx={{
          position: "absolute",
          width: arrowSize,
          height: arrowSize,
          // Position on the edge of the tooltip
          ...(pointsDown
            ? { bottom: -arrowSize / 2 }
            : { top: -arrowSize / 2 }),
          "&::before": {
            content: '""',
            position: "absolute",
            width: arrowSize,
            height: arrowSize,
            backgroundColor: theme.palette.background.paper,
            transform: "rotate(45deg)",
            border: theme.border.light,
            ...(pointsDown
              ? {
                  borderTop: "none",
                  borderLeft: "none",
                  boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.05)",
                }
              : {
                  borderBottom: "none",
                  borderRight: "none",
                  boxShadow: "-2px -2px 4px rgba(0, 0, 0, 0.05)",
                }),
          },
        }}
      />
    )
  }
}

/**
 * Desktop tooltip using Popper with dynamic arrow positioning
 */
function DesktopTooltip({
  outcome,
  anchorEl,
  onClose,
  onForceClose,
  scenarioScore,
  scenarioLabel,
  chartData,
}: TierTooltipPortalProps) {
  const theme = useTheme()
  // Use state setter as callback ref - this updates synchronously when element mounts
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null)
  const isOpen = Boolean(outcome && anchorEl)

  // Memoize modifiers so they update when arrowElement changes
  const popperModifiers: PopperProps["modifiers"] = useMemo(
    () => [
      {
        name: "flip",
        enabled: true,
        options: {
          fallbackPlacements: ["right", "top", "bottom"],
        },
      },
      {
        name: "preventOverflow",
        enabled: true,
        options: {
          padding: 16,
          boundary: "viewport",
        },
      },
      {
        name: "offset",
        options: {
          offset: [0, 12], // Gap from anchor element
        },
      },
      {
        name: "arrow",
        enabled: Boolean(arrowElement),
        options: {
          element: arrowElement,
          padding: 8, // Keep arrow away from tooltip edges
        },
      },
    ],
    [arrowElement],
  )

  return (
    <Popper
      open={isOpen}
      anchorEl={anchorEl}
      placement="left"
      modifiers={popperModifiers}
      sx={{ zIndex: theme.zIndex.tooltip }}
    >
      {({ placement }) => (
        <ClickAwayListener
          onClickAway={onClose}
          mouseEvent="onMouseUp"
          touchEvent="onTouchEnd"
        >
          <Box
            sx={{
              position: "relative",
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              border: theme.border.light,
              borderRadius: theme.borderRadius.md,
              boxShadow: theme.shadow.md,
              p: theme.space.component.xl,
              width: "450px",
              maxWidth: "calc(100vw - 48px)",
              ...theme.typography.compactSubtitle,
            }}
          >
            <TooltipCloseButton
              onClick={onForceClose}
              offset={{ top: 8, right: 8 }}
            />

            <TooltipArrow placement={placement} setRef={setArrowElement} />

            <TierTooltipContent
              outcome={outcome!}
              showTitle={true}
              scenarioScore={scenarioScore}
              scenarioLabel={scenarioLabel}
              chartData={chartData}
            />
          </Box>
        </ClickAwayListener>
      )}
    </Popper>
  )
}

// ============================================================================
// MOBILE MODAL
// ============================================================================

/**
 * Mobile modal - centered overlay with scroll support
 */
function MobileModal({
  outcome,
  anchorEl,
  onClose,
  onForceClose,
  scenarioScore,
  scenarioLabel,
  chartData,
}: TierTooltipPortalProps) {
  const theme = useTheme()
  const isOpen = Boolean(outcome && anchorEl)

  if (!isOpen) return null

  return (
    <Portal>
      {/* Backdrop */}
      <Fade in={isOpen}>
        <Box
          onClick={onClose}
          sx={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: theme.zIndex.modal,
          }}
        />
      </Fade>

      {/* Modal content */}
      <Fade in={isOpen}>
        <Box
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: theme.zIndex.modal + 1,
            width: "calc(100vw - 32px)",
            maxWidth: "450px",
            maxHeight: "calc(100vh - 64px)",
            overflowY: "auto",
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: theme.border.light,
            borderRadius: theme.borderRadius.md,
            boxShadow: theme.shadow.lg,
            p: theme.space.component.xl,
            ...theme.typography.compactSubtitle,
          }}
        >
          <TooltipCloseButton
            onClick={onForceClose}
            offset={{ top: 8, right: 8 }}
          />

          <TierTooltipContent
            outcome={outcome!}
            showTitle={true}
            scenarioScore={scenarioScore}
            scenarioLabel={scenarioLabel}
            chartData={chartData}
          />
        </Box>
      </Fade>
    </Portal>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TierTooltipPortal(props: TierTooltipPortalProps) {
  const { onForceClose } = props
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const isOpen = Boolean(props.outcome && props.anchorEl)

  // WCAG 2.1.1: Close tooltip on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onForceClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onForceClose])

  // Render mobile modal or desktop Popper
  if (isMobile) {
    return <MobileModal {...props} />
  }

  return <DesktopTooltip {...props} />
}

export default TierTooltipPortal
