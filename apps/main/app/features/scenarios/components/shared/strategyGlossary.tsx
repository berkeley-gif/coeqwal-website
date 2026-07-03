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
}: {
  description: string
  maxWidth?: string | number | object
  disableTruncation?: boolean
}) {
  const theme = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)
  const renderTextWithGlossaryLinks = useGlossaryRenderer(description)

  const toggleButtonStyles = {
    color: theme.palette.blue.medium,
    fontStyle: "italic",
    cursor: "pointer",
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

      {/* Truncated view - height-clipped with "… more" overlay at bottom-right */}
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
        <Box sx={{ position: "relative" }}>
          <Box
            sx={{
              maxHeight: "3em",
              overflow: "hidden",
              lineHeight: 1.5,
            }}
          >
            {renderTextWithGlossaryLinks()}
          </Box>
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
              position: "absolute",
              bottom: 0,
              right: 0,
              pl: 3,
              background:
                "linear-gradient(to right, transparent, var(--row-bg) 40%)",
            }}
          >
            … more
          </Box>
        </Box>
      </motion.div>
    </Typography>
  )
}
