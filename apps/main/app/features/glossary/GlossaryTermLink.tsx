"use client"

/**
 * GlossaryTermLink
 *
 * Wraps a word or phrase in hand-authored copy as a button that opens the
 * floating glossary drawer to a specific entry. Use this directly in JSX,
 * exactly where the term already appears - no separate config file, no
 * regex to write.
 *
 * `term` defaults to whatever text is inside the tags, so the common case
 * needs nothing else:
 *   <GlossaryTermLink>Central Valley</GlossaryTermLink>
 * Pass `term` explicitly only when the displayed text differs from the
 * glossary entry's exact name (must match a `term` in content/glossary.tsx) -
 * different casing counts as differing:
 *   <GlossaryTermLink term="CalSim">CalSim3</GlossaryTermLink>
 *
 * For text that isn't hand-authored - e.g. a scenario description string
 * that's different for every scenario and has to be scanned for whichever
 * known terms happen to appear in it - use `useGlossaryRenderer`
 * (strategyGlossary.tsx) instead. That hook solves "find any of these terms
 * in arbitrary text I don't control"; this component solves "I already know
 * exactly where the term is because I'm writing the copy myself."
 */

import React from "react"
import { Box, useTheme } from "@repo/ui/mui"
import { useDrawerStore } from "@repo/state/drawer"
import { resolveGlossaryTerm } from "../../content/glossary"

interface GlossaryTermLinkProps {
    /**
   * Canonical glossary entry to open. Defaults to `children`. Matching is
   * case-insensitive against content/glossary.tsx, so a mistyped letter
   * case still resolves correctly - only genuinely different wording
   * (e.g. "CalSim3" vs "CalSim") needs this set explicitly.
   */
    term?: string
    children: string
}

export function GlossaryTermLink({ term, children }: GlossaryTermLinkProps) {
    const theme = useTheme()
    const { setDrawerContent, openDrawer } = useDrawerStore()
    const targetTerm = resolveGlossaryTerm(term ?? children)

    const handleOpen = () => {
        setDrawerContent({ selectedTerm: targetTerm })
        openDrawer("glossary")
    }

    // WCAG 2.1.1: keyboard activation for a non-native link/button pairing
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleOpen()
        }
    }

    return (
        <Box
            component="button"
            type="button"
            onClick={handleOpen}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            aria-label={`Open glossary for ${targetTerm}`}
            sx={{
                color: "inherit",
                cursor: "pointer",
                background: "none",
                border: "none",
                padding: 0,
                font: "inherit",
                // Spread after `font: inherit` - that shorthand resets font-weight,
                // so the bold from this variant has to come after it to survive.
                ...theme.typography.glossaryTerm,
                "&:hover": {
                    opacity: 0.7,
                },
                "&:focus-visible": {
                    outline: `2px solid ${theme.palette.blue.bright}`,
                    outlineOffset: "2px",
                    borderRadius: "2px",
                },
            }}
        >
            {children}
        </Box>
    )
}
