import React, { useRef } from "react"
import { motion } from "@repo/motion"
import { opacityVariants } from "@repo/motion/variants"

export interface UnderlineLegendProps {
  /** Colors for each segment of the underline */
  colors: string[]
  /** Height of the underline in pixels */
  height?: number
  /** Space between text baseline and top of the underline */
  gap?: number
  /** CSS class for custom styling */
  className?: string
  /** The text or element to wrap */
  children: React.ReactNode
  /** Labels to show between color segments */
  labels?: string[] | number[]
}

const Legend: React.FC<UnderlineLegendProps> = ({
  colors,
  height = 10,
  gap = 2,
  className,
  children,
  labels = [0, 25, 50, 75, 100],
}) => {
  const containerRef = useRef<HTMLSpanElement>(null)
  const radius = 0.5 * height // radius of the circle

  // Helper to drop the alpha channel from an rgba(...) string
  const getOpaqueColor = (c: string) => {
    const rgbaMatch = c.match(
      /rgba?\(\s*([\d]+\s*,\s*[\d]+\s*,\s*[\d]+)\s*,\s*[\d.]+\s*\)/,
    )
    return rgbaMatch ? `rgb(${rgbaMatch[1]})` : c
  }

  return (
    <span
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        paddingBottom: gap + height + 5,
      }}
    >
      {children}

      {/* color legend */}
      <motion.div
        variants={opacityVariants}
        initial="hidden"
        whileInView={"visible"}
        transition={{ once: true }}
        custom={0.5}
        style={{
          position: "absolute",
          padding: "1.5px",
          bottom: 5,
          left: 0,
          width: "100%",
          height,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {colors.map((color, idx) => {
          const strokeColor = getOpaqueColor(color)
          return (
            <div
              key={idx}
              style={{
                flex: 1,
                backgroundColor: color,
                border: `0.6px solid ${strokeColor}`,
                boxSizing: "border-box",
                borderTopRightRadius: idx === colors.length - 1 ? radius : 0,
                borderTopLeftRadius: idx === 0 ? radius : 0,
                borderBottomRightRadius: idx === colors.length - 1 ? radius : 0,
                borderBottomLeftRadius: idx === 0 ? radius : 0,
                paddingRight: idx < colors.length - 1 ? "0.15px" : "0",
              }}
            />
          )
        })}
      </motion.div>

      {/* Labels positioned at color segment boundaries */}
      <motion.div
        variants={opacityVariants}
        initial="hidden"
        whileInView={"visible"}
        custom={0.7}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
        }}
      >
        {labels.map((label, idx) => {
          const percentage = idx * (100 / (labels.length - 1))
          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: `${percentage}%`,
                transform: "translateX(-50%)",
                textAlign: "center",
              }}
            >
              {label}
            </div>
          )
        })}
      </motion.div>
    </span>
  )
}

export default Legend
