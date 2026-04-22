"use client"

import React from "react"
import { alpha, useTheme } from "@repo/ui/mui"

const AXES = 6
const CENTER_X = 205
const CENTER_Y = 155
const MAX_R = 92

function polarToCartesian(r: number, angle: number) {
  return {
    x: CENTER_X + r * Math.cos(angle),
    y: CENTER_Y + r * Math.sin(angle),
  }
}

function polygonPath(radii: number[]) {
  return (
    radii
      .map((r, index) => {
        const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AXES
        const point = polarToCartesian(r, angle)
        return `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`
      })
      .join(" ") + " Z"
  )
}

function Chip({
  x,
  y,
  width,
  label,
  active,
}: {
  x: number
  y: number
  width: number
  label: string
  active?: boolean
}) {
  const theme = useTheme()
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={24}
        rx={12}
        fill={
          active
            ? alpha(theme.palette.blue.bright, 0.14)
            : theme.palette.action.disabledBackground
        }
      />
      <text
        x={x + width / 2}
        y={y + 15}
        fontSize={10}
        fontWeight={600}
        textAnchor="middle"
        fill={theme.palette.text.primary}
      >
        {label}
      </text>
    </g>
  )
}

function RadarCore({
  showLibraryRange,
}: {
  showLibraryRange: boolean
}) {
  const theme = useTheme()
  const tiers = theme.palette.tiers
  const ringColors = [tiers.tier1, tiers.tier2, tiers.tier3, tiers.tier4]
  const scenarioA = [52, 62, 48, 73, 42, 56]
  const scenarioB = [66, 54, 64, 58, 68, 46]
  const libraryMin = [38, 46, 40, 50, 34, 44]
  const libraryMax = [82, 78, 76, 84, 72, 74]
  const axisLabels = ["Delta", "Storage", "Ag", "Urban", "Eco", "Fish"]

  return (
    <g>
      {ringColors
        .slice()
        .reverse()
        .map((color, index) => {
          const radii = Array(AXES).fill(MAX_R * ((4 - index) / 4))
          return (
            <path
              key={index}
              d={polygonPath(radii)}
              fill={color}
              fillOpacity={0.08}
              stroke={alpha(color, 0.42)}
              strokeWidth={1}
            />
          )
        })}

      {Array.from({ length: AXES }).map((_, index) => {
        const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AXES
        const point = polarToCartesian(MAX_R, angle)
        return (
          <line
            key={index}
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={point.x}
            y2={point.y}
            stroke={theme.palette.divider}
            strokeWidth={1}
          />
        )
      })}

      {showLibraryRange ? (
        <path
          d={`${polygonPath(libraryMax)} ${polygonPath(libraryMin)}`}
          fill={theme.palette.grey[700]}
          fillOpacity={0.12}
          fillRule="evenodd"
        />
      ) : null}

      <path
        d={polygonPath(scenarioA)}
        fill={theme.palette.blue.bright}
        fillOpacity={0.22}
        stroke={theme.palette.blue.bright}
        strokeWidth={2}
      />
      <path
        d={polygonPath(scenarioB)}
        fill={theme.palette.nature.forest}
        fillOpacity={0.18}
        stroke={theme.palette.nature.forest}
        strokeWidth={2}
      />

      {scenarioA.map((radius, index) => {
        const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AXES
        const point = polarToCartesian(radius, angle)
        return (
          <circle
            key={`a-${index}`}
            cx={point.x}
            cy={point.y}
            r={3}
            fill={theme.palette.blue.bright}
          />
        )
      })}
      {scenarioB.map((radius, index) => {
        const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AXES
        const point = polarToCartesian(radius, angle)
        return (
          <circle
            key={`b-${index}`}
            cx={point.x}
            cy={point.y}
            r={3}
            fill={theme.palette.nature.forest}
          />
        )
      })}

      {["1", "2", "3", "4"].map((label, index) => (
        <text
          key={label}
          x={CENTER_X + 4}
          y={CENTER_Y - MAX_R * ((index + 1) / 4) + 4}
          fontSize={9}
          fill={theme.palette.grey[700]}
        >
          {label}
        </text>
      ))}

      {axisLabels.map((label, index) => {
        const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AXES
        const point = polarToCartesian(MAX_R + 16, angle)
        return (
          <text
            key={label}
            x={point.x}
            y={point.y}
            fontSize={10}
            fontWeight={600}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={theme.palette.text.primary}
          >
            {label}
          </text>
        )
      })}
    </g>
  )
}

