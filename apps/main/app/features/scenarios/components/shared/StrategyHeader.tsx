"use client"

/**
 * StrategyHeader - Strategy title and description (with glossary links)
 *
 * Shared component for rendering strategy information.
 * Used by both Learn mode (StrategyInfoPanel) and Explore mode (StrategyGrid).
 *
 * Handles clickable glossary links for terms like TUCP and SGMA
 * that open the glossary when mentioned in the strategy description.
 */

import React, { useState, useRef, useEffect } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useDrawerStore } from "@repo/state/drawer"
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
 * Uses a float-based technique to place "… show more" at the end of line 3:
 * 1. A floated spacer reserves room at bottom-right for the toggle
 * 2. The toggle is positioned absolutely over that reserved space
 * 3. CSS line-clamp handles the actual truncation
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
  const [isTruncated, setIsTruncated] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)

  // Check if text is truncated (exceeds 3 lines)
  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        const lineHeight = parseFloat(getComputedStyle(textRef.current).lineHeight)
        const maxHeight = lineHeight * 3 // 3 lines
        setIsTruncated(textRef.current.scrollHeight > maxHeight + 2) // +2 for rounding
      }
    }
    checkTruncation()
    window.addEventListener("resize", checkTruncation)
    return () => window.removeEventListener("resize", checkTruncation)
  }, [description])

  // Handle glossary term click - opens glossary to specific entry
  const handleGlossaryClick = (glossaryTerm: string) => (e: React.MouseEvent) => {
    e.stopPropagation()
    setDrawerContent({ selectedTerm: glossaryTerm })
    openDrawer("glossary")
  }

  // Styled component for glossary link
  const GlossaryLink = ({ text, glossaryTerm }: { text: string; glossaryTerm: string }) => (
    <Box
      component="span"
      onClick={handleGlossaryClick(glossaryTerm)}
      sx={{
        color: theme.palette.blue.bright,
        borderBottom: `2px solid ${theme.palette.blue.bright}`,
        cursor: "pointer",
        "&:hover": {
          borderBottomWidth: "3px",
        },
      }}
    >
      {text}
    </Box>
  )

  // Render text with glossary terms as clickable links
  const renderTextWithGlossaryLinks = () => {
    // Build combined regex pattern for all glossary terms
    const combinedPattern = new RegExp(
      `(${GLOSSARY_TERMS.map((t) => t.pattern.source).join("|")})`,
      "g"
    )

    return description.split(combinedPattern).map((part, index) => {
      // Check if this part matches any glossary term
      for (const term of GLOSSARY_TERMS) {
        if (new RegExp(`^${term.pattern.source}$`).test(part)) {
          return (
            <GlossaryLink key={index} text={part} glossaryTerm={term.glossaryTerm} />
          )
        }
      }
      return part
    })
  }

  const toggleStyles = {
    color: theme.palette.blue.bright,
    fontStyle: "italic",
    cursor: "pointer",
    userSelect: "none" as const,
    "&:hover": {
      textDecoration: "underline",
    },
  }

  // Width of "… show more" text plus small buffer
  const toggleWidth = "85px"

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
      <Box
        ref={textRef}
        sx={{
          display: "-webkit-box",
          WebkitLineClamp: isExpanded ? "unset" : 3,
          WebkitBoxOrient: "vertical",
          overflow: isExpanded ? "visible" : "hidden",
        }}
      >
        {/* Floated spacer that reserves space at end of line 3 for toggle */}
        {!isExpanded && isTruncated && (
          <Box
            component="span"
            sx={{
              float: "right",
              width: toggleWidth,
              height: "1.6em", // One line height
              // Push down to line 3 by using shape-margin approach
              shapeOutside: `inset(calc(1.6em * 2) 0 0 0)`,
            }}
          />
        )}
        {renderTextWithGlossaryLinks()}
      </Box>
      {isTruncated && (
        <Box
          component="span"
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          sx={{
            ...toggleStyles,
            // When collapsed, position at bottom right over the floated spacer
            ...(isExpanded
              ? {}
              : {
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  backgroundColor: "#faf8f5",
                  paddingLeft: "4px",
                }),
          }}
        >
          {isExpanded ? "show less" : "… show more"}
        </Box>
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
