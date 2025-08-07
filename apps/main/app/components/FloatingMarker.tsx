"use client"

import { motion } from "@repo/motion"
import Image from "next/image"

interface FloatingMarkerProps {
  src: string
  top: string // e.g. "25%" or "65px"
  left?: string // optional if using right
  right?: string // optional alternative to left
  size?: number | string // px or CSS size
}

export default function FloatingMarker({ src, left, right, top, size = 80 }: FloatingMarkerProps) {
  // Generate random parameters for each marker to create unique movement
  const bobDelay = Math.random() * 3 // 0-3 seconds
  const driftDelay = Math.random() * 5 // 0-5 seconds
  const bobAmount = 8 + Math.random() * 8 // 8-16px vertical movement
  const driftAmount = 15 + Math.random() * 15 // 15-30px horizontal drift
  const bobDuration = 3 + Math.random() * 2 // 3-5 seconds
  const driftDuration = 8 + Math.random() * 6 // 8-14 seconds

  return (
    <motion.div
      style={{
        position: "absolute",
        ...(left ? { left } : {}),
        ...(right ? { right } : {}),
        top,
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
      }}
      animate={{
        // Vertical bobbing motion
        y: [0, -bobAmount, 0],
        // Horizontal drifting motion
        x: [-driftAmount/2, driftAmount/2, -driftAmount/2],
        // Subtle rotation for more organic movement
        rotate: [-1, 1, -1],
      }}
      transition={{
        y: {
          duration: bobDuration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: bobDelay,
        },
        x: {
          duration: driftDuration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: driftDelay,
        },
        rotate: {
          duration: bobDuration * 1.3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: bobDelay * 0.7,
        },
      }}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes={typeof size === "number" ? `${size}px` : size}
        priority
        style={{ objectFit: "contain", pointerEvents: "none" }}
      />
    </motion.div>
  )
}
