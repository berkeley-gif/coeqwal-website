"use client"

import { useTheme } from "@repo/ui/mui"
import React from "react"
/**
 * Key terms in question summary
 */
interface HighlightTextProps {
  bgcolor: string
  children: React.ReactNode
}

export const HighlightText: React.FC<HighlightTextProps> = ({
  bgcolor,
  children,
}) => {
  const theme = useTheme()
  return (
    <span
      style={{
        backgroundColor: bgcolor,
        borderRadius: "16px",
        padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
        color: theme.palette.common.white,
        opacity: 0.95,
      }}
    >
      {children}
    </span>
  )
}

/**
 * ColoredText component - text with colored font
 * Used for highlighting text with colored font rather than background
 */
interface ColoredTextProps {
  color: string
  children: React.ReactNode
}

export const ColoredText: React.FC<ColoredTextProps> = ({
  color,
  children,
}) => {
  return <span style={{ color, fontWeight: 500, textDecoration: "underline" }}>{children}</span>
}
