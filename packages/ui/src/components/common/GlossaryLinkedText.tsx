"use client"

/**
 * GlossaryLinkedText - Text with clickable glossary term links
 *
 * Renders text content with underlined terms that link to glossary definitions.
 * Used throughout the app to provide contextual definitions.
 */

import React from "react"
import { Box, TypographyProps } from "@repo/ui/mui"

export interface GlossaryTermConfig {
  name: string
  glossaryTerm: string
}

export interface GlossaryLinkedTextProps {
  text: string
  terms: GlossaryTermConfig[]
  onActivate: (glossaryTerm: string) => void
  color?: TypographyProps["color"] | string
  underlinePx?: number
  underlineHoverPx?: number
  caseSensitive?: boolean
  wordBoundary?: boolean
  linkColor?: string
  underlineColor?: string
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function GlossaryLinkedText({
  text,
  terms,
  onActivate,
  color,
  underlinePx = 3,
  underlineHoverPx = 5,
  caseSensitive = false,
  wordBoundary = true,
  linkColor,
  underlineColor,
}: GlossaryLinkedTextProps) {
  if (!text || terms.length === 0) return <>{text}</>

  // Build a single regex that matches any of the terms
  const flags = caseSensitive ? "g" : "gi"
  const patterns = terms.map((t) => {
    const esc = escapeRegExp(t.name)
    return wordBoundary ? `\\b${esc}\\b` : esc
  })
  const regex = new RegExp(`(${patterns.join("|")})`, flags)

  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  // Build a lookup map (lowercased name -> glossaryTerm)
  const lookup = new Map(
    terms.map((t) => [
      caseSensitive ? t.name : t.name.toLowerCase(),
      t.glossaryTerm,
    ]),
  )

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index
    const matchedText = match[0]

    if (matchIndex > lastIndex) {
      nodes.push(text.slice(lastIndex, matchIndex))
    }

    const key = caseSensitive ? matchedText : matchedText.toLowerCase()
    const glossaryTerm = lookup.get(key) || matchedText

    nodes.push(
      <Box
        key={`glossary-${matchIndex}-${matchedText}`}
        component="span"
        sx={{
          backgroundColor: "transparent",
          borderBottom: `${underlinePx}px solid ${underlineColor || "#3a4574"}`, // Default text blue, todo: relate to theme color
          color: linkColor || color || "#3a4574", // Default text blue
          py: 0.1,
          mx: 0.2,
          lineHeight: 0,
          paddingBottom: "0.5rem",
          cursor: "pointer",
          display: "inline-block",
          position: "relative",
          "&:hover": {
            borderBottom: `${underlineHoverPx}px solid ${underlineColor || "#3a4574"}`, // Default text blue
          },
        }}
        onClick={() => onActivate(glossaryTerm)}
      >
        {matchedText}
      </Box>,
    )

    lastIndex = matchIndex + matchedText.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return <>{nodes}</>
}

export default GlossaryLinkedText
