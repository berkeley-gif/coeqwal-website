"use client"

import React, { useEffect, useState } from "react"
import { Box, Portal, useTheme } from "@repo/ui/mui"

/**
 * Highlight ring aligned to the anchor's screen rect.
 *
 * Uses `position: fixed` so parent `overflow: hidden` cannot clip it.
 * RAF loop re-reads bounds on every frame while the step is active.
 */
export function HighlightRing({ anchorEl }: { anchorEl: Element | null }) {
  const theme = useTheme()
  const [rect, setRect] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)

  useEffect(() => {
    if (!anchorEl) {
      setRect(null)
      return
    }
    let raf = 0
    let prevKey = ""
    const tick = () => {
      const r = anchorEl.getBoundingClientRect()
      const key = `${r.top}|${r.left}|${r.width}|${r.height}`
      if (key !== prevKey) {
        prevKey = key
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      }
      raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [anchorEl])

  if (!rect) return null
  const pad = 4
  return (
    <Portal>
      <Box
        aria-hidden
        sx={{
          position: "fixed",
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          borderRadius: 1.5,
          border: `2px solid ${theme.palette.blue.bright}`,
          boxShadow: `0 0 0 4px ${theme.palette.blue.bright}33`,
          pointerEvents: "none",
          zIndex: theme.zIndex.modal - 1,
          transition:
            "top 120ms ease, left 120ms ease, width 120ms ease, height 120ms ease",
        }}
      />
    </Portal>
  )
}
