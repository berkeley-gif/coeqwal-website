"use client"

import React, { useRef, useEffect, useState } from "react"
import { Box } from "@repo/ui/mui"
import { motion } from "@repo/motion"
import {
  labelVariants,
  axisVariants,
  popUpVariants,
} from "@repo/motion/variants"
import "./pictogram.css"

interface PictogramProps {
  partialValue: number
  totalValue: number
  unit?: number
  size?: number
  title?: string
  rowCount?: number
  reversed?: boolean
  labels?: string[]
  Icon: React.FC<{
    fillPercentage?: number
    size?: number
    reversed?: boolean
    style?: React.CSSProperties
  }>
}

//TODO" don't use pure white
//TODO: fix the icon layout
function Pictogram({
  partialValue,
  totalValue,
  Icon,
  unit = 1,
  size = 50,
  title = "Pictogram",
  reversed = false,
  rowCount = 10,
  labels = [],
}: PictogramProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [border, setBorder] = useState({ x: 0, y: 0, width: 0, height: 0 })

  const totalOpacity = reversed ? 1 : 0.5
  const partialOpacity = reversed ? 0.5 : 1
  const numerator = parseFloat((partialValue / unit).toFixed(2)) // Number of filled icons
  const denominator = parseFloat((totalValue / unit).toFixed(2))

  const totalRoundUp = Math.floor(denominator) // Complete icons
  const totalFraction = parseFloat((denominator - totalRoundUp).toFixed(2)) // Whether there are incomplete
  const iconCount = totalRoundUp + (totalFraction > 0 ? 1 : 0)

  const filledRoundUp = Math.floor(numerator) // Complete icons
  const filledFraction = parseFloat((numerator - filledRoundUp).toFixed(2)) // Whether there are incomplete

  const icons = Array.from({ length: iconCount }, (_, index) => index)

  const layout: number[][] = []
  for (let i = 0; i < icons.length; i += rowCount) {
    layout.push(icons.slice(i, i + rowCount))
  }

  const decideDisplay = (iconIdx: number): [number, number] => {
    let fill = 100
    let opacity = totalOpacity
    //console.log(count, filledRoundUp, filledFraction, totalRoundUp, totalFraction)
    if (iconIdx < filledRoundUp) {
      opacity = partialOpacity
    } else if (iconIdx === filledRoundUp && filledFraction > 0) {
      fill = filledFraction * 100
      opacity = partialOpacity
    } else if (iconIdx === totalRoundUp && totalFraction > 0) {
      fill = totalFraction * 100
      opacity = totalOpacity
    }
    return [fill, opacity]
  }

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setBorder(rect)
    }
  }, [])

  return (
    <Box
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
      }}
    >
      <Box
        ref={ref}
        style={{ display: "flex", width: "10rem", height: "100%" }}
      >
        <svg width="100%" height="100%">
          <motion.text
            className="pictogram-label"
            y="50%"
            x="85%"
            variants={labelVariants}
            initial="hidden"
            whileInView="visible"
          >
            {title}
          </motion.text>
          {labels.map((label, idx) => (
            <motion.text
              key={idx}
              y="50%"
              x="85%"
              dy={`${(idx + 1) * 1.5 + 1}rem`}
              className="pictogram-city-label"
            >
              {label}
            </motion.text>
          ))}
          <motion.line
            x1={border.width}
            x2={border.width}
            y2={border.height}
            y1={0}
            className="pictogram-line"
            variants={axisVariants}
            initial="hidden"
            whileInView="visible"
          ></motion.line>
        </svg>
      </Box>
      <Box style={{ margin: 20 }}>
        {layout.map((row, idx) => (
          <div key={idx} style={{ display: "flex" }}>
            {row.map((iconIdx) => {
              const [percentage, opacity] = decideDisplay(iconIdx)
              if (iconIdx === filledRoundUp && filledFraction > 0) {
                return (
                  <motion.div
                    variants={popUpVariants}
                    initial="hidden"
                    whileInView="visible"
                    custom={iconIdx}
                    key={iconIdx}
                    style={{ position: "relative", width: size, height: size }}
                  >
                    {totalOpacity < partialOpacity && (
                      <Icon
                        fillPercentage={100 - percentage}
                        reversed={true}
                        size={size}
                        style={{
                          opacity: totalOpacity,
                          position: "absolute",
                          top: 0,
                          left: 0,
                        }}
                      />
                    )}
                    <Icon
                      fillPercentage={percentage}
                      size={size}
                      style={{
                        opacity: opacity,
                        position: "absolute",
                        top: 0,
                        left: 0,
                      }}
                    />
                    {partialOpacity < totalOpacity && (
                      <Icon
                        fillPercentage={100 - percentage}
                        reversed={true}
                        size={size}
                        style={{
                          opacity: totalOpacity,
                          position: "absolute",
                          top: 0,
                          left: 0,
                        }}
                      />
                    )}
                  </motion.div>
                )
              }
              return (
                <motion.div
                  key={iconIdx}
                  variants={popUpVariants}
                  initial="hidden"
                  whileInView="visible"
                  custom={iconIdx}
                >
                  <Icon
                    fillPercentage={percentage}
                    size={size}
                    style={{ opacity: opacity }}
                  />
                </motion.div>
              )
            })}
          </div>
        ))}
      </Box>
    </Box>
  )
}

export default Pictogram
