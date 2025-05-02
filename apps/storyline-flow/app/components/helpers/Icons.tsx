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

export function MoneyBagIcon({
  color = "#f2f0ef",
  delay = 0.5,
  animation = "hidden",
}: IconProps) {
  return (
    <>
      <motion.path
        style={{
          fill: color,
          transform: "scale(0.12)",
        }}
        variants={labelVariants}
        initial="hidden"
        animate={animation}
        custom={delay}
        d="M67.668,7.731c-1.002-1.537-1.083-3.5-0.208-5.113C68.333,1.005,70.021,0,71.856,0h56.153c1.835,0,3.522,1.005,4.396,2.618  c0.874,1.614,0.794,3.576-0.208,5.113L125.3,18.308c-2.883,4.721-6.018,12.657-6.891,19.467h-7.943l2.071-4.472  c1.161-2.506,0.07-5.478-2.436-6.638c-2.506-1.161-5.479-0.069-6.638,2.436l-3.276,7.075l-4.864-12.961  c-0.97-2.585-3.852-3.895-6.438-2.924c-2.585,0.97-3.895,3.853-2.924,6.438l4.146,11.046h-9.448  c-1.353-10.379-8.054-22.33-8.732-23.516L67.668,7.731z M80.201,111.821c0,5.398,4.387,9.785,9.779,9.785h4.952v-19.564H89.98  C84.588,102.042,80.201,106.429,80.201,111.821z M104.932,151.171h4.949c5.394,0,9.782-4.389,9.782-9.783s-4.388-9.782-9.782-9.782  h-4.949V151.171z M170.49,140.626c0,35.986-27.695,59.238-70.558,59.238s-70.558-23.252-70.558-59.238  c0-27.145,16.112-68.644,42.142-88.358c0.062-0.047,0.125-0.092,0.189-0.136c1.31-0.908,3.188-2.491,4.903-4.357H89.51l-2.838,6.128  c-1.161,2.506-0.07,5.478,2.436,6.638c0.68,0.315,1.395,0.464,2.098,0.464c1.888,0,3.695-1.074,4.541-2.9l4.043-8.731l4.864,12.961  c0.753,2.007,2.658,3.245,4.682,3.245c0.583,0,1.177-0.103,1.756-0.32c2.585-0.97,3.895-3.853,2.924-6.438l-4.146-11.047h12.465  c0.641,0.63,1.316,1.205,1.999,1.694C151.949,67.175,170.49,110.868,170.49,140.626z M104.932,121.606v-19.564h19.731  c2.761,0,5-2.239,5-5s-2.239-5-5-5h-19.731v-3.601c0-2.761-2.239-5-5-5s-5,2.239-5,5v3.601H89.98  c-10.906,0-19.779,8.873-19.779,19.785c0,10.906,8.873,19.779,19.779,19.779h4.952v19.565H75.201c-2.761,0-5,2.239-5,5s2.239,5,5,5  h19.731v5.197c0,2.761,2.239,5,5,5s5-2.239,5-5v-5.197h4.949c10.908,0,19.782-8.875,19.782-19.783  c0-10.908-8.874-19.782-19.782-19.782H104.932z"
      ></motion.path>
    </>
  )
}

export function FarmIcon({
  color = "#f2f0ef",
  delay = 0.5,
  animation = "hidden",
}: IconProps) {
  return (
    <>
      <motion.path
        style={{
          fill: color,
          transform: "translate(-5px, -15px)",
        }}
        variants={labelVariants}
        initial="hidden"
        animate={animation}
        custom={delay}
        d="M14.5 8.5C16.914 8.5 18.885 10.401 18.995 12.788L19 13V17.698L24.405 13.696C24.733 13.453 25.172 13.437 25.514 13.642L25.625 13.719L31 18.02V14.5H33V19.62L35.625 21.719L34.375 23.281L33 22.18L32.999 26.5H35C35.513 26.5 35.936 26.886 35.993 27.383L36 27.5V35.5C36 36.013 35.614 36.436 35.117 36.493L35 36.5H8V34.5H15.545L17.295 32.5H8V30.5H19V30.552L20.795 28.5H8V26.5H10V13C10 10.515 12.015 8.5 14.5 8.5ZM26.795 28.5H23.453L18.203 34.5H21.545L26.795 28.5ZM34 30.16L30.203 34.5H34V30.16ZM32.795 28.5H29.453L24.203 34.5H27.545L32.795 28.5ZM31 20.58L24.976 15.761L19 20.187V26.5H21.999L22 22.5C22 21.987 22.386 21.564 22.883 21.507L23 21.5H27C27.513 21.5 27.936 21.886 27.993 22.383L28 22.5L27.999 26.5H30.999L31 20.58ZM14.5 10.5C13.175 10.5 12.09 11.532 12.005 12.836L12 13V26.5H17V13C17 11.619 15.881 10.5 14.5 10.5ZM26 23.5H24V26.5H26V23.5Z"
      ></motion.path>
    </>
  )
}
