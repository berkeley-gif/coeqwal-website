import { Typography, TypographyProps } from "@repo/ui/mui"
import { motion, MotionProps } from "framer-motion"
import { springUpTextVariants } from "../variants"
import React from "react"

// Create props interface that combines Typography and Motion props
interface MotionTextProps
  extends Omit<TypographyProps & MotionProps, "children"> {
  children?: React.ReactNode
  animationDisabled?: boolean
  options?: { amount?: number; once?: boolean; duration?: number }
}

const MotionTypography = motion.create(Typography)
// Create the MotionText component
export const Sentence: React.FC<MotionTextProps> = ({
  children,
  variant = "body1",
  variants = springUpTextVariants,
  initial = "hidden",
  whileInView = "visible",
  options = { amount: 0.5, once: true },
  custom = 0,
  ...typographyProps
}) => {
  return (
    <MotionTypography
      variant={variant}
      variants={variants}
      initial={initial}
      whileInView={whileInView}
      viewport={options}
      custom={custom}
      {...typographyProps}
    >
      {children}
    </MotionTypography>
  )
}

//For scroll-based animations
export const StaticSentence: React.FC<MotionTextProps> = ({
  children,
  variant = "body1",
  ...typographyProps
}) => {
  return (
    <MotionTypography variant={variant} {...typographyProps}>
      {children}
    </MotionTypography>
  )
}