export function RadarHeroGraphic({
  showLibraryRange,
}: {
  showLibraryRange: boolean
}) {
  const theme = useTheme()

  return (
    <svg
      viewBox="0 0 520 320"
      width="100%"
      height="100%"
      role="img"
      aria-label="Radar chart with selected scenarios and optional library range"
    >
      <rect
        x={12}
        y={12}
        width={496}
        height={296}
        rx={18}
        fill={theme.palette.common.white}
        fillOpacity={0.98}
      />
      <rect
        x={12}
        y={12}
        width={496}
        height={36}
        rx={18}
        fill={theme.palette.grey[100]}
      />

      <Chip x={74} y={18} width={102} label="historical" active />
      <Chip x={184} y={18} width={80} label="cc50" />
      <Chip x={272} y={18} width={80} label="cc95" />
      <Chip x={360} y={18} width={126} label="show library range" active={showLibraryRange} />

      <RadarCore showLibraryRange={showLibraryRange} />

      <rect
        x={390}
        y={84}
        width={96}
        height={74}
        rx={10}
        fill={theme.palette.grey[50]}
      />
      <rect
        x={404}
        y={100}
        width={12}
        height={12}
        fill={theme.palette.blue.bright}
        fillOpacity={0.22}
        stroke={theme.palette.blue.bright}
        strokeWidth={1.5}
      />
      <text x={424} y={110} fontSize={10} fill={theme.palette.text.primary}>
        Delta pulse
      </text>
      <rect
        x={404}
        y={124}
        width={12}
        height={12}
        fill={theme.palette.nature.forest}
        fillOpacity={0.18}
        stroke={theme.palette.nature.forest}
        strokeWidth={1.5}
      />
      <text x={424} y={134} fontSize={10} fill={theme.palette.text.primary}>
        Flow carveout
      </text>
      <rect
        x={404}
        y={146}
        width={12}
        height={12}
        fill={theme.palette.grey[700]}
        fillOpacity={showLibraryRange ? 0.16 : 0.04}
      />
      <text x={424} y={156} fontSize={10} fill={theme.palette.text.primary}>
        Library range
      </text>
    </svg>
  )
}

export function RadarAxisSliceGraphic() {
  const theme = useTheme()

  return (
    <svg
      viewBox="0 0 560 300"
      width="100%"
      height="100%"
      role="img"
      aria-label="Radar chart with axis detail card and climate controls"
    >
      <rect
        x={14}
        y={14}
        width={532}
        height={272}
        rx={18}
        fill={theme.palette.common.white}
      />
      <rect
        x={14}
        y={14}
        width={532}
        height={40}
        rx={18}
        fill={theme.palette.grey[100]}
      />
      <Chip x={34} y={22} width={122} label="choose outcome axes" active />
      <Chip x={166} y={22} width={88} label="historical" active />
      <Chip x={262} y={22} width={68} label="cc50" />
      <Chip x={338} y={22} width={68} label="cc95" />

      <g opacity={0.46} transform="translate(-24, 0) scale(0.84)">
        <RadarCore showLibraryRange />
      </g>

      <rect
        x={330}
        y={84}
        width={190}
        height={162}
        rx={14}
        fill={theme.palette.grey[50]}
        stroke={theme.palette.divider}
      />
      <text
        x={348}
        y={108}
        fontSize={11}
        fontWeight={700}
        fill={theme.palette.grey[700]}
      >
        ENVIRONMENTAL OUTFLOWS
      </text>
      <text
        x={348}
        y={126}
        fontSize={11}
        fill={theme.palette.grey[700]}
      >
        scenario slice
      </text>

      {[0, 1, 2].map((index) => {
        const y = 150 + index * 28
        const widths = [112, 92, 70]
        const fills = [
          theme.palette.blue.bright,
          theme.palette.nature.forest,
          theme.palette.grey[300],
        ]
        const labels = ["Delta pulse", "Flow carveout", "Current ops"]
        return (
          <g key={labels[index]}>
            <text
              x={348}
              y={y + 10}
              fontSize={10}
              fill={theme.palette.text.primary}
            >
              {labels[index]}
            </text>
            <rect
              x={434}
              y={y}
              width={widths[index]}
              height={12}
              rx={6}
              fill={fills[index]}
              fillOpacity={index === 2 ? 1 : 0.9}
            />
          </g>
        )
      })}

      <rect
        x={178}
        y={218}
        width={122}
        height={28}
        rx={14}
        fill={alpha(theme.palette.blue.bright, 0.14)}
        stroke={alpha(theme.palette.blue.bright, 0.18)}
      />
      <text
        x={194}
        y={236}
        fontSize={10}
        fontWeight={600}
        fill={theme.palette.text.primary}
      >
        Environmental outflows
      </text>
      <circle
        cx={286}
        cy={232}
        r={8}
        fill="none"
        stroke={theme.palette.blue.bright}
        strokeWidth={1.25}
      />
      <text
        x={286}
        y={236}
        fontSize={10}
        textAnchor="middle"
        fontWeight={700}
        fill={theme.palette.blue.bright}
      >
        i
      </text>
    </svg>
  )
}
