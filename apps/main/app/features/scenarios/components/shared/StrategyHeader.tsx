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
 * Uses react-truncate-markup for word-boundary-aware truncation with
 * inline "show more" toggle.
 */

import React, { useState, useCallback } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useDrawerStore } from "@repo/state/drawer"
import TruncateMarkup from "react-truncate-markup"
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
 * Uses react-truncate-markup for word-boundary-aware truncation with inline
 * "… show more" toggle that appears at the end of the last visible line.
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
    [setDrawerContent, openDrawer]
  )

  // Toggle styles for show more/less
  const toggleStyles = {
    color: theme.palette.blue.bright,
    fontStyle: "italic",
    cursor: "pointer",
    userSelect: "none" as const,
    "&:hover": {
      textDecoration: "underline",
    },
  }

  // Build text content with glossary links as React nodes
  // Plain text segments are returned as strings (not spans) so react-truncate-markup
  // can properly tokenize them by words. Only glossary links are wrapped in elements.
  const renderTextWithGlossaryLinks = useCallback(() => {
    // Build combined regex pattern for all glossary terms
    // Capture trailing punctuation in a separate group so it stays adjacent
    const combinedPattern = new RegExp(
      `(${GLOSSARY_TERMS.map((t) => t.pattern.source).join("|")})([.,;:!?]?)`,
      "g"
    )

    const result: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = combinedPattern.exec(description)) !== null) {
      // Add text before the match as a plain string (not wrapped in span)
      // This allows react-truncate-markup to tokenize it by words
      if (match.index > lastIndex) {
        result.push(description.slice(lastIndex, match.index))
      }

      const matchedTerm = match[1] ?? ""
      const trailingPunct = match[2] ?? ""

      // Find which glossary term this matches
      for (const term of GLOSSARY_TERMS) {
        if (matchedTerm && new RegExp(`^${term.pattern.source}$`).test(matchedTerm)) {
          // Wrap glossary link + punctuation in TruncateMarkup.Atom so they're not split
          result.push(
            <TruncateMarkup.Atom key={`link-${match.index}`}>
              <Box
                component="span"
                onClick={handleGlossaryClick(term.glossaryTerm)}
                sx={{
                  color: theme.palette.blue.bright,
                  borderBottom: `2px solid ${theme.palette.blue.bright}`,
                  cursor: "pointer",
                  "&:hover": {
                    borderBottomWidth: "3px",
                  },
                }}
              >
                {matchedTerm}
              </Box>
              {trailingPunct}
            </TruncateMarkup.Atom>
          )
          break
        }
      }

      lastIndex = match.index + match[0].length
    }

    // Add any remaining text after the last match as plain string
    if (lastIndex < description.length) {
      result.push(description.slice(lastIndex))
    }

    return result
  }, [description, handleGlossaryClick, theme.palette.blue.bright])

  // Custom ellipsis with inline "show more" toggle
  // The ellipsis (…) is separate from the clickable "show more" link
  const showMoreEllipsis = (
    <span>
      {"… "}
      <Box
        component="span"
        onClick={(e) => {
          e.stopPropagation()
          setIsExpanded(true)
        }}
        sx={toggleStyles}
      >
        show more
      </Box>
    </span>
  )

  return (
    <Typography
      component="div"
      variant="dashboard"
      sx={{
        color: theme.palette.grey[600],
        maxWidth: maxWidth ?? theme.layout.maxWidth.md,
        lineHeight: 1.6,
      }}
    >
      {isExpanded ? (
        // Expanded view - show full text with "show less" at end
        <>
          {renderTextWithGlossaryLinks()}{" "}
          <Box
            component="span"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(false)
            }}
            sx={toggleStyles}
          >
            show less
          </Box>
        </>
      ) : (
        // Truncated view - use react-truncate-markup for word-aware truncation
        <TruncateMarkup
          lines={3}
          ellipsis={showMoreEllipsis}
          tokenize="words"
        >
          <div>{renderTextWithGlossaryLinks()}</div>
        </TruncateMarkup>
      )}
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
