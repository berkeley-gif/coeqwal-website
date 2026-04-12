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
import { ScenarioBadge } from "@repo/ui"
import { useDrawerStore } from "@repo/state/drawer"
import { motion } from "@repo/motion"
// CSS line-clamp is used instead of @re-dev/react-truncate so that
// truncated text reflows automatically when the grid column resizes.
import type { ScenarioForDisplay } from "./types"
import { THEME_LABEL_CONFIG } from "../../../../content/themes"
import type { ScenarioTheme } from "../../../../content/scenarios"

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
  /** Whether to show the theme badge (defaults to true) */
  showThemeBadge?: boolean
  /** Called when the theme badge is clicked.selects all scenarios of that theme */
  onThemeBadgeClick?: (theme: ScenarioTheme) => void
  /** Optional inline actions rendered at the end of the shortcode/badge row */
  inlineActions?: React.ReactNode
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
  {
    pattern: /\bDelta Conveyance Project\b/g,
    glossaryTerm: "Delta Conveyance Project",
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
  // Using blue.medium for WCAG AA contrast compliance (~4.5:1 vs bright's ~3:1)
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

      {/* Truncated view — height-clipped with "… more" overlay at bottom-right */}
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

export function StrategyHeader({
  strategy,
  showDescription = true,
  titleVariant = "body2",
  descriptionMaxWidth,
  showThemeBadge = true,
  onTitleClick,
  onThemeBadgeClick,
  inlineActions,
}: StrategyHeaderProps) {
  const theme = useTheme()
  const showAllThemeBadges = showThemeBadge
  const themeLabel = strategy.theme
    ? THEME_LABEL_CONFIG[strategy.theme]?.label
    : undefined
  const themeColors = strategy.theme
    ? theme.palette.waterThemes[strategy.theme]
    : undefined

  // Format label for historical-ag scenario (s0011)
  const displayLabel =
    strategy.scenarioId === "s0011"
      ? "Current operations with historical agricultural land use"
      : strategy.label

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          mb: "4px",
          minHeight: "18px",
        }}
      >
        <Typography
          component="span"
          variant="overline"
          sx={{
            color: theme.palette.grey[600],
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontSize: "0.6875rem",
            lineHeight: 1,
          }}
        >
          {strategy.scenarioId.toUpperCase()}
        </Typography>

        {showAllThemeBadges && themeLabel && themeColors ? (
          <Box
            component={onThemeBadgeClick ? "button" : "span"}
            type={onThemeBadgeClick ? "button" : undefined}
            onClick={
              onThemeBadgeClick && strategy.theme
                ? (e: React.MouseEvent) => {
                    e.stopPropagation()
                    onThemeBadgeClick(strategy.theme as ScenarioTheme)
                  }
                : undefined
            }
            sx={
              onThemeBadgeClick
                ? {
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "inline-flex",
                    "&:hover > span": { opacity: 0.8 },
                    "&:focus-visible": {
                      outline: `2px solid ${theme.palette.blue.bright}`,
                      outlineOffset: "2px",
                      borderRadius: "2px",
                    },
                  }
                : { display: "inline-flex" }
            }
          >
            <ScenarioBadge
              label={themeLabel}
              backgroundColor={themeColors.background}
              color={themeColors.text}
            />
          </Box>
        ) : (
          strategy.theme === "baseline" && <ScenarioBadge label="Baseline" />
        )}

        {inlineActions}
      </Box>
      <Typography
        variant="scenarioTitle"
        onClick={onTitleClick}
        sx={{
          mb: showDescription ? theme.space.component.xs : 0,
          color: theme.palette.text.primary,
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
