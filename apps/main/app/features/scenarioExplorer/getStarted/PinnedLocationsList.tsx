"use client"

import { useRef, useEffect, useCallback, useState, useMemo } from "react"
import { Box } from "@repo/ui/mui"
import type { LocationHighlight } from "../../map/store"

interface PinnedLocationsListProps {
  highlights: LocationHighlight[]
  onUnpin: (key: string) => void
  onHoverEnter?: (key: string) => void
  onHoverLeave?: () => void
  hoveredKey?: string | null
  mapRef?: React.RefObject<{ getMap?: () => unknown } | null>
}

interface LineEndpoints {
  cardX: number
  cardY: number
  featureX: number
  featureY: number
}

export default function PinnedLocationsList({
  highlights,
  onUnpin,
  onHoverEnter,
  onHoverLeave,
  hoveredKey,
  mapRef,
}: PinnedLocationsListProps) {
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [lines, setLines] = useState<Map<string, LineEndpoints>>(new Map())
  const linesRef = useRef(lines)
  linesRef.current = lines

  const computeLines = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (mapRef?.current as any)?.getMap?.()
    if (!map || highlights.length === 0) {
      if (linesRef.current.size > 0) setLines(new Map())
      return
    }

    const container = map.getContainer() as HTMLElement | null
    if (!container) return
    const mapRect = container.getBoundingClientRect()

    const next = new Map<string, LineEndpoints>()

    for (const hl of highlights) {
      const cardEl = cardRefs.current.get(hl.key)
      if (!cardEl) continue

      try {
        const pt = map.project([hl.longitude, hl.latitude])
        const cardRect = cardEl.getBoundingClientRect()

        next.set(hl.key, {
          cardX: cardRect.left,
          cardY: cardRect.top + cardRect.height / 2,
          featureX: mapRect.left + pt.x,
          featureY: mapRect.top + pt.y,
        })
      } catch {
        /* feature outside projection bounds */
      }
    }

    setLines(next)
  }, [highlights, mapRef])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (mapRef?.current as any)?.getMap?.()
    if (!map) return

    computeLines()

    let rafId: number | null = null
    const onMove = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        computeLines()
        rafId = null
      })
    }

    map.on("move", onMove)
    return () => {
      map.off("move", onMove)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [mapRef, computeLines])

  useEffect(() => {
    computeLines()
  }, [highlights, computeLines])

  const sorted = useMemo(
    () => [...highlights].sort((a, b) => b.latitude - a.latitude),
    [highlights],
  )

  if (sorted.length === 0) return null

  return (
    <>
      {/* SVG leader lines — fixed viewport overlay so they aren't clipped */}
      <svg
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        {sorted.map((hl) => {
          const line = lines.get(hl.key)
          if (!line) return null
          const active = hl.key === hoveredKey

          return (
            <line
              key={hl.key}
              x1={line.cardX}
              y1={line.cardY}
              x2={line.featureX}
              y2={line.featureY}
              stroke={active ? "rgba(255, 216, 126, 1)" : "rgba(255, 216, 126, 0.6)"}
              strokeWidth={active ? 2.5 : 1.5}
              strokeDasharray={active ? undefined : "4 3"}
              style={{ transition: "stroke 0.15s, stroke-width 0.15s" }}
            />
          )
        })}
      </svg>

      {/* Card list */}
      <Box
        sx={{
          position: "absolute",
          right: "calc(33.33% + 12px)",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 6,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          maxHeight: "60%",
          overflowY: "auto",
          pointerEvents: "auto",
        }}
      >
        {sorted.map((hl) => (
          <Box
            key={hl.key}
            ref={(el: HTMLDivElement | null) => {
              if (el) cardRefs.current.set(hl.key, el)
              else cardRefs.current.delete(hl.key)
            }}
            onClick={() => onUnpin(hl.key)}
            onMouseEnter={() => onHoverEnter?.(hl.key)}
            onMouseLeave={() => onHoverLeave?.()}
            sx={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              p: "3px 8px",
              borderRadius: "4px",
              background: "rgba(255,255,255,0.75)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
              fontSize: 11,
              lineHeight: 1.3,
              textAlign: "center",
              color: "#333",
              whiteSpace: "nowrap",
              cursor: "pointer",
              transition: "box-shadow 0.15s, background 0.15s",
              "&:hover": {
                background: "rgba(255,255,255,0.9)",
                boxShadow: "0 0 0 2px #ffd87e, 0 2px 8px rgba(0,0,0,0.18)",
              },
            }}
          >
            <Box
              component="span"
              sx={{
                fontWeight: 600,
                maxWidth: 200,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {hl.name}
            </Box>
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontWeight: 500,
                color: hl.tierColor,
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "2px",
                  backgroundColor: hl.tierColor,
                  flexShrink: 0,
                }}
              />
              Tier {hl.tierLevel}: {hl.tierLabel}
            </Box>
          </Box>
        ))}
      </Box>
    </>
  )
}
