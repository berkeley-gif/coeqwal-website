import { motion } from "@repo/motion"
import { labelVariants } from "@repo/motion/variants"

interface IconProps {
  color?: string
  transform?: string
  delay?: number
  animation?: string
}

export function VisibleIcon({
  color = "#f2f0ef",
  transform = "translate(0, 0)",
  delay = 0.5,
  animation = "hidden",
}: IconProps) {
  return (
    <motion.path
      style={{
        fill: color,
        transform: transform,
      }}
      variants={labelVariants}
      initial="hidden"
      animate={animation}
      custom={delay}
      d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5M12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5m0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3"
    ></motion.path>
  )
}

export function ArticleIcon({
  color = "#f2f0ef",
  transform = "translate(0, 0)",
  delay = 0.5,
  animation = "hidden",
}: IconProps) {
  return (
    <motion.path
      style={{
        fill: color,
        transform: transform,
      }}
      variants={labelVariants}
      initial="hidden"
      animate={animation}
      custom={delay}
      d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m-1 9H9V9h10zm-4 4H9v-2h6zm4-8H9V5h10z"
    ></motion.path>
  )
}

export function PeopleIcon({
  color = "#f2f0ef",
  transform = "translate(0, 0)",
  delay = 0.5,
  animation = "hidden",
}: IconProps) {
  return (
    <>
      <motion.path
        style={{
          fill: color,
          transform: transform,
        }}
        variants={labelVariants}
        initial="hidden"
        animate={animation}
        custom={delay}
        d="M10 10C10 4.475 14.475 0 20 0C25.525 0 30 4.475 30 10C30 15.525 25.525 20 20 20C14.475 20 10 15.525 10 10Z"
      ></motion.path>
      <motion.path
        style={{
          fill: color,
          transform: transform,
        }}
        variants={labelVariants}
        initial="hidden"
        animate={animation}
        custom={delay}
        d="M20 25C8.95 25 0 29.5 0 35V40H40V35C40 29.5 31.05 25 20 25Z"
      ></motion.path>
    </>
  )
}
