"use client"

import React from "react"

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

