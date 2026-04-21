"use client"

import React from "react"
import { alpha, useTheme } from "@repo/ui/mui"

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

function HeatCell({
  x,
  y,
  fill,
  label,
  size = 24,
}: {
  x: number
  y: number
  fill: string
  label?: string
  size?: number
}) {
  return (
    <g>
      <rect x={x} y={y} width={size} height={size} rx={5} fill={fill} />
      {label ? (
        <text
          x={x + size / 2}
          y={y + size / 2 + 4}
          fontSize={11}
          fontWeight={600}
          textAnchor="middle"
          fill="#ffffff"
        >
          {label}
        </text>
      ) : null}
    </g>
  )
}

function HeatmapTile({
  x,
  y,
  title,
  emphasis = 1,
}: {
  x: number
  y: number
  title: string
  emphasis?: number
}) {
  const theme = useTheme()
  const tiers = theme.palette.tiers
  const fills = [
    [tiers.tier2, tiers.tier2, tiers.tier3],
    [tiers.tier1, tiers.tier2, tiers.tier2],
    [tiers.tier2, tiers.tier3, tiers.tier4],
    [tiers.tier2, tiers.tier2, tiers.tier4],
  ]

  return (
    <g opacity={emphasis}>
      <rect
        x={x}
        y={y}
        width={140}
        height={112}
        rx={12}
        fill={theme.palette.common.white}
        stroke={alpha(theme.palette.blue.bright, 0.18)}
      />
      <text
        x={x + 14}
        y={y + 18}
        fontSize={10}
        fontWeight={700}
        fill={theme.palette.grey[700]}
      >
        {title}
      </text>
      {["hist", "cc50", "cc95"].map((label, index) => (
        <text
          key={label}
          x={x + 38 + index * 32}
          y={y + 34}
          fontSize={8}
          fontWeight={700}
          textAnchor="middle"
          fill={theme.palette.grey[700]}
        >
          {label}
        </text>
      ))}
      {fills.map((row, rowIndex) =>
        row.map((fill, columnIndex) => (
          <HeatCell
            key={`${rowIndex}-${columnIndex}`}
            x={x + 32 + columnIndex * 32}
            y={y + 42 + rowIndex * 16}
            size={22}
            fill={fill}
            label={rowIndex === 0 ? ["2.1", "2.4", "2.8"][columnIndex] : undefined}
          />
        )),
      )}
      {["Storage", "Eco", "Delta", "Fish"].map((label, rowIndex) => (
        <text
          key={label}
          x={x + 8}
          y={y + 58 + rowIndex * 16}
          fontSize={8}
          fill={theme.palette.grey[700]}
        >
          {label}
        </text>
      ))}
    </g>
  )
}

export function ResilienceHeroGraphic({
  showAllScenarios,
}: {
  showAllScenarios: boolean
}) {
  const theme = useTheme()

  return (
    <svg
      viewBox="0 0 560 320"
      width="100%"
      height="100%"
      role="img"
      aria-label="Resilience heatmap view with scenario tiles and climate columns"
    >
      <rect
        x={14}
        y={14}
        width={532}
        height={292}
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
      <Chip x={34} y={22} width={80} label="Overview" active />
      <Chip x={122} y={22} width={84} label="Mean tier" active />
      <Chip x={400} y={22} width={108} label="all scenarios" active={showAllScenarios} />

      <rect x={30} y={72} width={112} height={212} rx={14} fill={theme.palette.grey[50]} />
      <text x={46} y={92} fontSize={10} fontWeight={700} fill={theme.palette.grey[700]}>
        SCENARIOS
      </text>
      {[
        { y: 106, label: "Current ops", active: true },
        { y: 138, label: "Delta pulse", active: showAllScenarios },
        { y: 170, label: "Flow carveout", active: showAllScenarios },
        { y: 202, label: "Storage swap", active: showAllScenarios },
      ].map((item) => (
        <g key={item.label} opacity={item.active ? 1 : 0.32}>
          <rect
            x={42}
            y={item.y}
            width={88}
            height={24}
            rx={12}
            fill={
              item.active
                ? alpha(theme.palette.blue.bright, 0.12)
                : theme.palette.common.white
            }
          />
          <circle
            cx={54}
            cy={item.y + 12}
            r={5}
            fill={item.active ? theme.palette.blue.bright : theme.palette.grey[300]}
          />
          <text
            x={64}
            y={item.y + 15}
            fontSize={9}
            fontWeight={item.active ? 600 : 500}
            fill={theme.palette.text.primary}
          >
            {item.label}
          </text>
        </g>
      ))}

      <HeatmapTile x={166} y={78} title="Current ops" emphasis={1} />
      <HeatmapTile x={318} y={78} title="Delta pulse" emphasis={showAllScenarios ? 1 : 0.22} />
      <HeatmapTile x={166} y={202} title="Flow carveout" emphasis={showAllScenarios ? 1 : 0.22} />
      <HeatmapTile x={318} y={202} title="Storage swap" emphasis={showAllScenarios ? 1 : 0.22} />
    </svg>
  )
}

