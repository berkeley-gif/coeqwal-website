"use client"

import { Box, Typography, useTheme, Divider, Stack, IconButton, CloseIcon } from "@repo/ui/mui"
import { glossaryTerms } from "../../lib/glossary"
import React, { useRef, useEffect, useState } from "react"

interface FloatingGlossaryPanelProps {
  isOpen: boolean
  onClose: () => void
  selectedTerm?: string
}

/**
 * Pop-up panel that displays glossary content
 * Anchored to the bottom-right button, taking up 1/3 of the viewport width
 */
export function FloatingGlossaryPanel({
  isOpen,
  onClose,
  selectedTerm,
}: FloatingGlossaryPanelProps) {
  const theme = useTheme()
  const termRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [internalSelectedTerm, setInternalSelectedTerm] = useState<string | undefined>(
    selectedTerm
  )

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

  // Function to handle clicking on a term link within the glossary
  const handleTermClick = (termName: string) => {
    setInternalSelectedTerm(termName)
    if (termRefs.current[termName]) {
      termRefs.current[termName]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  // Function to render definition text with clickable term links
  const renderDefinition = (definition: string) => {
    // Find all terms that appear in this definition (case-insensitive)
    const termsInText = glossaryTerms.filter((term) =>
      definition.toLowerCase().includes(term.term.toLowerCase())
    )

    if (termsInText.length === 0) {
      return <Typography variant="body2">{definition}</Typography>
    }

    // Create regex to match all terms
    const termPattern = termsInText
      .map((term) => term.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")
    const regex = new RegExp(`(${termPattern})`, "gi")

    // Split text by terms and create clickable links
    const parts = definition.split(regex)

    return (
      <Typography variant="body2" component="div">
        {parts.map((part, index) => {
          const matchedTerm = termsInText.find(
            (term) => term.term.toLowerCase() === part.toLowerCase()
          )
          if (matchedTerm) {
            return (
              <Box
                key={index}
                component="span"
                onClick={() => handleTermClick(matchedTerm.term)}
                sx={{
                  color: theme.palette.blue.bright,
                  textDecoration: "underline",
                  cursor: "pointer",
                  "&:hover": {
                    color: theme.palette.blue.darkest,
                  },
                }}
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

  return (
    <>
      {/* Backdrop */}
      <Box
        onClick={onClose}
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: theme.zIndex.drawer - 2,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Panel anchored to bottom-right corner near button */}
      <Box
        sx={{
          position: "fixed",
          bottom: 108, // Just above the button (32px button position + 64px button height + 12px gap)
          right: 32, // Aligned with button
          width: "33.333vw", // 1/3 of viewport width
          minWidth: "400px",
          maxWidth: "600px",
          maxHeight: "70vh", // Don't take up full height
          backgroundColor: "#fff",
          borderRadius: theme.borderRadius.card,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          transform: isOpen ? "scale(1)" : "scale(0.9)",
          opacity: isOpen ? 1 : 0,
          transformOrigin: "bottom right", // Anchor animation to bottom-right
          transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)", // Bouncy easing
          pointerEvents: isOpen ? "auto" : "none",
          zIndex: theme.zIndex.drawer - 1,
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
            padding: 3,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}
        >
          <Typography variant="h5" fontWeight={600}>
            Glossary
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            padding: 3,
          }}
        >
          <Stack spacing={2}>
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
                          backgroundColor: "rgba(33, 150, 243, 0.08)",
                          padding: 2,
                          borderRadius: theme.borderRadius.card,
                          border: `2px solid ${theme.palette.blue.bright}`,
                          transition: "all 0.3s ease",
                        }
                      : {
                          padding: 2,
                        }
                  }
                >
                  {/* Term header with icon */}
                  <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1, gap: 1 }}>
                    <Box
                      sx={{
                        color: theme.palette.blue.bright,
                        mt: 0.5,
                        flexShrink: 0,
                      }}
                    >
                      {term.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      fontWeight={600}
                      sx={{
                        color: theme.palette.blue.darkest,
                      }}
                    >
                      {term.term}
                    </Typography>
                  </Box>

                  {/* Definition */}
                  <Box sx={{ ml: 4 }}>{renderDefinition(term.definition)}</Box>

                  {/* Tiers (if applicable) */}
                  {term.tiers && term.tiers.length > 0 && (
                    <Box sx={{ ml: 4, mt: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                        Tiers:
                      </Typography>
                      <Stack spacing={1}>
                        {term.tiers.map((tier, tierIndex) => (
                          <Box key={tierIndex} sx={{ display: "flex", gap: 1 }}>
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: "50%",
                                backgroundColor: tier.color,
                                flexShrink: 0,
                                mt: 0.5,
                              }}
                            />
                            <Typography variant="body2">
                              <strong>{tier.tier}:</strong> {tier.description}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* See Also */}
                  {term.seeAlso && (
                    <Box sx={{ ml: 4, mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <em>See also: </em>
                        <Box
                          component="span"
                          onClick={() => handleTermClick(term.seeAlso!)}
                          sx={{
                            color: theme.palette.blue.bright,
                            textDecoration: "underline",
                            cursor: "pointer",
                            "&:hover": {
                              color: theme.palette.blue.darkest,
                            },
                          }}
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

