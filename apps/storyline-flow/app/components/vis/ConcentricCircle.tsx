"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion } from "@repo/motion"
import { debounce } from "lodash"
import "./concentric-circle.css"
import { PeopleIcon } from "../helpers/Icons"

type Entry = {
  year: number
  value: number
  annotation: string
}

type Dimensions = {
  width: number
  height: number
  maxRadius: number
  minRadius: number
}

const margin = { top: 20, right: 80, bottom: 30, left: 20 }
const data = {
  past: { year: 1940, value: 40000, annotation: "0.8M" },
  present: { year: 2024, value: 170000, annotation: "1.35M" },
  icon: <PeopleIcon />,
  title: "SoCal",
}
const shift: [number, number] = [-0.2, 0.3]
const growth = data.present.value / data.past.value

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

//TODO: add icons
function ConcentricCircle() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    maxRadius: 0,
    minRadius: 0,
  })
  const [center, setCenter] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleResize = debounce((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          const { width, height } = entry.contentRect
          const adjustedWidth = width - margin.left - margin.right
          const adjustedHeight = height - margin.top - margin.bottom
          const maxRadius = Math.min(adjustedWidth, adjustedHeight) / 2
          setDimensions({
            width,
            height,
            maxRadius: maxRadius,
            minRadius: 0.3 * maxRadius,
          })

          setCenter({
            x: width / 2 + shift[0] * width,
            y: height / 2 + shift[1] * height,
          })
        }
      }
    }, 300) // Debounce with a delay of 300ms

    const resizeObserver = new ResizeObserver((entries) =>
      handleResize(entries),
    )

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      resizeObserver.disconnect()
      handleResize.cancel()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      <svg width={dimensions.width} height={dimensions.height}>
        <CircleMask dimensions={dimensions} center={center} />
        <motion.circle
          className="cc-circle"
          cx={center.x}
          cy={center.y}
          r={dimensions.minRadius}
          fill="none"
          variants={RadiusSpringUpVariants}
          custom={{ radius: dimensions.minRadius, delay: 1.5 }}
          initial="hidden"
          animate="visible"
        />
        <motion.circle
          className="cc-circle"
          cx={center.x}
          cy={center.y}
          r={dimensions.minRadius * growth}
          mask="url(#circle-mask)"
          fillOpacity={0.1}
          fill="white"
          variants={RadiusSpringUpVariants}
          custom={{ radius: dimensions.minRadius * growth, delay: 3.5 }}
          initial="hidden"
          animate="visible"
        />
        <Label
          entity={data.past}
          x={center.x}
          y={center.y - dimensions.minRadius * (1 + 0.25)}
          delay={2.5}
        />
        <Label
          entity={data.present}
          x={center.x}
          y={center.y - dimensions.minRadius * (growth - 0.4)}
          delay={4.5}
        />
        <motion.text
          className="cc-circle-label"
          x={center.x}
          y={center.y}
          textAnchor="middle"
          fontSize="1.5rem"
          fontWeight="bold"
          variants={OpacityVariants}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          {data.title}
        </motion.text>
      </svg>
    </div>
  )
}

function CircleMask({
  center,
  dimensions,
}: {
  center: { x: number; y: number }
  dimensions: Dimensions
}) {
  return (
    <mask id="circle-mask">
      <rect width={dimensions.width} height={dimensions.height} fill="white" />
      <circle
        cx={center.x}
        cy={center.y}
        r={dimensions.minRadius}
        fill="black"
      />
    </mask>
  )
}

function Label({
  entity,
  x,
  y,
  delay = 0.5,
}: {
  entity: Entry
  x: number
  y: number
  delay?: number
}) {
  const textWidth = measureTextWidth(
    entity.annotation.toString(),
    "1.3rem",
    "bold",
  )

  return (
    <g transform={`translate(${x}, ${y})`}>
      <motion.text
        x={0}
        y={0}
        variants={OpacityVariants}
        initial="hidden"
        animate="visible"
        custom={delay}
        dx="0.25em"
        className="cc-circle-label"
        textAnchor="start"
        fontSize="1.2rem"
      >
        {entity.annotation}
      </motion.text>
      <motion.text
        x={0}
        y={0}
        variants={OpacityVariants}
        initial="hidden"
        animate="visible"
        custom={delay}
        dx="-1em"
        className="cc-circle-label"
        textAnchor="end"
        dominantBaseline="middle"
        fill="white"
        fontWeight="bold"
        fontSize="1.2rem"
      >
        {entity.year}
      </motion.text>
      <g transform={`translate(${textWidth * 1.15}, -17)`}>
        <PeopleIcon delay={delay} animation="visible" transform="scale(0.7)" />
      </g>
    </g>
  )
}

function measureTextWidth(
  text: string,
  fontSize: string = "1rem",
  fontWeight: string = "normal",
  fontFamily: string = "Arial",
): number {
  // Create a temporary SVG element
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  const textElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text",
  )

  // Set the text content and styles
  textElement.textContent = text
  textElement.setAttribute("font-size", fontSize)
  textElement.setAttribute("font-weight", fontWeight)
  textElement.setAttribute("font-family", fontFamily)

  // Append the text element to the SVG
  svg.appendChild(textElement)
  document.body.appendChild(svg)

  // Measure the text width
  const textWidth = textElement.getBBox().width

  // Clean up by removing the temporary SVG
  document.body.removeChild(svg)

  return textWidth
}

export default ConcentricCircle
