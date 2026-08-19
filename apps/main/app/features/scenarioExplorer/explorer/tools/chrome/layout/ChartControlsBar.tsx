"use client"

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useScrollRightIndicator } from "../../hooks/useScrollRightIndicator"
import ScrollRightIndicator from "./ScrollRightIndicator"
interface ChartControlsBarProps {
  children: React.ReactNode
}

const ChartControlsBar = React.forwardRef<
  HTMLDivElement,
  ChartControlsBarProps
>(function ChartControlsBar({ children }, ref) {
  const theme = useTheme()
  const { scrollRef, canScrollRight, checkOverflow } =
    useScrollRightIndicator([children])

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

        <ScrollRightIndicator visible={canScrollRight} />
      </Box>
    </Box>
  )
})

export default ChartControlsBar
