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
  /** When true, shows the full description without more/less truncation */
  disableTruncation?: boolean
  /** Tighter spacing: smaller badge row, less margins, CSS line-clamp for description */
  compact?: boolean
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
  /** When true, force-expand a truncated compact description */
  expandDescription?: boolean
  /** Optional adornment rendered before the title text (e.g. a legend dot) */
  titleStartAdornment?: React.ReactNode
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

function useGlossaryRenderer(description: string) {
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
      "&:hover": { borderBottomWidth: "3px" },
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
      `(${GLOSSARY_TERMS.map((t) => t.pattern.source).join("|")})([.,;:!?]?)`,
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
  }, [description, handleClick, handleKeyDown, linkStyles])
}

function CompactDescription({
  description,
  forceExpanded = false,
}: {
  description: string
  forceExpanded?: boolean
}) {
  const theme = useTheme()
  const [expanded, setExpanded] = useState(false)
  const renderGlossaryText = useGlossaryRenderer(description)

  const toggleStyles = {
    color: theme.palette.blue.medium,
    fontStyle: "italic",
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: 0,
    font: "inherit",
    fontSize: "0.75rem",
    "&:hover": { textDecoration: "underline" },
  }

  return (
    <Box
      sx={{
        color: theme.palette.grey[600],
        fontSize: "0.75rem",
        lineHeight: 1.35,
        mt: "1px",
        pb: 0.5,
        position: "relative",
      }}
    >
      {expanded || forceExpanded ? (
        <>
          {renderGlossaryText()}
          {!forceExpanded && (
            <Box
              component="button"
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(false)
              }}
              sx={{ ...toggleStyles, float: "right" }}
            >
              less
            </Box>
          )}
        </>
      ) : (
        <Box sx={{ position: "relative" }}>
          <Box sx={{ maxHeight: "2.7em", overflow: "hidden" }}>
            {renderGlossaryText()}
          </Box>
          <Box
            component="button"
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(true)
            }}
            sx={{
              ...toggleStyles,
              position: "absolute",
              bottom: 0,
              right: 0,
              pl: 3,
              background:
                "linear-gradient(to right, transparent, var(--row-bg, #fff) 40%)",
            }}
          >
            … more
          </Box>
        </Box>
      )}
    </Box>
  )
}

export function StrategyHeader({
  strategy,
  showDescription = true,
  disableTruncation = false,
  compact = false,
  titleVariant = "body2",
  descriptionMaxWidth,
  showThemeBadge = true,
  onTitleClick,
  onThemeBadgeClick,
  inlineActions,
  expandDescription = false,
  titleStartAdornment,
}: StrategyHeaderProps) {
  const theme = useTheme()
  const showAllThemeBadges = showThemeBadge
  const themeLabel = strategy.theme
    ? THEME_LABEL_CONFIG[strategy.theme]?.label
    : undefined
  const themeColors = strategy.theme
    ? theme.palette.waterThemes[strategy.theme]
    : undefined

  const displayLabel =
    strategy.scenarioId === "s0011"
      ? "Current operations with historical agricultural land use"
      : strategy.label

  if (compact) {
    return (
      <Box sx={{ m: 0, p: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            mb: "1px",
            minHeight: "16px",
          }}
        >
          <Typography
            component="span"
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
          {inlineActions}
        </Box>
        <Box
          component="span"
          onClick={onTitleClick}
          sx={{
            display: "flex",
            alignItems: "baseline",
            gap: titleStartAdornment ? "6px" : 0,
            color: theme.palette.text.primary,
            cursor: onTitleClick ? "pointer" : "default",
            fontSize: "0.8125rem",
            fontWeight: 500,
            lineHeight: 1.3,
            m: 0,
            p: 0,
          }}
        >
          {titleStartAdornment}
          {displayLabel}
        </Box>
        {showDescription && (
          <CompactDescription
            description={strategy.description}
            forceExpanded={expandDescription}
          />
        )}
      </Box>
    )
  }

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
          disableTruncation={disableTruncation}
        />
      )}
    </Box>
  )
}

export default StrategyHeader
