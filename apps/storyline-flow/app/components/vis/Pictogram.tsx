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
import { pictogramConfig } from "../helpers/breakpoints"
import { useTheme } from "@repo/ui/mui"

interface PictogramProps {
  partialValue: number
  totalValue: number
  partialLabel: string
  totalLabel: string
  iconSize?: number
  size: { width: number; height: number }
  config: pictogramConfig
  scrollYProgress: MotionValue<number>
  unit?: number
  rowCount?: number
  reversed?: boolean
}

interface PictogramIconProps {
  idx: number
  scrollYProgress: MotionValue<number>
  transform: string
  opacity: number
  control: [number, number]
  unit?: number
  clipPath?: string
  fill?: string
}

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
  const [displayStatus, setDisplayStatus] = React.useState<
    "visible" | "hidden"
    >("hidden")
  const theme = useTheme()

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
    Math.max(...setup.layout.map((row) => row.length)) * iconSpacing

  const svgHeight = size.height
  const svgWidth = size.width
  const verticalOffset = (svgHeight - layoutHeight) / 2
  const horizontalOffset = (svgWidth - layoutWidth) / 2

  const lineX = horizontalOffset + layoutWidth + 10
  const lineStartY = verticalOffset - iconSpacing * 1
  const lineEndY = verticalOffset + layoutHeight + iconSpacing * 1
  const generalControl = config.animation.generalControl

  const backgroundLineGrowth = useTransform(
    scrollYProgress,
    generalControl,
    [0, 1],
  )

  const overallOpacity = useTransform(scrollYProgress, [0.97, 1], [1, 0])

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.1 || latest >= 1) {
      setDisplayStatus("hidden")
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
        visibility: displayStatus,
        opacity: overallOpacity,
        fontSize: theme.typography.caption.fontSize,
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
        {config.animation.showLine && (
          <motion.line
            x1={lineX}
            x2={lineX}
            y1={lineStartY}
            y2={lineEndY}
            pathLength={backgroundLineGrowth}
            className="pictogram-line"
          ></motion.line>
        )}

        <g transform={`translate(${horizontalOffset}, ${verticalOffset})`}>
          {setup.layout.map((row, rowIdx) =>
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
                  rowIdx={rowIdx}
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
  rowIdx,
}: {
  idx: number
  scrollYProgress: MotionValue<number>
  config: pictogramConfig
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
  rowIdx: number
}) {
  const partialControl = config.animation.partialControl
  const totalControl = config.animation.totalControl
  const unit = config.animation.unit
  let Icon
  let shift = { x: 0, y: 0 }
  switch (config.mode) {
    case "people-norcal":
    case "people-socal":
      Icon = PeopleIcon
      break
    case "agriculture":
      Icon = FarmIcon
      shift = { x: 5, y: 5 }
      break
    case "economy":
      Icon = MoneyIcon
      shift = { x: 4, y: 0 }
      break
    default:
      Icon = PeopleIcon
  }

  const partialGrowth = useTransform(
    scrollYProgress,
    [
      partialControl[0] + unit * partialCount,
      partialControl[1] + unit * partialCount,
    ],
    ["inset(100% 0 0 0)", "inset(0 0 0 0)"],
  )
  const partialOpacity = useTransform(
    scrollYProgress,
    [
      partialControl[0] + unit * partialCount,
      partialControl[1] + unit * partialCount,
    ],
    [0, 1],
  )

  const totalGrowth = useTransform(
    scrollYProgress,
    [totalControl[0] + unit * totalCount, totalControl[1] + unit * totalCount],
    ["inset(100% 0 0 0)", "inset(0 0 0 0)"],
  )
  const totalOpacity = useTransform(
    scrollYProgress,
    [totalControl[0] + unit * totalCount, totalControl[1] + unit * totalCount],
    [0, 1],
  )

  return (
    <>
      <Icon
        idx={idx}
        scrollYProgress={scrollYProgress}
        clipPath={clipPath}
        transform={`translate(${x}, ${y}) ${config.scale}`}
        opacity={opacity}
        control={config.animation.generalControl}
      />
      {isFractional && !isLastIcon && (
        <>
          <Icon
            idx={idx}
            scrollYProgress={scrollYProgress}
            clipPath={`url(#clip-${percentage}-reversed)`}
            transform={`translate(${x}, ${y}) ${config.scale}`}
            opacity={1}
            control={config.animation.generalControl}
          />
          <motion.line
            x1={x + (config.iconSize * percentage) / 100 + shift.x}
            y1={y + config.iconSize + shift.y}
            x2={x + (config.iconSize * percentage) / 100 + shift.x}
            y2={y - config.iconSize * (rowIdx + 1)}
            style={{ clipPath: partialGrowth }}
            stroke="#f2f0ef"
            strokeWidth="2"
            strokeDasharray="2,2"
          />
          <motion.text
            x={x + (config.iconSize * percentage) / 100 + shift.x}
            y={y - config.iconSize * (rowIdx + 1)}
            dx="-0.5rem"
            style={{
              dominantBaseline: "middle",
              textAnchor: "end",
              opacity: partialOpacity,
              fill: "#f2f0ef",
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
            x1={x + (config.iconSize * percentage) / 100 + shift.x}
            y1={y + shift.y}
            x2={x + (config.iconSize * percentage) / 100 + shift.x}
            y2={y + config.iconSize + 30 + shift.y}
            style={{ clipPath: totalGrowth }}
            stroke="#f2f0ef"
            strokeWidth="2"
            strokeDasharray="2,2"
          />
          <motion.text
            x={x + (config.iconSize * percentage) / 100 + shift.x}
            y={y + config.iconSize + shift.y}
            dx={
              config.mode === "people-norcal" || config.mode === "agriculture"
                ? "-0.5rem"
                : "0.5rem"
            }
            style={{
              dominantBaseline: "middle",
              textAnchor:
                config.mode === "people-norcal" || config.mode === "agriculture"
                  ? "end"
                  : "start",
              fontWeight: "bold",
              opacity: totalOpacity,
              fill: "#f2f0ef",
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
  control,
  unit = 0.01,
  clipPath = "",
  fill = OffWhiteColor,
}: PictogramIconProps) {
  const [startEntrance, endEntrance] = control
  const growth = useTransform(
    scrollYProgress,
    [startEntrance + unit * idx, endEntrance + unit * idx],
    [0, 1],
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

function MoneyIcon({
  idx,
  scrollYProgress,
  transform,
  opacity,
  control,
  unit = 0.01,
  clipPath = "",
  fill = OffWhiteColor,
}: PictogramIconProps) {
  const [startEntrance, endEntrance] = control
  const growth = useTransform(
    scrollYProgress,
    [startEntrance + unit * idx, endEntrance + unit * idx],
    [0, 1],
  )

  return (
    <g transform={transform}>
      <motion.g style={{ opacity, scale: growth }} clipPath={clipPath}>
        <path
          d="M11 17h2v-1h1c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1h-3v-1h4V8h-2V7h-2v1h-1c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3v1H9v2h2zm9-13H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2m0 14H4V6h16z"
          fill={fill}
        />
      </motion.g>
    </g>
  )
}

function FarmIcon({
  idx,
  scrollYProgress,
  transform,
  opacity,
  control,
  unit = 0.01,
  clipPath = "",
  fill = OffWhiteColor,
}: PictogramIconProps) {
  const [startEntrance, endEntrance] = control
  const growth = useTransform(
    scrollYProgress,
    [startEntrance + unit * idx, endEntrance + unit * idx],
    [0, 1],
  )

  return (
    <g transform={transform}>
      <motion.g style={{ opacity, scale: growth }} clipPath={clipPath}>
        <path
          d="M12,3L3,8.2V21H9L11.9,18L15,21H21V8.2L12,3M7.9,20V14L10.9,17L7.9,20M8.9,13H14.9L11.9,16L8.9,13M15.9,20L12.9,17L15.9,14V20M15,11H8.8V9H15V11Z"
          //d="M14.5 8.5C16.914 8.5 18.885 10.401 18.995 12.788L19 13V17.698L24.405 13.696C24.733 13.453 25.172 13.437 25.514 13.642L25.625 13.719L31 18.02V14.5H33V19.62L35.625 21.719L34.375 23.281L33 22.18L32.999 26.5H35C35.513 26.5 35.936 26.886 35.993 27.383L36 27.5V35.5C36 36.013 35.614 36.436 35.117 36.493L35 36.5H8V34.5H15.545L17.295 32.5H8V30.5H19V30.552L20.795 28.5H8V26.5H10V13C10 10.515 12.015 8.5 14.5 8.5ZM26.795 28.5H23.453L18.203 34.5H21.545L26.795 28.5ZM34 30.16L30.203 34.5H34V30.16ZM32.795 28.5H29.453L24.203 34.5H27.545L32.795 28.5ZM31 20.58L24.976 15.761L19 20.187V26.5H21.999L22 22.5C22 21.987 22.386 21.564 22.883 21.507L23 21.5H27C27.513 21.5 27.936 21.886 27.993 22.383L28 22.5L27.999 26.5H30.999L31 20.58ZM14.5 10.5C13.175 10.5 12.09 11.532 12.005 12.836L12 13V26.5H17V13C17 11.619 15.881 10.5 14.5 10.5ZM26 23.5H24V26.5H26V23.5Z"
          fill={fill}
        />
      </motion.g>
    </g>
  )
}

export default Pictogram
