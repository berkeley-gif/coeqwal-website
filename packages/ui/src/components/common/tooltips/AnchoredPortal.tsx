"use client"

/**
 * AnchoredPortal - Shows content next to an element, positioned for the device.
 *
 * On desktop it uses an MUI Popper with a dynamic arrow that flips to stay in
 * the viewport. Below the sm breakpoint it falls back to a centered MobileModal.
 * Styling comes from tooltipSurface, and callers pass their own content (and
 * close button) as children.
 */

import React, { useEffect, useMemo, useState } from "react"
import {
  Box,
  Popper,
  ClickAwayListener,
  useTheme,
  useMediaQuery,
} from "../../.."
import type { PopperProps } from "../../.."
import { MobileModal } from "../MobileModal"
import { tooltipSurface, type TooltipDensity } from "./tooltipSurface"

const ARROW_SIZE = 12
// Caps the mobile modal width. Sits between the theme's md (400) and lg (600)
// maxWidth tokens, wide enough for tier-style content without spanning phones.
const DEFAULT_MOBILE_MAX_WIDTH = 450

export interface AnchoredPortalProps {
  /** Whether the surface is open */
  open: boolean
  /** Element the desktop popper is positioned against */
  anchorEl: HTMLElement | null
  /** Called on click-away (desktop) or modal dismissal (mobile) */
  onClose: () => void
  /** Surface content, including any close button */
  children: React.ReactNode
  /** Preferred desktop placement (default: "top") */
  placement?: PopperProps["placement"]
  /** Placements to try when the preferred one overflows */
  fallbackPlacements?: NonNullable<PopperProps["placement"]>[]
  /** Gap in pixels between the anchor and the surface (default: 12) */
  offset?: number
  /** Desktop surface width */
  width?: number | string
  /** Desktop surface max width */
  maxWidth?: number | string
  /** Override z-index (use theme.zIndex.tooltipAboveModal inside a modal) */
  zIndex?: number
  /** Show the pointing arrow on desktop (default: true) */
  showArrow?: boolean
  /** Padding/text density; anchored popovers default to "spacious" rich content */
  density?: TooltipDensity
  /** Mobile modal max width (default: 450) */
  mobileMaxWidth?: number | string
  /** Mobile modal max height */
  mobileMaxHeight?: string
}

/**
 * Arrow that points at the anchor. Popper's arrow modifier sets the top/left
 * offset along the relevant edge. This only paints the rotated square.
 */
function PortalArrow({
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

  const edge = isHorizontal
    ? pointsRight
      ? { right: -ARROW_SIZE / 2 }
      : { left: -ARROW_SIZE / 2 }
    : pointsDown
      ? { bottom: -ARROW_SIZE / 2 }
      : { top: -ARROW_SIZE / 2 }

  const cutBorders = isHorizontal
    ? pointsRight
      ? { borderLeft: "none", borderBottom: "none" }
      : { borderRight: "none", borderTop: "none" }
    : pointsDown
      ? { borderTop: "none", borderLeft: "none" }
      : { borderBottom: "none", borderRight: "none" }

  return (
    <Box
      ref={setRef}
      sx={{
        position: "absolute",
        width: ARROW_SIZE,
        height: ARROW_SIZE,
        ...edge,
        "&::before": {
          content: '""',
          position: "absolute",
          width: ARROW_SIZE,
          height: ARROW_SIZE,
          backgroundColor: theme.palette.background.paper,
          transform: "rotate(45deg)",
          border: theme.border.light,
          ...cutBorders,
        },
      }}
    />
  )
}

function DesktopPortal({
  open,
  anchorEl,
  onClose,
  children,
  placement = "top",
  fallbackPlacements = ["top", "bottom", "left", "right"],
  offset = 12,
  width,
  maxWidth,
  zIndex,
  showArrow = true,
  density = "spacious",
}: AnchoredPortalProps) {
  const theme = useTheme()
  // Callback ref via state so modifiers recompute once the arrow mounts.
  const [arrowEl, setArrowEl] = useState<HTMLDivElement | null>(null)
  const resolvedZIndex = zIndex ?? theme.zIndex.tooltip

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  const modifiers: PopperProps["modifiers"] = useMemo(
    () => [
      { name: "flip", enabled: true, options: { fallbackPlacements } },
      {
        name: "preventOverflow",
        enabled: true,
        options: { padding: 16, boundary: "viewport" },
      },
      { name: "offset", options: { offset: [0, offset] } },
      {
        name: "arrow",
        enabled: showArrow && Boolean(arrowEl),
        options: { element: arrowEl, padding: 8 },
      },
    ],
    [fallbackPlacements, offset, showArrow, arrowEl],
  )

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement={placement}
      modifiers={modifiers}
      sx={{ zIndex: resolvedZIndex }}
    >
      {({ placement: resolvedPlacement }) => (
        <ClickAwayListener
          onClickAway={onClose}
          mouseEvent="onMouseUp"
          touchEvent="onTouchEnd"
        >
          <Box
            sx={{
              position: "relative",
              ...tooltipSurface(theme, { density }),
              ...(width !== undefined && { width }),
              ...(maxWidth !== undefined && { maxWidth }),
            }}
          >
            {showArrow && (
              <PortalArrow placement={resolvedPlacement} setRef={setArrowEl} />
            )}
            {children}
          </Box>
        </ClickAwayListener>
      )}
    </Popper>
  )
}

function MobilePortal({
  open,
  onClose,
  children,
  mobileMaxWidth = DEFAULT_MOBILE_MAX_WIDTH,
  mobileMaxHeight = "calc(100vh - 64px)",
}: AnchoredPortalProps) {
  const theme = useTheme()

  return (
    <MobileModal
      open={open}
      onClose={onClose}
      maxWidth={mobileMaxWidth}
      maxHeight={mobileMaxHeight}
      showCloseButton={false}
    >
      <Box sx={{ position: "relative", ...theme.typography.compactSubtitle }}>
        {children}
      </Box>
    </MobileModal>
  )
}

export function AnchoredPortal(props: AnchoredPortalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  if (!props.open) return null
  return isMobile ? <MobilePortal {...props} /> : <DesktopPortal {...props} />
}

export default AnchoredPortal
