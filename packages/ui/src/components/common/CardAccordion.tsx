"use client"

import React, { useState } from "react"
import { Box, Typography, Collapse, IconButton } from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"

export interface CardAccordionSection {
  id: string
  title: string
  content: React.ReactNode
  defaultExpanded?: boolean
}

export interface CardAccordionProps {
  sections: CardAccordionSection[]
  /** Allow multiple sections to be expanded at once */
  allowMultiple?: boolean
  /** Custom styling */
  sx?: object
}

/**
 * Accordion component designed for use within cards
 *
 * Features:
 * - Expandable/collapsible sections with smooth transitions
 * - Single or multiple expansion modes
 * - Consistent styling with card design system
 * - Accessible keyboard navigation
 * - Uses theme typography mixins
 */
export function CardAccordion({
  sections,
  allowMultiple = true,
  sx = {},
}: CardAccordionProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(
      sections
        .filter((section) => section.defaultExpanded)
        .map((section) => section.id),
    ),
  )

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newExpanded = new Set(prev)

      if (newExpanded.has(sectionId)) {
        // Collapse this section
        newExpanded.delete(sectionId)
      } else {
        // Expand this section
        if (!allowMultiple) {
          // If single mode, collapse all others first
          newExpanded.clear()
        }
        newExpanded.add(sectionId)
      }

      return newExpanded
    })
  }

  return (
    <Box sx={sx}>
      {sections.map((section, index) => {
        const isExpanded = expandedSections.has(section.id)
        const isLast = index === sections.length - 1

        return (
          <Box key={section.id}>
            {/* Section Header */}
            <Box
              onClick={() => toggleSection(section.id)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                py: 2,
                px: 3, // Hack: add horizontal padding to extend hover area
                mx: -3, // Hack: negative margin to extend to card edges
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.interaction.hoverBackground,
                  borderRadius: (theme) => theme.borderRadius.rounded,
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: (theme) => theme.palette.blue.darkest,
                  fontWeight: 500,
                  fontSize: "1.1rem",
                }}
              >
                {section.title}
              </Typography>
              <IconButton
                size="small"
                sx={{
                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                  color: (theme) => theme.palette.blue.medium,
                }}
              >
                <ExpandMoreIcon />
              </IconButton>
            </Box>

            {/* Section Content */}
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ pb: 2 }}>{section.content}</Box>
            </Collapse>

            {/* Divider (except for last item) */}
            {!isLast && (
              <Box
                sx={{
                  borderBottom: "1px solid",
                  borderColor: (theme) => theme.palette.grey[200],
                  mx: -3, // Extend to card edges
                }}
              />
            )}
          </Box>
        )
      })}
    </Box>
  )
}

export default CardAccordion
