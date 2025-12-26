/**
 * ScrollToButton - Animated button for scroll navigation
 *
 * Circular arrow button that scrolls to a target element when clicked.
 * Includes a scroll indicator animation.
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
      onClick={hasOnClick ? onClick : undefined}
      color={buttonColor}
      animationComplete={animationComplete}
      delay={delay}
      motionAxis={axis}
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
      />
    </ScrollIndicator>
  )

  return null
}
