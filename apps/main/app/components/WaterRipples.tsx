"use client"

import { motion } from "@repo/motion"
import { useMemo } from "react"

interface RippleProps {
  centerX: string
  centerY: string
  delay: number
  duration: number
  maxSize: number
  opacity: number
  color: string
}

const Ripple = ({ centerX, centerY, delay, duration, maxSize, opacity, color }: RippleProps) => {
  // Generate random floating parameters like the markers
  const bobDelay = Math.random() * 3
  const driftDelay = Math.random() * 5
  const bobAmount = 6 + Math.random() * 6 // 6-12px vertical movement
  const driftAmount = 10 + Math.random() * 10 // 10-20px horizontal drift
  const bobDuration = 3 + Math.random() * 2
  const driftDuration = 8 + Math.random() * 6

  return (
    <motion.div
      style={{
        position: "absolute",
        left: centerX,
        top: centerY,
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        width: `${maxSize}px`,
        height: `${maxSize}px`,
        backgroundColor: color,
        opacity: 1, // Use the backgroundColor opacity instead
        pointerEvents: "none",
      }}
      animate={{
        // Vertical bobbing motion like markers
        y: [0, -bobAmount, 0],
        // Horizontal drifting motion like markers
        x: [-driftAmount/2, driftAmount/2, -driftAmount/2],
        // Subtle rotation for organic movement
        rotate: [-0.5, 0.5, -0.5],
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
    />
  )
}

interface WaterRipplesProps {
  count?: number
}

export default function WaterRipples({ count = 8 }: WaterRipplesProps) {
  const ripples = useMemo(() => {
    const colors = [
      "rgba(255, 255, 255, 0.16)", // White at 16% opacity
      "rgba(42, 82, 135, 0.16)",   // #2A5287 at 16% opacity
    ]
    
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      centerX: `${5 + Math.random() * 90}%`, // Spread across full width (5-95%)
      centerY: `${25 + Math.random() * 50}%`, // Vertical band across middle
      delay: Math.random() * 8, // Stagger over 8 seconds
      duration: 5 + Math.random() * 3, // 5-8 seconds per ripple cycle (faster)
      maxSize: 180 + Math.random() * 80, // 180-260px diameter (marker scale)
      opacity: 1, // Not used anymore, opacity is in backgroundColor
      color: colors[Math.floor(Math.random() * colors.length)], // Random color selection
    }))
  }, [count])

  return (
    <>
      {ripples.map((ripple) => (
        <Ripple key={ripple.id} {...ripple} />
      ))}
    </>
  )
}
