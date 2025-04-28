"use client"

import React, { useRef, useEffect, useState } from "react"
import { motion } from "@repo/motion"
import rough from "roughjs"

interface RoughUnderlineProps {
  children: React.ReactNode
  stroke?: string
  strokeWidth?: number
  gap?: number
  roughness?: number
  opacity?: number
  delay?: number
  duration?: number
  startAnimation?: boolean
}

export default function Underline({
  children,
  stroke = "#F2F0EF",
  strokeWidth = 4,
  gap = 5,
  roughness = 4,
  opacity = 0.9,
  delay = 0.2,
  duration = 1.0,
  startAnimation = false,
}: RoughUnderlineProps) {
  const spanRef = useRef<HTMLSpanElement>(null)
  const [width, setWidth] = useState(0)
  const [pathD, setPathD] = useState("")

  // 1) measure text width
  useEffect(() => {
    const measure = () => {
      if (spanRef.current) {
        setWidth(spanRef.current.offsetWidth)
      }
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [children])

  // 2) generate rough-path "d"
  useEffect(() => {
    if (width === 0) {
      setPathD("")
      return
    }

    const svgTemp = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    )
    svgTemp.setAttribute("xmlns", "http://www.w3.org/2000/svg")

    const rc = rough.svg(svgTemp)
    const y = strokeWidth / 2 + gap
    const node = rc.line(0, y, width, y, {
      stroke,
      strokeWidth,
      roughness,
      bowing: 1.5,
    })

    const pathEl = node.querySelector("path") as SVGPathElement | null
    if (!pathEl) {
      console.warn("no <path> found inside rough-node", node)
      setPathD("")
      return
    }

    pathEl.setAttribute("stroke-opacity", `${opacity}`)
    setPathD(pathEl.getAttribute("d") || "")
  }, [width, stroke, strokeWidth, gap, roughness, opacity])

  return (
    <span
      ref={spanRef}
      style={{
        position: "relative",
        display: "inline-block",
        paddingBottom: gap + strokeWidth,
      }}
    >
      {children}

      {pathD && (
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          overflow="visible"
          viewBox={`0 0 ${width} ${gap + strokeWidth * 2}`}
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: "100%",
            height: `${gap + strokeWidth * 2}px`,
            pointerEvents: "none",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: startAnimation ? 1 : 0 }}
        >
          <motion.path
            d={pathD}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeOpacity={opacity}
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: startAnimation ? 1 : 0 }}
            transition={{
              pathLength: { duration, ease: "easeInOut", delay },
            }}
          />
        </motion.svg>
      )}
    </span>
  )
}
