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
    
    // Define size categories for visual hierarchy
    const sizeCategories = [
      { size: 200, weight: 3 }, // Large bubbles
      { size: 160, weight: 2 }, // Medium bubbles  
      { size: 120, weight: 1 }, // Small bubbles
    ]
    
    // Create distribution zones - main milky way plus scattered outliers
    const zones = [
      // Main California area - denser coverage
      { x: [25, 75], y: [25, 75], density: 0.5, preferredSize: 1 }, // Medium, main cluster
      // Left area - larger bubbles
      { x: [5, 35], y: [20, 80], density: 0.2, preferredSize: 0 }, // Large
      // Right area - smaller bubbles  
      { x: [65, 95], y: [20, 80], density: 0.15, preferredSize: 2 }, // Small
      // Upper scattered - above milky way
      { x: [15, 85], y: [5, 25], density: 0.1, preferredSize: 2 }, // Small, scattered above
      // Lower scattered - below milky way
      { x: [15, 85], y: [75, 95], density: 0.05, preferredSize: 1 }, // Medium, scattered below
    ]
    
    const bubbles: any[] = []
    let colorIndex = Math.floor(Math.random() * 2) // Start with random color
    
    // Distribute bubbles across zones
    zones.forEach((zone, zoneIndex) => {
      const bubblesInZone = Math.ceil(count * zone.density)
      
      for (let i = 0; i < bubblesInZone && bubbles.length < count; i++) {
        // Calculate position within zone with golden ratio spacing
        const phi = (1 + Math.sqrt(5)) / 2 // Golden ratio
        const goldenAngle = 2 * Math.PI / (phi * phi)
        
        const angle = i * goldenAngle
        const radius = Math.sqrt(i / bubblesInZone) * 0.8 // Spiral outward
        
        // Convert polar to cartesian within zone bounds
        const centerX = (zone.x[0] + zone.x[1]) / 2
        const centerY = (zone.y[0] + zone.y[1]) / 2
        const rangeX = (zone.x[1] - zone.x[0]) / 2
        const rangeY = (zone.y[1] - zone.y[0]) / 2
        
        const x = centerX + Math.cos(angle) * radius * rangeX
        const y = centerY + Math.sin(angle) * radius * rangeY
        
        // Ensure bounds
        const finalX = Math.max(zone.x[0], Math.min(zone.x[1], x))
        const finalY = Math.max(zone.y[0], Math.min(zone.y[1], y))
        
        // Size selection with some variation
        const sizeCategory = sizeCategories[zone.preferredSize]
        const sizeVariation = 20 + Math.random() * 40 // ±20px variation
        const finalSize = sizeCategory.size + (Math.random() - 0.5) * sizeVariation
        
        bubbles.push({
          id: bubbles.length,
          centerX: `${finalX}%`,
          centerY: `${finalY}%`,
          delay: Math.random() * 10, // Longer stagger for better effect
          duration: 4 + Math.random() * 4, // 4-8 seconds
          maxSize: Math.max(100, Math.min(280, finalSize)), // Clamp size
          opacity: 1,
          color: colors[colorIndex % 2], // Alternate colors
        })
        
        // Alternate color, but with occasional breaks for natural feel
        if (Math.random() > 0.2) { // 80% chance to alternate
          colorIndex++
        }
      }
    })
    
    // If we need more bubbles, fill remaining with balanced approach
    while (bubbles.length < count) {
      const remainingZone = zones[bubbles.length % zones.length]
      const x = remainingZone.x[0] + Math.random() * (remainingZone.x[1] - remainingZone.x[0])
      const y = remainingZone.y[0] + Math.random() * (remainingZone.y[1] - remainingZone.y[0])
      
      bubbles.push({
        id: bubbles.length,
        centerX: `${x}%`,
        centerY: `${y}%`,
        delay: Math.random() * 10,
        duration: 4 + Math.random() * 4,
        maxSize: 140 + Math.random() * 80,
        opacity: 1,
        color: colors[colorIndex % 2],
      })
      colorIndex++
    }
    
    return bubbles.slice(0, count) // Ensure exact count
  }, [count])

  return (
    <>
      {ripples.map((ripple) => (
        <Ripple key={ripple.id} {...ripple} />
      ))}
    </>
  )
}
