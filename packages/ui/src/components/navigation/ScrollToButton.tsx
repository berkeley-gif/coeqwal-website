import React from "react"
import { useTheme, Theme } from "../../mui-components"
import { ScrollIndicator } from "@repo/motion/components"
import { CircularArrowButton } from "../common/CircularArrowButton"

interface ScrollToButtonProps {
  scrollToId?: string
  onClick?: () => void
  color?: string | ((theme: Theme) => string)
  delay?: number
  animationComplete?: boolean
  style?: React.CSSProperties
}

export const ScrollToButton: React.FC<ScrollToButtonProps> = ({
  scrollToId = "",
  onClick = null,
  color,
  delay = 1.0,
  animationComplete = true,
  style,
}) => {
  const theme = useTheme()
  const buttonColor =
    typeof color === "function"
      ? color(theme)
      : color || theme.palette.blue.darkest

  // if scroll goes to an id in the page
  if (scrollToId) {
    return (
      <ScrollIndicator
        scrollToId={scrollToId}
        color={buttonColor}
        animationComplete={animationComplete}
        delay={delay}
        style={style}
      >
        <CircularArrowButton color={buttonColor} />
      </ScrollIndicator>
    )
  }

  // if scroll runs a function provided
  if (onClick) {
    return (
      <ScrollIndicator
        onClick={onClick}
        color={buttonColor}
        animationComplete={animationComplete}
        delay={delay}
        style={style}
      >
        <CircularArrowButton color={buttonColor} />
      </ScrollIndicator>
    )
  }

  return null
}
