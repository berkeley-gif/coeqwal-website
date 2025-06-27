"use client"

import React, { useMemo, useRef } from "react"
import {
  motion,
  MotionValue,
  useMotionValueEvent,
  useTransform,
} from "@repo/motion"
import "./pictogram.css"
import { OffWhiteColor } from "../helpers/colorPalette"

interface PictogramProps {
  partialValue: number
  totalValue: number
  partialLabel: string
  totalLabel: string
  iconSize?: number
  size: { width: number; height: number }
  config: {
    shift: { left: string; top: string }
    scale: string
    iconSize: number
    spacing: number
  }
  scrollYProgress: MotionValue<number>
  unit?: number
  rowCount?: number
  reversed?: boolean
}

//TODO" don't use pure white
//TODO: fix the icon layout
function Pictogram({
  partialValue,
  totalValue,
  partialLabel,
  totalLabel,
  scrollYProgress,
  size,
  config,
  iconSize = 16,
  unit = 1000000,
  reversed = true,
  rowCount = 10,
}: PictogramProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [displayStatus, setDisplayStatus] = React.useState("none")

  const setup = useMemo(() => {
    const totalOpacity = reversed ? 0.9 : 0.3
    const partialOpacity = reversed ? 0.3 : 0.9
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
    return {
      totalOpacity,
      partialOpacity,
      totalRoundUp,
      totalFraction,
      filledRoundUp,
      filledFraction,
      icons,
      layout,
      iconCount,
    }
  }, [partialValue, totalValue, unit, reversed, rowCount])

  const decideDisplay = (iconIdx: number): [number, number] => {
    let fill = 100
    let opacity = setup.totalOpacity
    //console.log(count, filledRoundUp, filledFraction, totalRoundUp, totalFraction)
    if (iconIdx < setup.filledRoundUp) {
      opacity = setup.partialOpacity
    } else if (iconIdx === setup.filledRoundUp && setup.filledFraction > 0) {
      fill = setup.filledFraction * 100
      opacity = setup.partialOpacity
    } else if (iconIdx === setup.totalRoundUp && setup.totalFraction > 0) {
      fill = setup.totalFraction * 100
      opacity = setup.totalOpacity
    }
    return [fill, opacity]
  }

  const iconSpacing = iconSize * config.spacing
  const layoutHeight = setup.layout.length * iconSpacing
  const layoutWidth =
    Math.min(rowCount, Math.max(...setup.layout.map((row) => row.length))) *
    iconSpacing

  const svgHeight = size.height
  const svgWidth = size.width
  const verticalOffset = (svgHeight - layoutHeight) / 2
  const horizontalOffset = (svgWidth - layoutWidth) / 2

  const lineX = horizontalOffset - iconSpacing
  const lineStartY = verticalOffset - iconSpacing * 1
  const lineEndY = verticalOffset + layoutHeight + iconSpacing * 1

  const backgroundRectGrowth = useTransform(
    scrollYProgress,
    [0.35, 0.55, 0.9, 1],
    ["0%", "90%", "90%", "0%"],
  )
  const backgroundLineGrowth = useTransform(
    scrollYProgress,
    [0.35, 0.55, 0.9, 1],
    [0, 1, 1, 0],
  )

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.1 || latest >= 1) {
      setDisplayStatus("none")
    } else {
      setDisplayStatus("visible")
    }
  })

  return (
    <motion.div
      style={{
        width: size.width,
        height: size.height,
        position: "fixed",
        left: config.shift.left,
        top: config.shift.top,
        display: displayStatus,
      }}
    >
      <svg ref={svgRef} width="100%" height="100%">
        <defs>
          <clipPath
            id={`clip-${setup.filledFraction * 100}-reversed`}
            clipPathUnits="objectBoundingBox"
          >
            <rect
              x={setup.filledFraction}
              y={0}
              width={1 - setup.filledFraction}
              height={1}
            />
          </clipPath>
          {[setup.filledFraction, setup.totalFraction].map((fraction, idx) => (
            <clipPath
              id={`clip-${fraction * 100}`}
              clipPathUnits="objectBoundingBox"
              key={idx}
            >
              <rect x={0} y={0} width={fraction} height={1} />
            </clipPath>
          ))}
        </defs>

        <motion.rect
          x={lineX - 2.5}
          y={lineStartY}
          width={backgroundRectGrowth}
          height={lineEndY - lineStartY}
          fill="#1a447280"
        />
        <motion.line
          x1={lineX}
          x2={lineX}
          y1={lineStartY}
          y2={lineEndY}
          pathLength={backgroundLineGrowth}
          className="pictogram-line"
        ></motion.line>

        <g transform={`translate(${horizontalOffset}, ${verticalOffset})`}>
          {setup.layout.map((row) =>
            row.map((iconIdx) => {
              const [percentage, opacity] = decideDisplay(iconIdx)
              const x = (iconIdx % rowCount) * iconSpacing
              const y = Math.floor(iconIdx / rowCount) * iconSpacing

              const isFractional =
                (iconIdx === setup.filledRoundUp && setup.filledFraction > 0) ||
                (iconIdx === setup.totalRoundUp && setup.totalFraction > 0)
              const isLastIcon = iconIdx === setup.iconCount - 1

              const clipPath = isFractional ? `url(#clip-${percentage})` : ""

              return (
                <IconContainer
                  key={iconIdx}
                  idx={iconIdx}
                  scrollYProgress={scrollYProgress}
                  config={config}
                  clipPath={clipPath}
                  percentage={percentage}
                  opacity={opacity}
                  isFractional={isFractional}
                  isLastIcon={isLastIcon}
                  x={x}
                  y={y}
                  partialLabel={partialLabel}
                  totalLabel={totalLabel}
                  partialCount={setup.filledRoundUp}
                  totalCount={setup.totalRoundUp}
                />
              )
            }),
          )}
        </g>
      </svg>
    </motion.div>
  )
}

