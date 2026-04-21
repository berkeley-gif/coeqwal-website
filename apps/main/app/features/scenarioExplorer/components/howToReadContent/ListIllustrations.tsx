"use client"

import React from "react"
import { alpha, useTheme } from "@repo/ui/mui"

function SvgLabel({
  x,
  y,
  children,
  muted,
  size = 11,
  weight = 500,
  anchor = "start",
}: {
  x: number
  y: number
  children: React.ReactNode
  muted?: boolean
  size?: number
  weight?: number
  anchor?: "start" | "middle" | "end"
}) {
  const theme = useTheme()
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontWeight={weight}
      textAnchor={anchor}
      fill={muted ? theme.palette.grey[700] : theme.palette.text.primary}
    >
      {children}
    </text>
  )
}

function Cell({
  x,
  y,
  width,
  height,
  fill,
  label,
  opacity = 1,
}: {
  x: number
  y: number
  width: number
  height: number
  fill: string
  label?: string
  opacity?: number
}) {
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={width} height={height} rx={5} fill={fill} />
      {label ? (
        <text
          x={x + width / 2}
          y={y + height / 2 + 4}
          fontSize={12}
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
      <SvgLabel
        x={x + width / 2}
        y={y + 15}
        size={10}
        weight={600}
        anchor="middle"
      >
        {label}
      </SvgLabel>
    </g>
  )
}

function CheckDot({
  cx,
  cy,
  active,
}: {
  cx: number
  cy: number
  active?: boolean
}) {
  const theme = useTheme()
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={active ? theme.palette.blue.bright : theme.palette.common.white}
        stroke={active ? theme.palette.blue.bright : theme.palette.grey[300]}
        strokeWidth={1.2}
      />
      {active ? (
        <path
          d={`M ${cx - 2.6} ${cy} L ${cx - 0.4} ${cy + 2.2} L ${cx + 3.4} ${cy - 2.4}`}
          stroke="#ffffff"
          strokeWidth={1.4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </g>
  )
}

function OpsDots({ x, y }: { x: number; y: number }) {
  const theme = useTheme()
  return (
    <>
      {[0, 1, 2].map((index) => (
        <circle
          key={index}
          cx={x + index * 12}
          cy={y}
          r={4}
          fill={index === 1 ? theme.palette.blue.bright : theme.palette.grey[300]}
        />
      ))}
    </>
  )
}

function PinIcon({ x, y, active }: { x: number; y: number; active?: boolean }) {
  const theme = useTheme()
  const color = active ? theme.palette.blue.bright : theme.palette.grey[400]
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx={6} cy={6} r={5} fill={alpha(color, active ? 0.16 : 0.12)} />
      <path
        d="M6 2.5 L8.9 5.4 L7.2 7.1 L8.2 10.3 L6 8.7 L3.8 10.3 L4.8 7.1 L3.1 5.4 Z"
        fill={color}
      />
    </g>
  )
}

function ShareIcon({ x, y, active }: { x: number; y: number; active?: boolean }) {
  const theme = useTheme()
  const color = active ? theme.palette.blue.bright : theme.palette.grey[400]
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx={4} cy={8} r={2.1} fill={color} />
      <circle cx={10.5} cy={4} r={2.1} fill={color} />
      <circle cx={10.5} cy={12} r={2.1} fill={color} />
      <path
        d="M5.8 7 L8.7 5.1 M5.8 9 L8.7 10.9"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </g>
  )
}

function InfoDot({ x, y }: { x: number; y: number }) {
  const theme = useTheme()
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx={6} cy={6} r={5.5} fill={alpha(theme.palette.blue.bright, 0.12)} />
      <text
        x={6}
        y={8}
        fontSize={8}
        fontWeight={700}
        textAnchor="middle"
        fill={theme.palette.blue.bright}
      >
        i
      </text>
    </g>
  )
}

