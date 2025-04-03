"use client"

import { useTheme } from "@repo/ui/mui"
import React from "react"
/**
 * HighlightText component - text with colored background
 * Used for visually emphasizing key terms with a colored background
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
        borderRadius: theme.shape.borderRadius,
        padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
        color: theme.palette.common.white,
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
  return <span style={{ color, fontWeight: 500 }}>{children}</span>
}
