import { Typography, TypographyProps } from "@repo/ui/mui"
import { motion, MotionProps } from "framer-motion"
import React from "react"

// Create props interface that combines Typography and Motion props
interface MotionTextProps
  extends Omit<TypographyProps & MotionProps, "children"> {
  children?: React.ReactNode
  animationDisabled?: boolean
}

const MotionTypography = motion.create(Typography)
// Create the MotionText component
export const Paragraph: React.FC<MotionTextProps> = ({
  children,
  variants,
  initial = "hidden",
  whileInView = "visible",
  viewport = { once: true, amount: 0.6 },
  custom = 0,
  ...typographyProps
}) => {
  return (
    <MotionTypography
      variants={variants}
      initial={initial}
      whileInView={whileInView}
      viewport={viewport}
      custom={custom}
      {...typographyProps}
    >
      {children}
    </MotionTypography>
  )
}
