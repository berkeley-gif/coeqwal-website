"use client"

import React, { useEffect, useMemo } from "react"
import { motion } from "@repo/motion"
import "./concentric-circle.css"
import { IconProps } from "../helpers/Icons"

type Entry = {
  year: number
  value: number
  annotation: string
}

//TODO: now size and shift are all for positioning lol

const RadiusSpringUpVariants = {
  hidden: { r: 0 },
  visible: (custom: { radius: number; delay: number }) => ({
    r: custom.radius,
    transition: {
      type: "spring",
      duration: 60,
      damping: 10,
      delay: custom.delay,
    },
  }),
}

const OpacityVariants = {
  hidden: { opacity: 0 },
  visible: (custom: number) => ({
    opacity: 1,
    transition: { delay: custom, duration: 1 },
  }),
}

function ConcentricCircle({
  data,
  startAnimation = false,
  delay = 0,
  radius = 50,
  size = { width: 500, height: 500 },
  shift = [0.25, 0.25],
  clipId = "",
}: {
  data: {
    past: Entry
    present: Entry
    title: string
    icon: React.FC
  }
  radius?: number
  size?: { width: number; height: number }
  shift?: [number, number]
  clipId?: string
  startAnimation: boolean
  delay: number
}) {
  const center = useMemo(() => {
    return {
      x: size.width / 2 + shift[0] * size.width,
      y: size.height / 2 + shift[1] * size.height,
    }
  }, [size, shift])

  const growth = data.present.value / data.past.value

  useEffect(() => {
    console.log(radius, growth, radius * growth)
  }, [growth, radius])

  return (
    <svg width="100%" height="100%">
      <CircleMask center={center} radius={radius} clipId={clipId} />
      <motion.circle
        className="cc-circle"
        cx={center.x}
        cy={center.y}
        r={radius}
        fill="none"
        variants={RadiusSpringUpVariants}
        custom={{ radius: radius, delay: delay + 1.5 }}
        initial="hidden"
        animate={startAnimation ? "visible" : "hidden"}
      />
      <motion.circle
        className="cc-circle"
        cx={center.x}
        cy={center.y}
        r={radius * growth}
        mask={`url(#circle-mask-${clipId})`}
        fillOpacity={0.1}
        fill="white"
        variants={RadiusSpringUpVariants}
        custom={{ radius: radius * growth, delay: delay + 3.5 }}
        initial="hidden"
        animate={startAnimation ? "visible" : "hidden"}
      />
      <Label
        entity={data.past}
        x={center.x}
        y={center.y - radius * (1 + 0.3)}
        delay={2.5 + delay}
        startAnimation={startAnimation}
        Icon={data.icon}
      />
      <Label
        entity={data.present}
        x={center.x}
        y={center.y - radius * (growth - 0.5 - 0.3)}
        delay={4.5 + delay}
        startAnimation={startAnimation}
        Icon={data.icon}
      />
      <motion.text
        className="cc-circle-label"
        x={center.x}
        y={center.y}
        textAnchor="middle"
        fontSize="1.2rem"
        fontWeight="bold"
        variants={OpacityVariants}
        initial="hidden"
        animate={startAnimation ? "visible" : "hidden"}
        custom={1 + delay}
      >
        {data.title}
      </motion.text>
    </svg>
  )
}

function CircleMask({
  center,
  radius,
  clipId,
}: {
  center: { x: number; y: number }
  radius: number
  clipId: string
}) {
  return (
    <mask id={`circle-mask-${clipId}`}>
      <rect width="100%" height="100%" fill="white" />
      <circle cx={center.x} cy={center.y} r={radius} fill="black" />
    </mask>
  )
}

function Label({
  entity,
  x,
  y,
  delay = 0.5,
  startAnimation = false,
  Icon,
}: {
  entity: Entry
  x: number
  y: number
  delay: number
  startAnimation: boolean
  Icon: React.FC<IconProps>
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <motion.text
        x={0}
        y={0}
        variants={OpacityVariants}
        initial="hidden"
        animate={startAnimation ? "visible" : "hidden"}
        custom={delay}
        className="cc-circle-label"
        textAnchor="start"
        fontSize="1rem"
      >
        {entity.annotation}
      </motion.text>
      <motion.text
        x={0}
        y={0}
        variants={OpacityVariants}
        initial="hidden"
        animate={startAnimation ? "visible" : "hidden"}
        custom={delay}
        dx="-0.6em"
        className="cc-circle-label"
        textAnchor="end"
        dominantBaseline="middle"
        fill="white"
        fontWeight="bold"
        fontSize="1rem"
      >
        {entity.year}
      </motion.text>
      <g
        transform={`translate(${estimateTextWidth(entity.annotation) + 5}, -12)`}
      >
        <Icon
          delay={delay}
          animation={startAnimation ? "visible" : "hidden"}
          transform="scale(0.5)"
        />
      </g>
    </g>
  )
}

function estimateTextWidth(
  text: string,
  fontSize: string = "1rem", // Numeric value in pixels
  fontWeight: string = "normal",
) {
  // Convert fontSize string to number if needed
  let fontSizeNum: number = parseFloat(fontSize.replace(/[^0-9.]/g, ""))
  // Handle rem units by approximating 1rem = 16px
  if (fontSize.includes("rem")) {
    fontSizeNum *= 16
  }
  // Handle em units similarly
  else if (fontSize.includes("em")) {
    fontSizeNum *= 16
  }
  // Handle px units
  else if (fontSize.includes("px")) {
    // No conversion needed, already in pixels
  }

  const avgCharWidth = fontWeight === "bold" ? 0.63 : 0.58

  // Apply character-specific width adjustments
  return text.split("").reduce((width, char) => {
    if (/[il|.]/.test(char)) return width + fontSizeNum * 0.3
    if (/[mwWM@]/.test(char)) return width + fontSizeNum * 0.85
    if (/[%GOQC&]/.test(char)) return width + fontSizeNum * 0.8
    return width + fontSizeNum * avgCharWidth
  }, 0)
}

export default ConcentricCircle
