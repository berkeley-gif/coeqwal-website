/**
 * ScrollToButton - Animated button for scroll navigation
 *
 * Circular arrow button that scrolls to a target element when clicked.
 * Includes a scroll indicator animation.
 *
 * WCAG 2.0 AA Compliance Notes:
 * - WCAG 2.4.4: ariaLabel prop provides accessible link purpose
 * - WCAG 4.1.2: Passes aria-label to child ScrollIndicator
 */

import React from "react"
import { useTheme, Theme } from "../../mui-components"
import { ScrollIndicator } from "@repo/motion/components"
import { CircularArrowButton } from "../common/CircularArrowButton"

type MotionAxis = "vertical" | "horizontal"
interface ScrollToButtonProps {
  scrollToId?: string
  onClick?: () => void
  color?: string | ((theme: Theme) => string)
  delay?: number
  animationComplete?: boolean
  style?: React.CSSProperties
  size?: number
  //i.e rotation = "0deg",
  rotation?: string
  axis?: MotionAxis
  /** Accessible label for screen readers (WCAG 4.1.2) */
  ariaLabel?: string
  /** Optional label above the arrow (static; same hit target as the button) */
  label?: React.ReactNode
  /**
   * Offset (in px) subtracted from the target's top when scrolling.
   * Use this to account for a fixed header so the scrolled-to
   * element lands below it instead of underneath it. Pass a
   * function to resolve the offset at click time. Defaults to 0.
   */
  scrollOffset?: number | (() => number)
}

export const ScrollToButton: React.FC<ScrollToButtonProps> = ({
  scrollToId = "",
  onClick = null,
  color,
  delay = 1.0,
  animationComplete = true,
  style,
  size,
  rotation,
  axis,
  ariaLabel = "Scroll down",
  scrollOffset,
  label,
}) => {
  const theme = useTheme()
  const buttonColor =
    typeof color === "function"
      ? color(theme)
      : color || theme.palette.blue.darkest

  const hasScrollTarget = !!scrollToId
  const hasOnClick = typeof onClick === "function"
  const isInteractive = hasScrollTarget || hasOnClick

  return (
    <ScrollIndicator
      // only pass these when they exist
      scrollToId={hasScrollTarget ? scrollToId : undefined}
      scrollOffset={scrollOffset}
      onClick={hasOnClick ? onClick : undefined}
      color={buttonColor}
      animationComplete={animationComplete}
      delay={delay}
      motionAxis={axis}
      ariaLabel={isInteractive ? ariaLabel : undefined}
      label={label}
      style={{
        ...style,
        // if no action, keep animation but disable interaction
        ...(isInteractive ? null : { pointerEvents: "none" }),
      }}
      {...(!isInteractive ? { "aria-hidden": true } : null)}
    >
      <CircularArrowButton
        size={size}
        color={buttonColor}
        rotation={rotation}
        decorative={true} // Parent ScrollIndicator handles interaction
      />
    </ScrollIndicator>
  )
}
