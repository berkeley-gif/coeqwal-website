import React from "react"
import { useTheme } from "../../mui-components"
import { ScrollIndicator } from "@repo/motion/components"
import { CircularArrowButton } from "../common/CircularArrowButton"

interface ScrollToButtonProps {
  scrollToId: string
  color?: string
  delay?: number
  animationComplete?: boolean
  style?: React.CSSProperties
}

export const ScrollToButton: React.FC<ScrollToButtonProps> = ({
  scrollToId,
  color,
  delay = 1.0,
  animationComplete = true,
  style,
}) => {
  const theme = useTheme()
  const buttonColor = color || theme.palette.blue.darkest

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
