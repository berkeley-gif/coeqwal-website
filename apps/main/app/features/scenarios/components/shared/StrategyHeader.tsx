"use client"

/**
 * StrategyHeader - Strategy title and description (with glossary links)
 *
 * Shared component for rendering strategy information.
 * Used by both Learn mode (StrategyInfoPanel) and Explore mode (StrategyGrid).
 *
 * Handles clickable glossary links for terms like TUCP and SGMA
 * that open the glossary when mentioned in the strategy description.
 *
 * Uses @re-dev/react-truncate for word-aware truncation with Framer Motion
 * cross-fade animation for smooth expand/collapse transitions.
 */

import React, { useState, useCallback, useMemo } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useDrawerStore } from "@repo/state/drawer"
import { motion } from "@repo/motion"
import { Truncate } from "@re-dev/react-truncate"
import type { ScenarioForDisplay } from "./types"

export interface StrategyHeaderProps {
  /** Scenario data */
  strategy: ScenarioForDisplay
  /** Whether to show the description */
  showDescription?: boolean
  /** Typography variant for the title */
  titleVariant?: "subtitle1" | "subtitle2" | "body1" | "body2"
  /** Max width for the description */
  descriptionMaxWidth?: string | number | object
  /** Called when title is clicked */
  onTitleClick?: () => void
}

/**
 * Glossary term configuration - maps text patterns to glossary entries
 */
const GLOSSARY_TERMS = [
  {
    pattern: /\bTUCPs?\b/g,
    glossaryTerm: "Temporary Urgent Change Petitions (TUCPs)",
  },
  {
    pattern: /\bSGMA\b/g,
    glossaryTerm: "Sustainable Groundwater Management Act (SGMA)",
  },
]

/**
 * Renders strategy description with clickable glossary links and truncation.
 * Uses @re-dev/react-truncate for word-aware truncation with Framer Motion
 * cross-fade animation for smooth expand/collapse transitions.
 */
function DescriptionWithGlossaryLinks({
  description,
  maxWidth,
}: {
  description: string
  maxWidth?: string | number | object
}) {
  const theme = useTheme()
  const { setDrawerContent, openDrawer } = useDrawerStore()
  const [isExpanded, setIsExpanded] = useState(false)

  // Handle glossary term click - opens glossary to specific entry
  const handleGlossaryClick = useCallback(
    (glossaryTerm: string) => (e: React.MouseEvent) => {
      e.stopPropagation()
      setDrawerContent({ selectedTerm: glossaryTerm })
      openDrawer("glossary")
    },
    [setDrawerContent, openDrawer],
  )

  // WCAG 2.1.1: Handle keyboard activation for glossary links
  const handleGlossaryKeyDown = useCallback(
    (glossaryTerm: string) => (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        e.stopPropagation()
        setDrawerContent({ selectedTerm: glossaryTerm })
        openDrawer("glossary")
      }
    },
    [setDrawerContent, openDrawer],
  )

  // Toggle styles for show more/less - now as buttons
  const toggleButtonStyles = {
    color: theme.palette.blue.bright,
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
    // WCAG 2.4.7: Focus visible styles
    "&:focus-visible": {
      outline: `2px solid ${theme.palette.blue.bright}`,
      outlineOffset: "2px",
      borderRadius: "2px",
    },
  }

  // Glossary link styles - now as buttons
  const glossaryLinkStyles = useMemo(
    () => ({
      color: theme.palette.blue.bright,
      borderBottom: `2px solid ${theme.palette.blue.bright}`,
      cursor: "pointer",
      background: "none",
      border: "none",
      borderBottomStyle: "solid" as const,
      borderBottomWidth: "2px",
      borderBottomColor: theme.palette.blue.bright,
      padding: 0,
      font: "inherit",
      "&:hover": {
        borderBottomWidth: "3px",
      },
      // WCAG 2.4.7: Focus visible styles
      "&:focus-visible": {
        outline: `2px solid ${theme.palette.blue.bright}`,
        outlineOffset: "2px",
        borderRadius: "2px",
      },
    }),
    [theme.palette.blue.bright],
  )

  // Build text content with glossary links as React nodes
  const renderTextWithGlossaryLinks = useCallback(() => {
    // Build combined regex pattern for all glossary terms
    // Capture trailing punctuation in a separate group so it stays adjacent
    const combinedPattern = new RegExp(
      `(${GLOSSARY_TERMS.map((t) => t.pattern.source).join("|")})([.,;:!?]?)`,
      "g",
    )

    const result: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = combinedPattern.exec(description)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        result.push(description.slice(lastIndex, match.index))
      }

      const matchedTerm = match[1] ?? ""
      const trailingPunct = match[2] ?? ""

      // Find which glossary term this matches
      for (const term of GLOSSARY_TERMS) {
        if (
          matchedTerm &&
          new RegExp(`^${term.pattern.source}$`).test(matchedTerm)
        ) {
          result.push(
            <Box
              component="button"
              type="button"
              key={`link-${match.index}`}
              onClick={handleGlossaryClick(term.glossaryTerm)}
              onKeyDown={handleGlossaryKeyDown(term.glossaryTerm)}
              tabIndex={0}
              aria-label={`Open glossary for ${term.glossaryTerm}`}
              sx={glossaryLinkStyles}
            >
              {matchedTerm}
            </Box>,
          )
          if (trailingPunct) {
            result.push(trailingPunct)
          }
          break
        }
      }

      lastIndex = match.index + match[0].length
    }

    // Add any remaining text after the last match
    if (lastIndex < description.length) {
      result.push(description.slice(lastIndex))
    }

    return result
  }, [
    description,
    handleGlossaryClick,
    handleGlossaryKeyDown,
    glossaryLinkStyles,
  ])

  // Ellipsis with "show more" link for truncated view
  const showMoreEllipsis = (
    <Box component="span">
      ...{" "}
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
        sx={toggleButtonStyles}
      >
        show more
      </Box>
    </Box>
  )

  return (
    <Typography
      component="div"
      variant="dashboard"
      sx={{
        color: theme.palette.grey[600],
        maxWidth: maxWidth ?? theme.layout.maxWidth.md,
        lineHeight: 1.6,
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
        {renderTextWithGlossaryLinks()}{" "}
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
          sx={toggleButtonStyles}
        >
          show less
        </Box>
      </motion.div>

      {/* Truncated view - positioned absolutely when not active */}
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
        <Truncate lines={2} ellipsis={showMoreEllipsis}>
          <span>{renderTextWithGlossaryLinks()}</span>
        </Truncate>
      </motion.div>
    </Typography>
  )
}

export function StrategyHeader({
  strategy,
  showDescription = true,
  titleVariant = "body2",
  descriptionMaxWidth,
  onTitleClick,
}: StrategyHeaderProps) {
  const theme = useTheme()

  // Format label for historical-ag scenario (s0011)
  const displayLabel =
    strategy.scenarioId === "s0011"
      ? "Current operations with historical agricultural land use"
      : strategy.label

  return (
    <Box>
      <Typography
        variant="scenarioTitle"
        onClick={onTitleClick}
        sx={{
          maxWidth: theme.layout.maxWidth.sm,
          mb: showDescription ? theme.space.component.xs : 0,
          color: theme.palette.grey[900],
          cursor: onTitleClick ? "pointer" : "default",
        }}
      >
        {displayLabel}
        {titleVariant === "subtitle1" && " strategy"}
      </Typography>

      {showDescription && (
        <DescriptionWithGlossaryLinks
          description={strategy.description}
          maxWidth={descriptionMaxWidth}
        />
      )}
    </Box>
  )
}

export default StrategyHeader
