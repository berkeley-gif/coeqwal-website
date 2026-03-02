"use client"

/**
 * PackedDots - Circle-packed dot visualization
 *
 * Arranges N small filled circles inside a container circle using D3's
 * packSiblings algorithm. Data-agnostic: takes an array of dot data
 * and renders them as SVG circles.
 *
 * Designed to be embedded inside a larger circle (e.g., a CategoryCircle).
 * Does not render the container circle itself.
 */

import { useMemo } from "react"
import * as d3 from "d3"

export interface DotDatum {
  id: string
  label: string
  description?: string
}

export interface PackedDotsProps {
  /** Array of dots to display */
  dots: DotDatum[]
  /** Diameter of the container circle in px */
  size: number
  /** Radius of each dot in px (default: 7) */
  dotRadius?: number
  /** Gap between dots in px (default: 3) */
  dotGap?: number
  /** Fill color for each dot (default: white) */
  fillColor?: string
  /** Callback when a dot is hovered (desktop) or tapped (touch) */
  onDotHover?: (dot: DotDatum | null, event: React.MouseEvent) => void
  /** Callback when a dot is clicked */
  onDotClick?: (dot: DotDatum, event: React.MouseEvent) => void
}

interface PackedCircle {
  x: number
  y: number
  r: number
  datum: DotDatum
}

export default function PackedDots({
  dots,
  size,
  dotRadius = 7,
  dotGap = 3,
  fillColor = "#ffffff",
  onDotHover,
  onDotClick,
}: PackedDotsProps) {
  const packed = useMemo((): PackedCircle[] => {
    if (dots.length === 0) return []

    const containerRadius = size / 2
    const padding = containerRadius * 0.15

    // Each sibling gets dotRadius + half the gap so packSiblings spaces them out
    const packRadius = dotRadius + dotGap / 2

    const siblings = dots.map((d) => ({
      r: packRadius,
      datum: d,
      x: 0,
      y: 0,
    }))

    d3.packSiblings(siblings)

    const enclosing = d3.packEnclose(siblings)
    if (!enclosing || enclosing.r === 0) {
      return siblings.map((s) => ({
        x: containerRadius,
        y: containerRadius,
        r: dotRadius,
        datum: s.datum,
      }))
    }

    // Scale to fit inside container circle with padding
    const availableRadius = containerRadius - padding
    const scale = Math.min(1, availableRadius / enclosing.r)

    return siblings.map((s) => ({
      x: containerRadius + (s.x - enclosing.x) * scale,
      y: containerRadius + (s.y - enclosing.y) * scale,
      r: dotRadius * scale,
      datum: s.datum,
    }))
  }, [dots, size, dotRadius, dotGap])

  if (dots.length === 0) return null

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      {packed.map((circle: PackedCircle) => (
        <circle
          key={circle.datum.id}
          cx={circle.x}
          cy={circle.y}
          r={circle.r}
          fill={fillColor}
          style={{ cursor: onDotClick || onDotHover ? "pointer" : "default" }}
          onMouseEnter={
            onDotHover ? (e) => onDotHover(circle.datum, e) : undefined
          }
          onMouseLeave={onDotHover ? (e) => onDotHover(null, e) : undefined}
          onClick={
            onDotClick
              ? (e) => {
                  e.stopPropagation()
                  onDotClick(circle.datum, e)
                }
              : undefined
          }
        />
      ))}
    </svg>
  )
}
