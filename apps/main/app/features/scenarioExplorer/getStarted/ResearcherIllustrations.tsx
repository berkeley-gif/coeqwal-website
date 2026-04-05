"use client"

import { useRef, useEffect } from "react"
import type { MotionValue } from "@repo/motion"

/**
 * Water-themed symbols drawn on each researcher's T-shirt.
 * Paths are drawn within a ~20x14 bounding box centered on the shirt.
 */
const SYMBOLS: { label: string; path: string }[] = [
  // 1. Droplet (CWS deliveries)
  { label: "droplet", path: "M0,-6 Q-5,2 0,7 Q5,2 0,-6 Z" },
  // 2. Leaf (Ag revenues)
  { label: "leaf", path: "M0,-6 Q6,0 0,7 Q-6,0 0,-6 Z M0,-6 L0,7" },
  // 3. Fish (River ecology)
  { label: "fish", path: "M-7,0 Q0,-5 7,0 Q0,5 -7,0 Z M7,0 L10,-3 L10,3 Z" },
  // 4. Wave (Estuary ecology)
  {
    label: "wave",
    path: "M-8,-2 Q-4,-6 0,-2 Q4,2 8,-2 M-8,2 Q-4,-2 0,2 Q4,6 8,2",
  },
  // 5. Salmon (Winter-run)
  {
    label: "salmon",
    path: "M-8,0 Q-2,-5 6,0 Q-2,5 -8,0 Z M6,0 L9,-3 L9,3 Z M-4,-1 L-3,-1",
  },
  // 6. Droplet variant (In-Delta freshwater)
  { label: "droplet2", path: "M0,-6 Q-4,1 0,6 Q4,1 0,-6 Z M-3,0 L3,0" },
  // 7. Arrow-flow (Delta exports)
  { label: "flow", path: "M-7,0 L4,0 M1,-3 L4,0 L1,3" },
  // 8. Dam (Reservoir storage)
  {
    label: "dam",
    path: "M-7,4 L-7,-3 L7,-3 L7,4 M-9,4 L9,4 M-5,-3 L-5,-6 L5,-6 L5,-3",
  },
  // 9. Underground (Groundwater storage)
  { label: "gw", path: "M-7,0 L7,0 M0,0 L0,6 M-3,3 L3,3 M-5,6 L5,6" },
]

const CHAR_W = 60
const CHAR_H = 80
const COLS = 5
const GAP_X = 16
const GAP_Y = 24
const HEAD_R = 13
const HEAD_CY = 14

interface ResearcherIllustrationsProps {
  progress: MotionValue<number>
  panelWidth: number
  panelHeight: number
}

export default function ResearcherIllustrations({
  progress,
  panelWidth,
  panelHeight,
}: ResearcherIllustrationsProps) {
  const charRefs = useRef<(SVGGElement | null)[]>([])
  const smileRefs = useRef<(SVGPathElement | null)[]>([])

  const count = SYMBOLS.length
  const rows = Math.ceil(count / COLS)
  const gridW = COLS * CHAR_W + (COLS - 1) * GAP_X
  const gridH = rows * CHAR_H + (rows - 1) * GAP_Y
  const originX = (panelWidth - gridW) / 2
  const originY = (panelHeight - gridH) / 2 + panelHeight * 0.05

  useEffect(() => {
    const unsub = progress.on("change", (v) => {
      for (let i = 0; i < count; i++) {
        const g = charRefs.current[i]
        const smile = smileRefs.current[i]
        if (!g) continue

        const appearStart = 0.78 + i * 0.018
        const appearEnd = appearStart + 0.03
        const t = Math.min(
          1,
          Math.max(0, (v - appearStart) / (appearEnd - appearStart)),
        )

        g.style.opacity = String(t)
        g.style.transform = `scale(${0.6 + 0.4 * t})`
        g.style.transformOrigin = "center center"

        if (smile) {
          const smileStart = appearEnd + 0.01
          const smileT = Math.min(1, Math.max(0, (v - smileStart) / 0.02))
          smile.style.strokeDashoffset = String(20 * (1 - smileT))
        }
      }
    })
    return unsub
  }, [progress, count])

  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 2,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {SYMBOLS.map((sym, i) => {
        const col = i % COLS
        const row = Math.floor(i / COLS)
        const cx = originX + col * (CHAR_W + GAP_X) + CHAR_W / 2
        const cy = originY + row * (CHAR_H + GAP_Y)

        return (
          <g
            key={sym.label}
            ref={(el) => {
              charRefs.current[i] = el
            }}
            style={{ opacity: 0 }}
          >
            {/* Head */}
            <circle
              cx={cx}
              cy={cy + HEAD_CY}
              r={HEAD_R}
              fill="white"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth={1.5}
            />

            {/* T-shirt body */}
            <path
              d={tshirtPath(cx, cy + HEAD_CY + HEAD_R + 4)}
              fill="rgba(255,255,255,0.15)"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={1.2}
              strokeLinejoin="round"
            />

            {/* Symbol on shirt */}
            <g
              transform={`translate(${cx}, ${cy + HEAD_CY + HEAD_R + 22})`}
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={sym.path} />
            </g>

            {/* Smile (draws in) */}
            <path
              ref={(el) => {
                smileRefs.current[i] = el
              }}
              d={`M${cx - 5},${cy + HEAD_CY + 3} Q${cx},${cy + HEAD_CY + 8} ${cx + 5},${cy + HEAD_CY + 3}`}
              fill="none"
              stroke="rgba(60,60,60,0.6)"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeDasharray="20"
              strokeDashoffset="20"
            />

            {/* Eyes */}
            <circle
              cx={cx - 4}
              cy={cy + HEAD_CY - 2}
              r={1.3}
              fill="rgba(60,60,60,0.5)"
            />
            <circle
              cx={cx + 4}
              cy={cy + HEAD_CY - 2}
              r={1.3}
              fill="rgba(60,60,60,0.5)"
            />
          </g>
        )
      })}
    </svg>
  )
}

/** T-shirt outline centered at (cx, topY) */
function tshirtPath(cx: number, topY: number): string {
  const hw = 20
  const sleeve = 10
  const h = 32
  return [
    `M${cx - hw},${topY}`,
    `L${cx - hw - sleeve},${topY + 8}`,
    `L${cx - hw - sleeve + 4},${topY + 12}`,
    `L${cx - hw},${topY + 8}`,
    `L${cx - hw},${topY + h}`,
    `L${cx + hw},${topY + h}`,
    `L${cx + hw},${topY + 8}`,
    `L${cx + hw + sleeve - 4},${topY + 12}`,
    `L${cx + hw + sleeve},${topY + 8}`,
    `L${cx + hw},${topY}`,
    "Z",
  ].join(" ")
}
