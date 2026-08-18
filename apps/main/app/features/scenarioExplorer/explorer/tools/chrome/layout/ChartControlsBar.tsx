"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Box, Typography, useTheme, ChevronRightIcon } from "@repo/ui/mui"

interface ChartControlsBarProps {
  children: React.ReactNode
}

const ChartControlsBar = React.forwardRef<
  HTMLDivElement,
  ChartControlsBarProps
>(function ChartControlsBar({ children }, ref) {
  const theme = useTheme()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkOverflow = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 1)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkOverflow()
    const observer = new ResizeObserver(checkOverflow)
    observer.observe(el)
    return () => observer.disconnect()
  }, [checkOverflow, children])

  return (
    <Box
      ref={ref}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: theme.space.tool.px,
        py: 0.5,
        minHeight: 36,
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.common.white,
      }}
    >
      <Typography
        variant="dashboard"
        sx={{
          fontWeight: 600,
          color: theme.palette.text.primary,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Chart controls
      </Typography>

      <Box
        sx={{
          width: "1px",
          alignSelf: "stretch",
          minHeight: 20,
          backgroundColor: theme.palette.divider,
          flexShrink: 0,
        }}
      />

      <Box sx={{ position: "relative", flex: 1, minWidth: 0 }}>
        <Box
          ref={scrollRef}
          onScroll={checkOverflow}
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "nowrap",
            gap: 0.5,
            overflowX: "auto",
            overflowY: "hidden",
            WebkitOverflowScrolling: "touch",
            py: 0.5,
            "& > *": { flexShrink: 0 },
          }}
        >
          {children}
        </Box>

        {canScrollRight && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              pointerEvents: "none",
              background: `linear-gradient(to right, transparent, ${theme.palette.common.white} 70%)`,
            }}
          >
            <ChevronRightIcon
              sx={{ fontSize: 18, color: theme.palette.grey[500] }}
            />
          </Box>
        )}
      </Box>
    </Box>
  )
})

export default ChartControlsBar
