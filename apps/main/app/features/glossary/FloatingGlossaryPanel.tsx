"use client"

/**
 * FloatingGlossaryPanel - Floating glossary sidebar
 *
 * Displays searchable glossary terms with definitions.
 * Opens as a floating panel from the glossary button.
 */

import {
  Box,
  Typography,
  useTheme,
  Divider,
  Stack,
  IconButton,
  CloseIcon,
  alpha,
} from "@repo/ui/mui"
import { glossaryTerms } from "../../content/glossary"
import React, { useRef, useEffect, useState, useCallback } from "react"

interface Position {
  bottom: number
  right: number
}

interface FloatingGlossaryPanelProps {
  isOpen: boolean
  onClose: () => void
  onOpen: () => void
  selectedTerm?: string
  position: Position
  isOnLeftHalf: boolean
}

/**
 * Pop-up panel that displays glossary content
 * Anchored to the button position, taking up 1/3 of the viewport width
 * Positions itself left or right based on button position
 */
export function FloatingGlossaryPanel({
  isOpen,
  onClose,
  onOpen,
  selectedTerm,
  position,
  isOnLeftHalf,
}: FloatingGlossaryPanelProps) {
  const theme = useTheme()
  const termRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const contentRef = useRef<HTMLDivElement>(null)
  const [internalSelectedTerm, setInternalSelectedTerm] = useState<
    string | undefined
  >(selectedTerm)

  // Update internal state when external selectedTerm changes
  useEffect(() => {
    setInternalSelectedTerm(selectedTerm)
  }, [selectedTerm])

  // Scroll to selected term when it changes
  useEffect(() => {
    if (internalSelectedTerm && termRefs.current[internalSelectedTerm]) {
      setTimeout(() => {
        termRefs.current[internalSelectedTerm]?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }, 300) // Delay to allow panel animation to complete
    }
  }, [internalSelectedTerm])

  // WCAG 2.1.1: Handle Escape key to close panel
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    },
    [isOpen, onClose],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // WCAG 2.4.3: Focus content area when panel opens for keyboard scrolling
  useEffect(() => {
    if (isOpen && contentRef.current) {
      // Small delay to allow animation to start
      setTimeout(() => {
        contentRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Function to handle clicking on a term link within the glossary
  const handleTermClick = (termName: string) => {
    // Open the panel if it's not already open
    if (!isOpen) {
      onOpen()
    }

    setInternalSelectedTerm(termName)

    // Scroll to the term (with delay if panel is opening)
    setTimeout(
      () => {
        if (termRefs.current[termName]) {
          termRefs.current[termName]?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }
      },
      isOpen ? 0 : 300,
    ) // Delay if opening, immediate if already open
  }

  // WCAG 2.1.1: Handle keyboard activation for term links
  const handleTermKeyDown = (termName: string) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleTermClick(termName)
    }
  }

  // Shared styles for clickable term links
  const termLinkStyle = {
    color: theme.palette.blue.bright,
    textDecoration: "underline",
    cursor: "pointer",
    // Make focusable
    display: "inline",
    background: "none",
    border: "none",
    padding: 0,
    font: "inherit",
    "&:hover": {
      color: theme.palette.blue.darkest,
    },
    // WCAG 2.4.7: Focus visible styles
    "&:focus-visible": {
      outline: `2px solid ${theme.palette.blue.bright}`,
      outlineOffset: "2px",
      borderRadius: "2px",
    },
  } as const

  // Render helpers
  const renderDefinition = (definition: string) => {
    // Find all terms that appear in this definition (case-insensitive)
    const termsInText = glossaryTerms.filter((term) =>
      definition.toLowerCase().includes(term.term.toLowerCase()),
    )

    if (termsInText.length === 0) {
      return <Typography variant="storyBody">{definition}</Typography>
    }

    // Regex to match all terms
    const termPattern = termsInText
      .map((term) => term.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")
    const regex = new RegExp(`(${termPattern})`, "gi")

    // Split text by terms and create clickable links
    const parts = definition.split(regex)

    return (
      <Typography variant="storyBody" component="div">
        {parts.map((part, index) => {
          const matchedTerm = termsInText.find(
            (term) => term.term.toLowerCase() === part.toLowerCase(),
          )
          if (matchedTerm) {
            return (
              <Box
                key={index}
                component="button"
                type="button"
                onClick={() => handleTermClick(matchedTerm.term)}
                onKeyDown={handleTermKeyDown(matchedTerm.term)}
                tabIndex={isOpen ? 0 : -1}
                aria-label={`Go to ${matchedTerm.term} definition`}
                sx={termLinkStyle}
              >
                {part}
              </Box>
            )
          }
          return <span key={index}>{part}</span>
        })}
      </Typography>
    )
  }

  const glossaryTitleId = "glossary-panel-title"

  return (
    <>
      {/* WCAG 4.1.2: Panel with dialog role and proper ARIA attributes */}
      {/* Note: aria-hidden removed as it's prohibited on dialog roles with focusable content */}
      <Box
        role="dialog"
        aria-modal="false"
        aria-labelledby={glossaryTitleId}
        sx={{
          position: "fixed",
          bottom: position.bottom + 76, // Just above the button (64px button height + 12px gap)
          // Position based on which half of screen the button is on
          ...(isOnLeftHalf
            ? {
                // Button on left, then panel appears to the right
                left:
                  typeof window !== "undefined"
                    ? window.innerWidth - position.right
                    : position.right,
              }
            : {
                // Button on right, then panel appears to the left
                right: position.right,
              }),
          width: "33.333vw", // 1/3 of viewport width
          minWidth: "400px",
          maxWidth: theme.layout.maxWidth.lg,
          maxHeight: "70vh", // Don't take up full height
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.borderRadius.md,
          boxShadow: theme.shadow.lg,
          transform: isOpen ? "scale(1)" : "scale(0.9)",
          opacity: isOpen ? 1 : 0,
          // Transform origin changes based on position
          transformOrigin: isOnLeftHalf ? "bottom left" : "bottom right",
          transition: theme.transition.bouncy,
          pointerEvents: isOpen ? "auto" : "none",
          zIndex: theme.zIndex.floating,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden", // Clip content to border radius
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: theme.space.section.sm,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}
        >
          <Typography id={glossaryTitleId} variant="h6" component="h2">
            Glossary
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Close glossary"
            tabIndex={isOpen ? 0 : -1}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content - WCAG 2.1.1: Scrollable region is focusable for keyboard scrolling */}
        <Box
          ref={contentRef}
          tabIndex={isOpen ? 0 : -1}
          role="region"
          aria-label="Glossary terms"
          sx={{
            flex: 1,
            overflowY: "auto",
            padding: theme.space.section.sm,
            // WCAG 2.4.7: Focus visible styles for scrollable region
            "&:focus-visible": {
              outline: `2px solid ${theme.palette.blue.bright}`,
              outlineOffset: "-2px",
            },
          }}
        >
          <Stack spacing={theme.space.gap.lg}>
            {glossaryTerms.map((term, index) => (
              <React.Fragment key={index}>
                <Box
                  ref={(el) => {
                    termRefs.current[term.term] = el as HTMLDivElement | null
                  }}
                  sx={
                    internalSelectedTerm === term.term
                      ? {
                          scrollMarginTop: "20px",
                          backgroundColor: alpha(
                            theme.palette.blue.bright,
                            0.08,
                          ),
                          padding: theme.space.component.lg,
                          borderRadius: theme.borderRadius.md,
                          border: theme.border.active,
                          transition: theme.transition.default,
                        }
                      : {
                          padding: theme.space.component.lg,
                        }
                  }
                >
                  {/* Term header with icon */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      // Tighter spacing between header and definition
                      mb: theme.space.component.xs,
                      gap: theme.space.gap.sm,
                      ml: -1, // intentional offset for icon alignment
                    }}
                  >
                    <Box
                      sx={{
                        color: theme.palette.blue.bright,
                        mt: -0.25,
                        flexShrink: 0,
                        fontSize: "2rem",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {term.icon}
                    </Box>
                    <Typography
                      variant="body1Medium"
                      component="h3"
                      color="blue.darkest"
                    >
                      {term.term}
                    </Typography>
                  </Box>

                  {/* Definition */}
                  <Box sx={{ ml: theme.space.section.md }}>
                    {renderDefinition(term.definition)}
                  </Box>

                  {/* Tiers (if applicable) */}
                  {term.tiers && term.tiers.length > 0 && (
                    <Box
                      sx={{
                        ml: theme.space.section.md,
                        mt: theme.space.component.lg,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight="semibold"
                        sx={{ mb: theme.space.component.sm }}
                      >
                        Tiers:
                      </Typography>
                      <Stack spacing={1}>
                        {term.tiers.map((tier, tierIndex) => (
                          <Box
                            key={tierIndex}
                            sx={{ display: "flex", gap: theme.space.gap.sm }}
                          >
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: theme.borderRadius.circle,
                                backgroundColor: tier.color,
                                flexShrink: 0,
                                mt: 0.5,
                              }}
                            />
                            <Typography variant="storyBody">
                              <strong>{tier.tier}:</strong> {tier.description}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* See also */}
                  {term.seeAlso && (
                    <Box
                      sx={{
                        ml: theme.space.section.md,
                        mt: theme.space.component.lg,
                      }}
                    >
                      <Typography variant="storyBody" color="text.secondary">
                        <em>See also: </em>
                        <Box
                          component="button"
                          type="button"
                          onClick={() => handleTermClick(term.seeAlso!)}
                          onKeyDown={handleTermKeyDown(term.seeAlso!)}
                          tabIndex={isOpen ? 0 : -1}
                          aria-label={`Go to ${term.seeAlso} definition`}
                          sx={termLinkStyle}
                        >
                          {term.seeAlso}
                        </Box>
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Divider between terms */}
                {index < glossaryTerms.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Stack>
        </Box>
      </Box>
    </>
  )
}
