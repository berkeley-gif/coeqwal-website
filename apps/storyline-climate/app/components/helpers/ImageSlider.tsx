"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Box, UnfoldMoreIcon } from "@repo/ui/mui"

type HorizontalCompareProps = {
  leftSrc: string
  rightSrc: string
  altLeft?: string
  altRight?: string
  height?: number | string
  initial?: number // 0..100 (% from left)
}

type VerticalCompareProps = {
  topSrc: string
  bottomSrc: string
  altTop?: string
  altBottom?: string
  height?: number | string
  initial?: number // 0..100 (% from top)
}

export function HorizontalImageSlider({
  leftSrc,
  rightSrc,
  altLeft = "",
  altRight = "",
  height = "100vh",
  initial = 50,
}: HorizontalCompareProps) {
  const [pos, setPos] = useState(Math.min(100, Math.max(0, initial)))
  const wrapRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const updateFromPointer = useCallback((clientX: number) => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width)
    setPos((x / rect.width) * 100)
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      updateFromPointer(e.clientX)
    }
    const onUp = () => (dragging.current = false)
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerup", onUp, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
  }, [updateFromPointer])

  return (
    <Box
      ref={wrapRef}
      role="group"
      aria-label="Horizontal image comparison slider"
      sx={{
        position: "relative",
        width: "100%",
        height,
        overflow: "hidden",
        userSelect: "none",
        touchAction: "none",
      }}
      onPointerDown={(e) => {
        dragging.current = true
        ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
        updateFromPointer(e.clientX)
      }}
    >
      {/* Right image*/}
      <Box
        component="img"
        src={rightSrc}
        alt={altRight}
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        draggable={false}
      />

      {/* Left image*/}
      <Box
        component="img"
        src={leftSrc}
        alt={altLeft}
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          clipPath: `inset(0 ${100 - pos}% 0 0)`, // stay static show only the left `pos%` by clipping from the RIGHT.
          pointerEvents: "none",
        }}
        draggable={false}
      />

      {/* Divider line */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `calc(${pos}% - 1px)`,
          width: "2px",
          backgroundColor: "white",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.2)",
          pointerEvents: "none",
        }}
      />

      {/* Knob (draggable & keyboard accessible) */}
      <Box
        role="slider"
        aria-label="Comparison position"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        tabIndex={0}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 10 : 2
          if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - step))
          if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + step))
          if (e.key === "Home") setPos(0)
          if (e.key === "End") setPos(100)
        }}
        sx={{
          position: "absolute",
          top: "50%",
          left: `${pos}%`,
          transform: "translate(-50%, -50%)",
          width: 44,
          height: 44,
          borderRadius: "9999px",
          backgroundColor: "rgba(255,255,255,0.95)",
          border: "1px solid rgba(0,0,0,0.15)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
          display: "grid",
          placeItems: "center",
          cursor: "ew-resize",
          outline: "none",
        }}
        onPointerDown={(e) => {
          dragging.current = true
          ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
          updateFromPointer(e.clientX)
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14 7l-5 5 5 5" fill="none" stroke="black" strokeWidth="2" />
          <path d="M10 7l5 5-5 5" fill="none" stroke="black" strokeWidth="2" />
        </svg>
      </Box>
    </Box>
  )
}

export function VerticalImageSlider({
  topSrc,
  bottomSrc,
  altTop = "",
  altBottom = "",
  height = "100vh",
  initial = 50,
}: VerticalCompareProps) {
  const [pos, setPos] = useState(Math.min(100, Math.max(0, initial)))
  const wrapRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const [isDragging, setIsDragging] = useState(false)
  const updateFromPointer = useCallback((clientY: number) => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const y = Math.min(Math.max(clientY - rect.top, 0), rect.height)
    setPos((y / rect.height) * 100)
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      updateFromPointer(e.clientY)
    }
    const onUp = () => {
      dragging.current = false
      setIsDragging(false)
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerup", onUp, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
  }, [updateFromPointer])

  return (
    <Box
      ref={wrapRef}
      role="group"
      aria-label="Vertical image comparison slider"
      sx={{
        position: "relative",
        width: "100%",
        height,
        overflow: "hidden",
        userSelect: "none",
        touchAction: "none",
        cursor: isDragging ? "pointer" : "default",
      }}
      onPointerDown={(e) => {
        ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
        updateFromPointer(e.clientY)
        dragging.current = true
        setIsDragging(true)
      }}
    >
      {/* Bottom image*/}
      <Box
        component="img"
        src={bottomSrc}
        alt={altBottom}
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        draggable={false}
      />

      {/* Top image */}
      <Box
        component="img"
        src={topSrc}
        alt={altTop}
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          clipPath: `inset(0 0 ${100 - pos}% 0)`,
          pointerEvents: "none",
        }}
        draggable={false}
      />
      <Box
        sx={{
          pointerEvents: "none",
          width: "100%",
          height: "100%",
          position: "relative",
          backgroundColor: "#21212150",
        }}
      />

      {/* Divider line */}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          top: `calc(${pos}% - 2px)`,
          height: "4px",
          backgroundColor: "#f0f2ef",
          pointerEvents: "none",
          cursor: "pointer",
        }}
      />

      {/* Knob (draggable) */}
      <Box
        role="slider"
        aria-label="Comparison position"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        tabIndex={0}
        sx={{
          position: "absolute",
          left: "50%",
          top: `${pos}%`,
          transform: "translate(-50%, -50%)",
          width: 44,
          height: 44,
          borderRadius: "50%",
          backgroundColor: "#f2f0ef",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          outline: "none",
          pointerEvents: "auto",
        }}
        onPointerDown={(e) => {
          ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
          dragging.current = true
          updateFromPointer(e.clientY)
          setIsDragging(true)
        }}
      >
        <UnfoldMoreIcon style={{ fill: "#104472" }} />
      </Box>
    </Box>
  )
}
