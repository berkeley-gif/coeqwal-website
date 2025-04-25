"use client"

import { ReactNode } from "react"
import { motion } from "@repo/motion"

interface AnimatedMarkerProps {
  id: string | number
  color?: string
  size?: number
  onClick?: () => void
  children?: ReactNode
}

export default function AnimatedMarker({
  id,
  color = "#FF5722",
  size = 20,
  onClick,
  children,
}: AnimatedMarkerProps) {
  // Animation variants
  const pulseVariants = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={pulseVariants}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        borderRadius: "50%",
        border: "2px solid white",
        boxShadow: "0 0 4px rgba(0,0,0,0.5)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClick || (() => console.log(`Clicked marker ${id}`))}
      data-marker-id={id}
    >
      {children}
    </motion.div>
  )
}
