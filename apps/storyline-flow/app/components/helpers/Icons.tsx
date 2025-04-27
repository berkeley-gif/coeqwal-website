import { motion } from "@repo/motion"
import { labelVariants } from "@repo/motion/variants"

export interface IconProps {
  color?: string
  transform?: string
  delay?: number
  animation?: string
  onAnimationComplete?: () => void
}

export function VisibleIcon({
  color = "#f2f0ef",
  transform = "translate(0, 0)",
  delay = 0.5,
  animation = "hidden",
  onAnimationComplete = () => {},
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
      onAnimationComplete={onAnimationComplete}
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

export function AlmondIcon({
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
        d="M25.0369 0C38.9837 11.7936 41.3044 21.9764 41.3044 30.9735C41.3045 39.4082 35.6113 48.6968 26.8329 49.8802C26.2595 49.9576 25.6728 49.9984 25.0737 50C24.4746 49.9984 23.8874 49.9576 23.3128 49.8802C14.5183 48.6968 8.69571 39.4082 8.69575 30.9735C8.69578 21.9764 11.0165 11.7936 24.9633 0H25.0369ZM38.3601 30.8008C38.3601 23.7005 35.9377 12.847 24.9188 3.53983H24.8606C13.8417 12.847 11.7137 23.7005 11.7137 30.8008C11.7137 37.4573 16.6083 45.7267 23.5566 46.6607C24.0104 46.7217 24.4742 46.7539 24.9475 46.7552C25.4206 46.7539 25.8848 46.7217 26.3378 46.6607C33.2733 45.7267 38.3601 37.4573 38.3601 30.8008Z"
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
        d="M26.2146 47.5664V3.46608H23.5647V47.5664H26.2146Z"
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
        d="M21.1355 3.68732C17.9126 19.7133 13.8319 27.9366 20.9883 49.2626H23.491C16.1874 27.9366 20.4153 19.7133 23.6382 3.68732H21.1355Z"
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
        d="M28.6494 3.83481C31.8723 19.8608 35.9531 28.0841 28.7967 49.4101H26.294C33.5976 28.0841 29.3696 19.8608 26.1467 3.83481H28.6494Z"
      ></motion.path>
    </>
  )
}
