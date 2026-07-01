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

import React, { useState } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { ScenarioBadge } from "@repo/ui"
import type { ScenarioForDisplay } from "./types"
import {
  DescriptionWithGlossaryLinks,
  useGlossaryRenderer,
} from "./strategyGlossary"
import { THEME_LABEL_CONFIG } from "../../../../content/themes"
import type { ScenarioTheme } from "../../../../content/scenarios"
import { shouldWrapThemeBadgeLabel } from "../../utils/themeLabelWrap"

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
              background: `linear-gradient(to right, transparent, var(--row-bg, ${theme.palette.common.white}) 40%)`,
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

  /** Long row labels only: wrap inside ScenarioBadge. All other theme chips stay one line + ellipsis. */
  const themeBadgeMultiline = Boolean(
    showAllThemeBadges && themeLabel && shouldWrapThemeBadgeLabel(themeLabel),
  )

  if (compact) {
    /** Matches title line box height for first-line-only legend dot alignment */
    const compactTitleLineHeight = 1.3
    const themeBadgeButtonSx = onThemeBadgeClick
      ? {
          background: "none" as const,
          border: "none",
          padding: 0,
          cursor: "pointer" as const,
          textAlign: "left" as const,
          minWidth: 0,
          display: "inline-flex" as const,
          alignItems: themeBadgeMultiline ? "flex-start" : "center",
          flex: 1,
          flexBasis: 0,
          overflow: themeBadgeMultiline ? "visible" : "hidden",
          flexShrink: 1,
          "&:hover > span": { opacity: 0.8 },
          "&:focus-visible": {
            outline: `2px solid ${theme.palette.blue.bright}`,
            outlineOffset: "2px",
            borderRadius: "2px",
          },
        }
      : {
          minWidth: 0,
          display: "inline-flex" as const,
          alignItems: themeBadgeMultiline ? "flex-start" : "center",
          flex: 1,
          flexBasis: 0,
          overflow: themeBadgeMultiline ? "visible" : "hidden",
          flexShrink: 1,
        }
    const themeBadgeTextSx = themeBadgeMultiline
      ? { minWidth: 0, maxWidth: "100%" }
      : {
          whiteSpace: "nowrap" as const,
          overflow: "hidden",
          textOverflow: "ellipsis",
          minWidth: 0,
          flexShrink: 0,
        }

    return (
      <Box sx={{ m: 0, p: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: themeBadgeMultiline ? "flex-start" : "center",
            gap: "4px",
            mb: "1px",
            minHeight: "16px",
            minWidth: 0,
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
              flexShrink: 0,
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
              sx={themeBadgeButtonSx}
            >
              <ScenarioBadge
                label={themeLabel}
                backgroundColor={themeColors.background}
                color={themeColors.text}
                sx={themeBadgeTextSx}
              />
            </Box>
          ) : (
            strategy.theme === "baseline" && <ScenarioBadge label="Baseline" />
          )}
          {inlineActions ? (
            <Box
              sx={{
                flexShrink: 0,
                display: "inline-flex",
                alignItems: themeBadgeMultiline ? "flex-start" : "center",
                gap: 0.5,
                alignSelf: themeBadgeMultiline ? "flex-start" : undefined,
              }}
            >
              {inlineActions}
            </Box>
          ) : null}
        </Box>
        <Box
          component="span"
          onClick={onTitleClick}
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: titleStartAdornment ? "6px" : 0,
            color: theme.palette.text.primary,
            cursor: onTitleClick ? "pointer" : "default",
            fontSize: "0.8125rem",
            fontWeight: 500,
            lineHeight: compactTitleLineHeight,
            m: 0,
            p: 0,
          }}
        >
          {titleStartAdornment ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
                height: `${compactTitleLineHeight}em`,
              }}
            >
              {titleStartAdornment}
            </Box>
          ) : null}
          <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
            {displayLabel}
          </Box>
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
          alignItems: themeBadgeMultiline ? "flex-start" : "center",
          gap: "6px",
          mb: "4px",
          minHeight: "18px",
          minWidth: 0,
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
            flexShrink: 0,
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
                    textAlign: "left",
                    minWidth: 0,
                    display: "inline-flex",
                    alignItems: themeBadgeMultiline ? "flex-start" : "center",
                    flex: 1,
                    flexBasis: 0,
                    overflow: themeBadgeMultiline ? "visible" : "hidden",
                    flexShrink: 1,
                    "&:hover > span": { opacity: 0.8 },
                    "&:focus-visible": {
                      outline: `2px solid ${theme.palette.blue.bright}`,
                      outlineOffset: "2px",
                      borderRadius: "2px",
                    },
                  }
                : {
                    minWidth: 0,
                    display: "inline-flex",
                    alignItems: themeBadgeMultiline ? "flex-start" : "center",
                    flex: 1,
                    flexBasis: 0,
                    overflow: themeBadgeMultiline ? "visible" : "hidden",
                    flexShrink: 1,
                  }
            }
          >
            <ScenarioBadge
              label={themeLabel}
              backgroundColor={themeColors.background}
              color={themeColors.text}
              sx={
                themeBadgeMultiline
                  ? { minWidth: 0, maxWidth: "100%" }
                  : {
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      minWidth: 0,
                      flexShrink: 0,
                    }
              }
            />
          </Box>
        ) : (
          strategy.theme === "baseline" && <ScenarioBadge label="Baseline" />
        )}

        {inlineActions ? (
          <Box
            sx={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: themeBadgeMultiline ? "flex-start" : "center",
              gap: 0.5,
              alignSelf: themeBadgeMultiline ? "flex-start" : undefined,
            }}
          >
            {inlineActions}
          </Box>
        ) : null}
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
