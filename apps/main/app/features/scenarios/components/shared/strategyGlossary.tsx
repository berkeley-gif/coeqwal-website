"use client"

/**
 * Glossary text rendering shared by strategy descriptions and operation tooltips
 *
 * `useGlossaryRenderer` turns a description string into React nodes where known
 * glossary terms become buttons that open the glossary drawer. Callers may pass
 * their own term list, defaults to the shared GLOSSARY_TERMS.
 */

import React, { useCallback, useMemo, useState } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useDrawerStore } from "@repo/state/drawer"
import { motion } from "@repo/motion"
import { useIsCoarsePointer } from "@repo/ui/hooks"

/**
 * Truncates to a character budget, cutting at the last whole word.
 * Used for the collapsed preview instead of a CSS height clamp, so the
 * amount of *text* shown stays roughly constant across screen widths —
 * a line-count clamp shows less and less text as the container narrows,
 * since fewer characters fit per line at the same fixed height.
 */
export function truncateDescriptionText(
  text: string,
  maxChars: number,
): string {
  if (text.length <= maxChars) return text
  const cut = text.slice(0, maxChars)
  const lastSpace = cut.lastIndexOf(" ")
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()
}

export interface GlossaryTerm {
  /** Regex matching the term as it appears in description text */
  pattern: RegExp
  /** Canonical glossary entry to open when the term is clicked */
  glossaryTerm: string
}

/**
 * Glossary term configuration that maps text patterns to glossary entries
 */
export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    pattern: /\bTUCPs?\b/g,
    glossaryTerm: "Temporary Urgent Change Petitions (TUCPs)",
  },
  {
    pattern: /\bSGMA\b/g,
    glossaryTerm: "Sustainable Groundwater Management Act (SGMA)",
  },
  {
    pattern: /\bDelta Conveyance Project\b/g,
    glossaryTerm: "Delta Conveyance Project",
  },
]

/**
 * Returns a render function that converts `description` into React nodes,
 * turning any matched glossary `terms` into buttons that open the glossary
 * drawer. Defaults to the shared GLOSSARY_TERMS list.
 */
export function useGlossaryRenderer(
  description: string,
  terms: GlossaryTerm[] = GLOSSARY_TERMS,
) {
  const theme = useTheme()
  const { setDrawerContent, openDrawer } = useDrawerStore()

  const handleClick = useCallback(
    (term: string) => (e: React.MouseEvent) => {
      e.stopPropagation()
      setDrawerContent({ selectedTerm: term })
      openDrawer("glossary")
    },
    [setDrawerContent, openDrawer],
  )

  const handleKeyDown = useCallback(
    (term: string) => (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        e.stopPropagation()
        setDrawerContent({ selectedTerm: term })
        openDrawer("glossary")
      }
    },
    [setDrawerContent, openDrawer],
  )

  const linkStyles = useMemo(
    () => ({
      color: "inherit",
      cursor: "pointer",
      background: "none",
      border: "none",
      padding: 0,
      font: "inherit",
      ...theme.typography.glossaryTerm,
      textDecoration: "underline",
      "&:focus-visible": {
        outline: `2px solid ${theme.palette.blue.bright}`,
        outlineOffset: "2px",
        borderRadius: "2px",
      },
    }),
    [theme.palette.blue.bright],
  )

  return useCallback(() => {
    const combinedPattern = new RegExp(
      `(${terms.map((t) => t.pattern.source).join("|")})([.,;:!?]?)`,
      "g",
    )
    const result: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = combinedPattern.exec(description)) !== null) {
      if (match.index > lastIndex) {
        result.push(description.slice(lastIndex, match.index))
      }
      const matchedTerm = match[1] ?? ""
      const trailingPunct = match[2] ?? ""
      for (const term of terms) {
        if (
          matchedTerm &&
          new RegExp(`^${term.pattern.source}$`).test(matchedTerm)
        ) {
          result.push(
            <Box
              component="button"
              type="button"
              key={`link-${match.index}`}
              onClick={handleClick(term.glossaryTerm)}
              onKeyDown={handleKeyDown(term.glossaryTerm)}
              tabIndex={0}
              aria-label={`Open glossary for ${term.glossaryTerm}`}
              sx={linkStyles}
            >
              {matchedTerm}
            </Box>,
          )
          if (trailingPunct) result.push(trailingPunct)
          break
        }
      }
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < description.length) {
      result.push(description.slice(lastIndex))
    }
    return result
  }, [description, terms, handleClick, handleKeyDown, linkStyles])
}