function SortGlyph({
  x,
  y,
  active,
  direction = "desc",
}: {
  x: number
  y: number
  active?: boolean
  direction?: "asc" | "desc"
}) {
  const theme = useTheme()
  const color = active ? theme.palette.blue.bright : theme.palette.grey[400]
  const path =
    direction === "desc"
      ? "M 2 4 L 6 9 L 10 4"
      : "M 2 8 L 6 3 L 10 8"

  return (
    <g transform={`translate(${x}, ${y})`}>
      <path
        d={path}
        stroke={color}
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  )
}

function BarGlyph({
  x,
  y,
  values,
  fills,
}: {
  x: number
  y: number
  values: number[]
  fills: string[]
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {values.map((value, index) => {
        const width = 12
        const gap = 6
        const height = Math.max(10, value)
        return (
          <rect
            key={index}
            x={index * (width + gap)}
            y={44 - height}
            width={width}
            height={height}
            rx={4}
            fill={fills[index]!}
          />
        )
      })}
    </g>
  )
}

function DistributionGrid({
  x,
  y,
  fills,
}: {
  x: number
  y: number
  fills: string[]
}) {
  const size = 8
  const gap = 1.5
  return (
    <g>
      {fills.map((fill, index) => (
        <rect
          key={index}
          x={x + (index % 3) * (size + gap)}
          y={y + Math.floor(index / 3) * (size + gap)}
          width={size}
          height={size}
          rx={2}
          fill={fill}
        />
      ))}
    </g>
  )
}