function IconContainer({
  idx,
  scrollYProgress,
  config,
  clipPath,
  percentage,
  opacity,
  isFractional,
  isLastIcon,
  x,
  y,
  partialLabel,
  totalLabel,
  partialCount,
  totalCount,
}: {
  idx: number
  scrollYProgress: MotionValue<number>
  config: {
    shift: { left: string; top: string }
    scale: string
    iconSize: number
    spacing: number
  }
  clipPath?: string
  percentage: number
  opacity: number
  isFractional?: boolean
  isLastIcon?: boolean
  x: number
  y: number
  partialLabel?: string
  totalLabel?: string
  partialCount: number
  totalCount: number
}) {
  const partialGrowth = useTransform(
    scrollYProgress,
    [0.4 + 0.01 * partialCount, 0.5 + 0.01 * partialCount, 0.9, 1],
    [
      "inset(100% 0 0 0)",
      "inset(0 0 0 0)",
      "inset(0 0 0 0)",
      "inset(100% 0 0 0)",
    ],
  )
  const partialOpacity = useTransform(
    scrollYProgress,
    [0.4 + 0.01 * partialCount, 0.5 + 0.01 * partialCount, 0.9, 1],
    [0, 1, 1, 0],
  )

  const totalGrowth = useTransform(
    scrollYProgress,
    [0.5 + 0.01 * totalCount, 0.6 + 0.01 * totalCount, 0.9, 1],
    [
      "inset(100% 0 0 0)",
      "inset(0 0 0 0)",
      "inset(0 0 0 0)",
      "inset(100% 0 0 0)",
    ],
  )
  const totalOpacity = useTransform(
    scrollYProgress,
    [0.5 + 0.01 * totalCount, 0.6 + 0.01 * totalCount, 0.9, 1],
    [0, 1, 1, 0],
  )

  return (
    <>
      <PeopleIcon
        idx={idx}
        scrollYProgress={scrollYProgress}
        clipPath={clipPath}
        transform={`translate(${x}, ${y}) ${config.scale}`}
        opacity={opacity}
      />
      {isFractional && !isLastIcon && (
        <>
          <PeopleIcon
            idx={idx}
            scrollYProgress={scrollYProgress}
            clipPath={`url(#clip-${percentage}-reversed)`}
            transform={`translate(${x}, ${y}) ${config.scale}`}
            opacity={1}
          />
          <motion.line
            x1={x + (config.iconSize * percentage) / 100}
            y1={y + config.iconSize}
            x2={x + (config.iconSize * percentage) / 100}
            y2={y - 30}
            style={{ clipPath: partialGrowth }}
            stroke="#f2f0ef"
            strokeWidth="2"
            strokeDasharray="2,2"
          />
          <motion.text
            fontSize="1rem"
            x={x + (config.iconSize * percentage) / 100}
            y={y - 30}
            dx="-0.5rem"
            style={{
              dominantBaseline: "middle",
              textAnchor: "end",
              opacity: partialOpacity,
            }}
            dy="0.7rem"
          >
            {partialLabel}
          </motion.text>
        </>
      )}
      {isLastIcon && (
        <>
          <motion.line
            x1={x + (config.iconSize * percentage) / 100}
            y1={y}
            x2={x + (config.iconSize * percentage) / 100}
            y2={y + config.iconSize + 30}
            style={{ clipPath: totalGrowth }}
            stroke="#f2f0ef"
            strokeWidth="2"
            strokeDasharray="2,2"
          />
          <motion.text
            fontSize="1rem"
            x={x + (config.iconSize * percentage) / 100}
            y={y + config.iconSize}
            dx="0.5rem"
            style={{
              dominantBaseline: "middle",
              textAnchor: "start",
              fontWeight: "bold",
              opacity: totalOpacity,
            }}
            dy="1rem"
          >
            {totalLabel}
          </motion.text>
        </>
      )}
    </>
  )
}

function PeopleIcon({
  idx,
  scrollYProgress,
  transform,
  opacity,
  clipPath = "",
  fill = OffWhiteColor,
}: {
  idx: number
  scrollYProgress: MotionValue<number>
  transform: string
  opacity: number
  clipPath?: string
  fill?: string
}) {
  const growth = useTransform(
    scrollYProgress,
    [0.35 + 0.01 * idx, 0.55 + 0.01 * idx, 0.9, 1],
    [0, 1, 1, 0],
  )

  return (
    <g transform={transform}>
      <motion.g style={{ opacity, scale: growth }} clipPath={clipPath}>
        <path
          d="M10 10C10 4.475 14.475 0 20 0C25.525 0 30 4.475 30 10C30 15.525 25.525 20 20 20C14.475 20 10 15.525 10 10Z"
          fill={fill}
        />
        <path
          d="M20 25C8.95 25 0 29.5 0 35V40H40V35C40 29.5 31.05 25 20 25Z"
          fill={fill}
        />
      </motion.g>
    </g>
  )
}

export default Pictogram
