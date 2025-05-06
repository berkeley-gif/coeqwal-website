"use client"

import React, { useRef, useState } from "react"
import { Box, useTheme } from "@mui/material"
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"

interface CustomScrollContainerProps {
  children: React.ReactNode
  maxHeight?: string | number
  width?: string | number
}

/**
 * A custom scrollable container with obvious up/down buttons
 */
export const CustomScrollContainer: React.FC<CustomScrollContainerProps> = ({
  children,
  maxHeight = "70vh",
  width = "100%",
}) => {
  const theme = useTheme()
  const contentRef = useRef<HTMLDivElement>(null)
  const [atTop, setAtTop] = useState(true)
  const [atBottom, setAtBottom] = useState(false)

  const scrollStep = 200 // pixels to scroll per click

  // Handle scroll event to determine if we're at the top or bottom
  const handleScroll = () => {
    if (!contentRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current
    setAtTop(scrollTop <= 0)
    setAtBottom(scrollTop + clientHeight >= scrollHeight - 10) // 10px tolerance
  }

  // Scroll up function
  const scrollUp = () => {
    if (!contentRef.current) return
    contentRef.current.scrollBy({
      top: -scrollStep,
      behavior: "smooth",
    })
  }

  // Scroll down function
  const scrollDown = () => {
    if (!contentRef.current) return
    contentRef.current.scrollBy({
      top: scrollStep,
      behavior: "smooth",
    })
  }

  return (
    <Box sx={{ position: "relative", width, maxHeight, overflow: "hidden" }}>
      {/* Main content container with slightly visible scrollbar */}
      <Box
        ref={contentRef}
        sx={{
          width: "100%",
          height: "100%",
          maxHeight: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          paddingRight: theme.spacing(2),
          boxSizing: "border-box",
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": {
            width: "8px",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0,0,0,0.2)",
            borderRadius: "4px",
          },
        }}
        onScroll={handleScroll}
      >
        {children}
      </Box>

      {/* Large scroll buttons */}
      <Box
        sx={{
          position: "absolute",
          right: theme.spacing(1),
          bottom: theme.spacing(2),
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          zIndex: 1000,
        }}
      >
        {/* Up button */}
        <Box
          onClick={scrollUp}
          sx={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: theme.palette.primary.main,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: atTop ? "default" : "pointer",
            opacity: atTop ? 0.5 : 1,
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            transition: "opacity 0.2s, transform 0.2s",
            "&:hover": {
              transform: atTop ? "none" : "translateY(-2px)",
            },
          }}
        >
          <KeyboardArrowUpIcon />
        </Box>

        {/* Down button */}
        <Box
          onClick={scrollDown}
          sx={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: theme.palette.primary.main,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: atBottom ? "default" : "pointer",
            opacity: atBottom ? 0.5 : 1,
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            transition: "opacity 0.2s, transform 0.2s",
            "&:hover": {
              transform: atBottom ? "none" : "translateY(2px)",
            },
          }}
        >
          <KeyboardArrowDownIcon />
        </Box>
      </Box>
    </Box>
  )
}

export default CustomScrollContainer