function Frame({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const theme = useTheme()
  return (
    <g>
      <rect
        x={18}
        y={18}
        width={524}
        height={244}
        rx={16}
        fill={theme.palette.common.white}
      />
      <rect
        x={18}
        y={18}
        width={524}
        height={36}
        rx={16}
        fill={theme.palette.grey[100]}
      />
      <SvgLabel x={38} y={41} size={10} weight={700} muted>
        {title}
      </SvgLabel>
      {children}
    </g>
  )
}

export function ListHeroGraphic() {
  const theme = useTheme()
  const tiers = theme.palette.tiers
  const rowY = [92, 130, 168, 206]
  const rowHeight = 28
  const outcomeXs = [334, 378, 422, 466]
  const rowCells = [
    [tiers.tier2, tiers.tier2, tiers.tier3, tiers.tier2],
    [tiers.tier1, tiers.tier2, tiers.tier2, tiers.tier3],
    [tiers.tier2, tiers.tier3, tiers.tier3, tiers.tier4],
    [tiers.tier2, tiers.tier2, tiers.tier4, tiers.tier4],
  ]

  return (
    <svg
      viewBox="0 0 560 280"
      width="100%"
      height="100%"
      role="img"
      aria-label="List view overview with toolbar, rows, and outcome columns"
    >
      <Frame title="LIST VIEW">
        <Chip x={168} y={24} width={98} label="How to read" />
        <Chip x={274} y={24} width={74} label="Average" active />
        <Chip x={354} y={24} width={58} label="Bar" />
        <Chip x={418} y={24} width={96} label="Distribution" />

        <rect x={34} y={66} width={116} height={176} rx={12} fill={theme.palette.grey[50]} />
        <SvgLabel x={48} y={86} size={10} weight={700} muted>
          SCENARIO LIBRARY
        </SvgLabel>
        <SvgLabel x={166} y={86} size={10} weight={700} muted>
          ACTIVE TABLE
        </SvgLabel>
        <SvgLabel x={338} y={86} size={10} weight={700} muted>
          OUTCOMES
        </SvgLabel>

        <SvgLabel x={48} y={112} size={10} weight={700} muted>
          FLOWS
        </SvgLabel>
        <SvgLabel x={48} y={154} size={10} weight={700} muted>
          STORAGE
        </SvgLabel>
        <SvgLabel x={48} y={196} size={10} weight={700} muted>
          DELTA
        </SvgLabel>

        {rowY.map((y, rowIndex) => (
          <g key={y}>
            <rect
              x={158}
              y={y}
              width={348}
              height={rowHeight}
              rx={8}
              fill={theme.palette.common.white}
              stroke={theme.palette.divider}
            />
            <CheckDot cx={174} cy={y + rowHeight / 2} active={rowIndex === 1 || rowIndex === 2} />
            <SvgLabel x={190} y={y + 18} size={11} weight={600}>
              {["Current ops", "Delta pulse", "Flow carveout", "Storage swap"][rowIndex]}
            </SvgLabel>
            <PinIcon x={292} y={y + 6} active={rowIndex === 1} />
            <ShareIcon x={312} y={y + 6} active={rowIndex === 2} />
            {outcomeXs.map((x, colIndex) => (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                x={x}
                y={y + 3}
                width={34}
                height={22}
                fill={rowCells[rowIndex]![colIndex]!}
                label={["2.1", "2.4", "2.8", "3.1"][colIndex]}
              />
            ))}
          </g>
        ))}
      </Frame>
    </svg>
  )
}

export function ListToolbarGraphic() {
  const theme = useTheme()
  return (
    <svg
      viewBox="0 0 560 280"
      width="100%"
      height="100%"
      role="img"
      aria-label="Scenario library controls with search, chips, theme organization, and row actions"
    >
      <Frame title="START WITH THE SCENARIO LIBRARY">
        <rect
          x={36}
          y={70}
          width={160}
          height={34}
          rx={17}
          fill={theme.palette.grey[50]}
          stroke={theme.palette.divider}
        />
        <SvgLabel x={56} y={91} size={10} muted>
          Search by scenario name
        </SvgLabel>
        <Chip x={208} y={75} width={84} label="definitions" active />
        <Chip x={298} y={75} width={74} label="baselines" />
        <Chip x={378} y={75} width={92} label="key ops" />
        <Chip x={36} y={112} width={92} label="selected only" />
        <Chip x={134} y={112} width={108} label="group by theme" active />

        <rect x={36} y={146} width={492} height={86} rx={14} fill={theme.palette.grey[50]} />
        <SvgLabel x={52} y={166} size={10} weight={700} muted>
          BASELINE
        </SvgLabel>
        <SvgLabel x={52} y={198} size={10} weight={700} muted>
          FLOWS
        </SvgLabel>
        <SvgLabel x={52} y={230} size={10} weight={700} muted>
          STORAGE
        </SvgLabel>
        {[
          { y: 154, label: "Current ops", pin: true, share: false, tint: false },
          { y: 186, label: "Delta pulse", pin: true, share: true, tint: true },
          { y: 218, label: "Storage swap", pin: false, share: false, tint: false },
        ].map((row) => (
          <g key={row.label}>
            <rect
              x={120}
              y={row.y}
              width={408}
              height={24}
              rx={12}
              fill={row.tint ? alpha(theme.palette.blue.bright, 0.08) : theme.palette.common.white}
            />
            <SvgLabel x={140} y={row.y + 16} size={11} weight={row.tint ? 600 : 500}>
              {row.label}
            </SvgLabel>
            <PinIcon x={422} y={row.y + 4} active={row.pin} />
            <ShareIcon x={444} y={row.y + 4} active={row.share} />
            <SvgLabel x={510} y={row.y + 16} size={10} muted anchor="end">
              staged by chips or actions
            </SvgLabel>
          </g>
        ))}
      </Frame>
    </svg>
  )
}

export function ListRowAnatomyGraphic() {
  const theme = useTheme()
  const tiers = theme.palette.tiers
  return (
    <svg
      viewBox="0 0 560 250"
      width="100%"
      height="100%"
      role="img"
      aria-label="One row in the list view with scenario name, operations, and outcomes"
    >
      <Frame title="UNDERSTAND ONE ROW">
        <SvgLabel x={42} y={82} size={10} weight={700} muted>
          ONE SELECTED SCENARIO
        </SvgLabel>
        <SvgLabel x={326} y={82} size={10} weight={700} muted>
          OUTCOMES
        </SvgLabel>
        <rect
          x={34}
          y={98}
          width={492}
          height={54}
          rx={12}
          fill={alpha(theme.palette.blue.bright, 0.06)}
          stroke={alpha(theme.palette.blue.bright, 0.18)}
        />
        <CheckDot cx={52} cy={125} active />
        <SvgLabel x={68} y={118} size={12} weight={600}>
          Delta pulse
        </SvgLabel>
        <SvgLabel x={68} y={134} size={10} muted>
          selected scenario
        </SvgLabel>
        <OpsDots x={230} y={125} />
        {[
          { x: 324, fill: tiers.tier2, label: "2.1" },
          { x: 372, fill: tiers.tier2, label: "2.3" },
          { x: 420, fill: tiers.tier3, label: "2.8" },
          { x: 468, fill: tiers.tier4, label: "3.4" },
        ].map((cell) => (
          <Cell
            key={cell.x}
            x={cell.x}
            y={111}
            width={38}
            height={28}
            fill={cell.fill}
            label={cell.label}
          />
        ))}
      </Frame>
    </svg>
  )
}

export function SortedOutcomeGraphic() {
  const theme = useTheme()
  const tiers = theme.palette.tiers
  const values = ["1.8", "2.0", "2.6", "3.1"]
  return (
    <svg
      viewBox="0 0 560 280"
      width="100%"
      height="100%"
      role="img"
      aria-label="Outcome headers with info and sort controls ranking scenarios by average"
    >
      <Frame title="NOW LOOK AT THE OUTCOMES">
        <Chip x={36} y={72} width={76} label="Average" active />
        <SvgLabel x={40} y={118} size={10} weight={700} muted>
          INFO REFRESHES THE METRIC
        </SvgLabel>
        <SvgLabel x={286} y={118} size={10} weight={700} muted>
          SORT RANKS BY AVERAGE
        </SvgLabel>

        {[
          { x: 38, label: "Community", active: false },
          { x: 150, label: "Ag revenue", active: false },
          { x: 262, label: "Reservoir", active: true },
          { x: 374, label: "Groundwater", active: false },
        ].map((header) => (
          <g key={header.label}>
            <rect
              x={header.x}
              y={130}
              width={98}
              height={34}
              rx={10}
              fill={
                header.active
                  ? alpha(theme.palette.blue.bright, 0.08)
                  : theme.palette.grey[50]
              }
              stroke={
                header.active
                  ? alpha(theme.palette.blue.bright, 0.18)
                  : theme.palette.divider
              }
            />
            <SvgLabel x={header.x + 14} y={149} size={10} weight={600}>
              {header.label}
            </SvgLabel>
            <InfoDot x={header.x + 60} y={138} />
            <SortGlyph
              x={header.x + 76}
              y={141}
              active={header.active}
              direction="desc"
            />
          </g>
        ))}

        {[
          { y: 114, name: "Delta pulse", fill: tiers.tier1 },
          { y: 150, name: "Current ops", fill: tiers.tier2 },
          { y: 186, name: "Flow carveout", fill: tiers.tier3 },
          { y: 222, name: "Storage swap", fill: tiers.tier4 },
        ].map((row, index) => (
          <g key={row.name}>
            <rect
              x={34}
              y={row.y + 58}
              width={492}
              height={28}
              rx={8}
              fill={
                index === 0
                  ? alpha(theme.palette.blue.bright, 0.08)
                  : theme.palette.common.white
              }
              stroke={theme.palette.divider}
            />
            <SvgLabel x={52} y={row.y + 76} size={11} weight={600}>
              {row.name}
            </SvgLabel>
            <Cell
              x={304}
              y={row.y + 61}
              width={38}
              height={22}
              fill={row.fill}
              label={values[index]}
            />
            <Cell
              x={392}
              y={row.y + 61}
              width={34}
              height={22}
              fill={tiers.tier2}
              opacity={0.3}
            />
            <Cell
              x={440}
              y={row.y + 61}
              width={34}
              height={22}
              fill={tiers.tier3}
              opacity={0.3}
            />
          </g>
        ))}
      </Frame>
    </svg>
  )
}

export function ShortlistFocusGraphic({
  showOnlyChosen,
}: {
  showOnlyChosen: boolean
}) {
  const theme = useTheme()
  const tiers = theme.palette.tiers
  const rows = [
    { name: "Current ops", chosen: false, y: 98 },
    { name: "Delta pulse", chosen: true, y: 132 },
    { name: "Flow carveout", chosen: true, y: 166 },
    { name: "Storage swap", chosen: false, y: 200 },
  ]

  return (
    <svg
      viewBox="0 0 560 280"
      width="100%"
      height="100%"
      role="img"
      aria-label="Selected scenarios with show only chosen filtering"
    >
      <Frame title="BUILD A SHORTLIST">
        <Chip x={394} y={24} width={132} label="show only chosen" active={showOnlyChosen} />
        <Chip x={286} y={24} width={100} label="baselines" />
        {rows.map((row) => {
          const hidden = showOnlyChosen && !row.chosen
          return (
            <g key={row.name} opacity={hidden ? 0.18 : 1}>
              <rect
                x={34}
                y={row.y}
                width={492}
                height={26}
                rx={8}
                fill={row.chosen ? alpha(theme.palette.blue.bright, 0.08) : theme.palette.common.white}
                stroke={row.chosen ? alpha(theme.palette.blue.bright, 0.18) : theme.palette.divider}
              />
              <CheckDot cx={52} cy={row.y + 13} active={row.chosen} />
              <SvgLabel x={68} y={row.y + 17} size={11} weight={row.chosen ? 600 : 500}>
                {row.name}
              </SvgLabel>
              <Cell
                x={418}
                y={row.y + 2}
                width={34}
                height={22}
                fill={row.chosen ? tiers.tier2 : tiers.tier3}
              />
              <Cell
                x={462}
                y={row.y + 2}
                width={34}
                height={22}
                fill={row.chosen ? tiers.tier2 : tiers.tier4}
              />
            </g>
          )
        })}
      </Frame>
    </svg>
  )
}

export function BaselineComparisonGraphic({
  showAlternatives,
}: {
  showAlternatives: boolean
}) {
  const theme = useTheme()
  const tiers = theme.palette.tiers
  const rows = [
    {
      label: "Current ops",
      sub: "primary baseline",
      tiers: [tiers.tier2, tiers.tier2, tiers.tier3, tiers.tier2, tiers.tier3],
      active: true,
    },
    {
      label: "Delta outflows",
      sub: "alternative baseline",
      tiers: [tiers.tier2, tiers.tier3, tiers.tier3, tiers.tier3, tiers.tier3],
      active: showAlternatives,
    },
    {
      label: "No-project",
      sub: "alternative baseline",
      tiers: [tiers.tier3, tiers.tier3, tiers.tier4, tiers.tier3, tiers.tier4],
      active: showAlternatives,
    },
  ]

  return (
    <svg
      viewBox="0 0 560 250"
      width="100%"
      height="100%"
      role="img"
      aria-label="Alternative baseline rows in the list view"
    >
      <Frame title="COMPARE AGAINST THE RIGHT BASELINE">
        <Chip
          x={382}
          y={24}
          width={144}
          label="show alt baselines"
          active={showAlternatives}
        />
        {rows.map((row, index) => {
          const y = 86 + index * 52
          const opacity = row.active || index === 0 ? 1 : 0.26
          return (
            <g key={row.label} opacity={opacity}>
              <rect
                x={34}
                y={y}
                width={492}
                height={38}
                rx={10}
                fill={index === 0 ? alpha(theme.palette.blue.bright, 0.06) : theme.palette.grey[50]}
              />
              <SvgLabel x={52} y={y + 17} size={12} weight={600}>
                {row.label}
              </SvgLabel>
              <SvgLabel x={52} y={y + 30} size={10} muted>
                {row.sub}
              </SvgLabel>
              {row.tiers.map((fill, tierIndex) => (
                <Cell
                  key={tierIndex}
                  x={318 + tierIndex * 40}
                  y={y + 5}
                  width={30}
                  height={28}
                  fill={fill}
                />
              ))}
            </g>
          )
        })}
      </Frame>
    </svg>
  )
}

export function OutcomeViewsGraphic() {
  const theme = useTheme()
  const tiers = theme.palette.tiers
  const distB = [
    tiers.tier1,
    tiers.tier1,
    tiers.tier4,
    tiers.tier4,
    tiers.tier2,
    tiers.tier2,
    tiers.tier4,
    tiers.tier1,
    tiers.tier4,
  ]

  return (
    <svg
      viewBox="0 0 560 300"
      width="100%"
      height="100%"
      role="img"
      aria-label="Average, bar, and distribution outcome views with climate and map controls"
    >
      <Frame title="SWITCH THE OUTCOME VIEW">
        <Chip x={214} y={24} width={74} label="Average" active />
        <Chip x={294} y={24} width={58} label="Bar" />
        <Chip x={358} y={24} width={96} label="Distribution" />

        {[
          { x: 38, title: "AVERAGE", subtitle: "first scans and sorting" },
          { x: 210, title: "BAR", subtitle: "relative tier mix" },
          { x: 382, title: "DISTRIBUTION", subtitle: "location spread" },
        ].map((card) => (
          <g key={card.title}>
            <rect
              x={card.x}
              y={74}
              width={140}
              height={118}
              rx={14}
              fill={theme.palette.grey[50]}
            />
            <SvgLabel x={card.x + 18} y={96} size={11} weight={700} muted>
              {card.title}
            </SvgLabel>
            <SvgLabel x={card.x + 18} y={112} size={10} muted>
              {card.subtitle}
            </SvgLabel>
          </g>
        ))}

        <Cell x={84} y={122} width={48} height={48} fill={tiers.tier2} label="2.3" />
        <SvgLabel x={108} y={180} size={10} muted anchor="middle">
          average tier
        </SvgLabel>

        <BarGlyph
          x={244}
          y={122}
          values={[20, 32, 44, 16]}
          fills={[tiers.tier1, tiers.tier2, tiers.tier3, tiers.tier4]}
        />
        <SvgLabel x={280} y={180} size={10} muted anchor="middle">
          tier shares
        </SvgLabel>

        <rect x={430} y={122} width={56} height={56} rx={8} fill={theme.palette.common.white} />
        <DistributionGrid x={440} y={132} fills={distB} />
        <SvgLabel x={458} y={180} size={10} muted anchor="middle">
          vulnerable locations
        </SvgLabel>

        <rect
          x={38}
          y={214}
          width={484}
          height={48}
          rx={14}
          fill={theme.palette.grey[50]}
        />
        <Chip x={54} y={226} width={74} label="Show map" />
        <Chip x={136} y={226} width={132} label="Track locations" />
        <SvgLabel x={292} y={233} size={10} weight={700} muted>
          VIEW BY CLIMATE
        </SvgLabel>
        <Chip x={292} y={240} width={74} label="Historical" active />
        <Chip x={372} y={240} width={78} label="Warm-dry" />
        <Chip x={456} y={240} width={52} label="Wet" />
      </Frame>
    </svg>
  )
}

export const SummaryDistributionGraphic = OutcomeViewsGraphic