export function EncodingModesGraphic() {
  const theme = useTheme()
  const tiers = theme.palette.tiers
  const d = theme.palette.tierDiverging
  const density = theme.palette.tierDensity

  return (
    <svg
      viewBox="0 0 560 280"
      width="100%"
      height="100%"
      role="img"
      aria-label="Four resilience encoding modes"
    >
      <rect
        x={14}
        y={14}
        width={532}
        height={252}
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
      <Chip x={34} y={22} width={76} label="summary" active />
      <Chip x={118} y={22} width={64} label="delta" />
      <Chip x={190} y={22} width={76} label="density" />
      <Chip x={274} y={22} width={92} label="distribution" />

      {[
        { x: 34, title: "Summary", subtitle: "mean tier", draw: "summary" },
        { x: 166, title: "Climate shift", subtitle: "vs reference", draw: "delta" },
        { x: 298, title: "Risk / opportunity", subtitle: "density", draw: "density" },
        { x: 430, title: "Distribution", subtitle: "by scenario / location", draw: "distribution" },
      ].map((card) => (
        <g key={card.title}>
          <rect
            x={card.x}
            y={78}
            width={100}
            height={144}
            rx={14}
            fill={theme.palette.grey[50]}
          />
          <text
            x={card.x + 50}
            y={102}
            fontSize={10}
            fontWeight={700}
            textAnchor="middle"
            fill={theme.palette.text.primary}
          >
            {card.title}
          </text>
          <text
            x={card.x + 50}
            y={118}
            fontSize={9}
            textAnchor="middle"
            fill={theme.palette.grey[700]}
          >
            {card.subtitle}
          </text>

          {card.draw === "summary" ? (
            <HeatCell x={card.x + 24} y={136} size={52} fill={tiers.tier2} label="2.3" />
          ) : null}

          {card.draw === "delta" ? (
            <>
              {[d.negStrong, d.negWeak, d.zero, d.posWeak, d.posStrong].map((fill, index) => (
                <rect
                  key={index}
                  x={card.x + 12 + index * 15}
                  y={150}
                  width={13}
                  height={32}
                  rx={4}
                  fill={fill}
                />
              ))}
              <text
                x={card.x + 50}
                y={202}
                fontSize={9}
                textAnchor="middle"
                fill={theme.palette.grey[700]}
              >
                better to worse
              </text>
            </>
          ) : null}

          {card.draw === "density" ? (
            <>
              <rect
                x={card.x + 22}
                y={142}
                width={56}
                height={24}
                rx={6}
                fill={density.riskMax}
              />
              <rect
                x={card.x + 22}
                y={170}
                width={56}
                height={24}
                rx={6}
                fill={density.oppMax}
              />
              <text
                x={card.x + 50}
                y={208}
                fontSize={9}
                textAnchor="middle"
                fill={theme.palette.grey[700]}
              >
                stress above, upside below
              </text>
            </>
          ) : null}

          {card.draw === "distribution" ? (
            <>
              <rect
                x={card.x + 18}
                y={136}
                width={64}
                height={64}
                rx={8}
                fill={theme.palette.common.white}
              />
              {[
                tiers.tier1,
                tiers.tier1,
                tiers.tier2,
                tiers.tier2,
                tiers.tier2,
                tiers.tier3,
                tiers.tier3,
                tiers.tier4,
                tiers.tier4,
              ].map((fill, index) => (
                <rect
                  key={index}
                  x={card.x + 24 + (index % 3) * 17}
                  y={142 + Math.floor(index / 3) * 17}
                  width={13}
                  height={13}
                  rx={3}
                  fill={fill}
                />
              ))}
            </>
          ) : null}
        </g>
      ))}
    </svg>
  )
}

export function QuadrantStageGraphic() {
  const theme = useTheme()
  const dots = [
    { x: 170, y: 112 },
    { x: 208, y: 136 },
    { x: 274, y: 108 },
    { x: 362, y: 98 },
    { x: 192, y: 208 },
    { x: 248, y: 190 },
    { x: 344, y: 202 },
    { x: 404, y: 224 },
  ]

  return (
    <svg
      viewBox="0 0 560 300"
      width="100%"
      height="100%"
      role="img"
      aria-label="Quadrant view with climate sensitivity and operational leverage axes"
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
      <Chip x={34} y={22} width={82} label="quadrant" active />
      <Chip x={124} y={22} width={118} label="one dot per outcome" active />

      <rect
        x={108}
        y={74}
        width={350}
        height={178}
        rx={16}
        fill={theme.palette.grey[50]}
        stroke={theme.palette.divider}
      />
      <line
        x1={283}
        y1={74}
        x2={283}
        y2={252}
        stroke={theme.palette.grey[400]}
        strokeDasharray="5 4"
      />
      <line
        x1={108}
        y1={163}
        x2={458}
        y2={163}
        stroke={theme.palette.grey[400]}
        strokeDasharray="5 4"
      />

      {dots.map((dot, index) => (
        <circle
          key={index}
          cx={dot.x}
          cy={dot.y}
          r={5}
          fill={theme.palette.blue.bright}
          opacity={0.78}
        />
      ))}

      <text x={181} y={108} fontSize={11} fontWeight={600} fill={theme.palette.text.primary}>
        Robust
      </text>
      <text x={340} y={108} fontSize={11} fontWeight={600} fill={theme.palette.text.primary}>
        Climate-limited
      </text>
      <text x={150} y={218} fontSize={11} fontWeight={600} fill={theme.palette.text.primary}>
        Operationally tractable
      </text>
      <text x={338} y={218} fontSize={11} fontWeight={600} fill={theme.palette.text.primary}>
        High-stakes
      </text>

      <text
        x={283}
        y={276}
        fontSize={11}
        fontWeight={600}
        textAnchor="middle"
        fill={theme.palette.text.primary}
      >
        climate sensitivity →
      </text>
      <text
        x={48}
        y={168}
        fontSize={11}
        fontWeight={600}
        textAnchor="middle"
        transform="rotate(-90 48 168)"
        fill={theme.palette.text.primary}
      >
        operational leverage →
      </text>
    </svg>
  )
}