/**
 * Renders a strategy description with clickable glossary links and a
 * more/less truncation toggle using a Framer Motion cross-fade.
 */
export function DescriptionWithGlossaryLinks({
  description,
  maxWidth,
  disableTruncation = false,
  charLimit: charLimitOverride,
}: {
  description: string
  maxWidth?: string | number | object
  disableTruncation?: boolean
  charLimit?: number
}) {
  const theme = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)
  const isCoarsePointer = useIsCoarsePointer()
  const charLimit = charLimitOverride ?? (isCoarsePointer ? 280 : 200)
  const truncatedDescription = useMemo(
    () => truncateDescriptionText(description, charLimit),
    [description, charLimit],
  )
  const isTruncated = truncatedDescription.length < description.length
  const renderTextWithGlossaryLinks = useGlossaryRenderer(description)
  const renderTruncatedText = useGlossaryRenderer(truncatedDescription)

  const toggleButtonStyles = {
    color: theme.palette.blue.medium,
    fontStyle: "italic",
    cursor: "pointer",
    float: "right",
    userSelect: "none" as const,
    background: "none",
    border: "none",
    padding: 0,
    font: "inherit",
    "&:hover": {
      textDecoration: "underline",
    },
    "&:focus-visible": {
      outline: `2px solid ${theme.palette.blue.bright}`,
      outlineOffset: "2px",
      borderRadius: "2px",
    },
  }

  if (disableTruncation) {
    return (
      <Typography
        component="div"
        variant="dashboard"
        sx={{
          color: theme.palette.grey[600],
          ...(maxWidth && { maxWidth }),
        }}
      >
        {renderTextWithGlossaryLinks()}
      </Typography>
    )
  }

  return (
    <Typography
      component="div"
      variant="dashboard"
      sx={{
        color: theme.palette.grey[600],
        ...(maxWidth && { maxWidth }),
        position: "relative",
      }}
    >
      {/* Expanded view - positioned absolutely when not active */}
      <motion.div
        initial={false}
        animate={{
          opacity: isExpanded ? 1 : 0,
          position: isExpanded ? "relative" : "absolute",
          pointerEvents: isExpanded ? "auto" : "none",
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        style={{ top: 0, left: 0, right: 0 }}
      >
        {renderTextWithGlossaryLinks()}
        <Box
          component="button"
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(false)
          }}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              e.stopPropagation()
              setIsExpanded(false)
            }
          }}
          aria-expanded={true}
          aria-label="Show less description text"
          sx={{
            ...toggleButtonStyles,
            float: "right",
          }}
        >
          less
        </Box>
      </motion.div>

      {/* Truncated view - "… more" flows inline right after the cut text */}
      <motion.div
        initial={false}
        animate={{
          opacity: isExpanded ? 0 : 1,
          position: isExpanded ? "absolute" : "relative",
          pointerEvents: isExpanded ? "none" : "auto",
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        style={{ top: 0, left: 0, right: 0 }}
      >
        <Box sx={{ lineHeight: 1.5 }}>
          {renderTruncatedText()}
          {isTruncated && (
            <>
              {"… "}
              <Box
                component="button"
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(true)
                }}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsExpanded(true)
                  }
                }}
                aria-expanded={false}
                aria-label="Show more description text"
                sx={{
                  ...toggleButtonStyles,
                }}
              >
                Show more
              </Box>
            </>
          )}
        </Box>
      </motion.div>
    </Typography>
  )
}
