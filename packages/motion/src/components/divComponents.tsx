import { Box, BoxProps } from "@repo/ui/mui"
import { motion, HTMLMotionProps } from "framer-motion"
import { ComponentType } from "react"

export const MotionParagraph = motion.create(Box) as ComponentType<
  BoxProps & HTMLMotionProps<"div">
>
