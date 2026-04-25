"use client"

/**
 * Shared section primitive for the "How to read this chart" modal bodies.
 *
 * Two layout modes:
 *
 * 1. single (default when no number/eyebrow) - legacy layout. Title sits
 *    above the body in a single column. Preserves the original shape so
 *    existing consumers keep rendering as they did.
 *
 * 2. split (opt-in via `number` or `eyebrow`) - neo-Swiss two-column
 *    layout. A narrow left gutter holds the tabular section number and
 *    an uppercase overline eyebrow stacked above the action-oriented
 *    section title. The wide right column holds the body copy and, if
 *    supplied, a figure rendered below the children.
 *
 * A thin hairline divider sits above the section by default. Pass
 * `divider={false}` on the first section of a modal to suppress it.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"

interface SectionProps {
  title: string
  children: React.ReactNode
  /** Tabular section number, e.g. "01". Enables split layout. */
  number?: string
  /** Uppercase eyebrow label, e.g. "THE CHART". Enables split layout. */
  eyebrow?: string
  /** Optional figure/illustration. Rendered after children in the body column. */
  figure?: React.ReactNode
  /** Force layout mode. Defaults to "split" when number or eyebrow is set, else "single". */
  layout?: "single" | "split"
  /** Render a hairline divider above this section. Defaults to true. */
  divider?: boolean
  /** Let the body column use the full available width instead of article measure. */
  breakout?: boolean
  /** Render the figure before the copy. */
  figurePosition?: "before" | "after"
}

export function Section({
  title,
  children,
  number,
  eyebrow,
  figure,
  layout,
  divider = true,
  breakout = false,
  figurePosition = "after",
}: SectionProps) {
  const theme = useTheme()
  const resolvedLayout = layout ?? (number || eyebrow ? "split" : "single")

  const bodyTextStyles = {
    color: theme.palette.text.primary,
    "& p": { m: 0, mb: theme.space.component.sm },
    "& p:last-child": { mb: 0 },
    "& ul": {
      m: 0,
      mb: theme.space.component.sm,
      pl: theme.space.component.lg,
    },
    "& ul:last-child": { mb: 0 },
    "& li": { mb: theme.space.component.xs },
    "& li:last-child": { mb: 0 },
    "& strong": { fontWeight: 600 },
  } as const

  if (resolvedLayout === "single") {
    return (
      <Box
        sx={{
          mb: theme.space.component.lg,
          ...(divider
            ? {
                pt: theme.space.component.lg,
                borderTop: `1px solid ${theme.palette.divider}`,
                "&:first-of-type": {
                  pt: 0,
                  borderTop: "none",
                },
              }
            : {}),
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            mb: theme.space.component.xs,
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          {title}
        </Typography>
        <Box sx={bodyTextStyles}>{children}</Box>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: "grid",
        gap: { xs: theme.space.component.md, md: theme.space.component.xl },
        gridTemplateColumns: {
          xs: "1fr",
          md: breakout ? "220px minmax(0, 1fr)" : "220px minmax(0, 680px)",
        },
        py: theme.space.section.sm,
        ...(divider
          ? {
              borderTop: `1px solid ${theme.palette.divider}`,
              "&:first-of-type": {
                borderTop: "none",
                pt: theme.space.component.md,
              },
            }
          : {}),
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: theme.space.component.xs,
        }}
      >
        {number ? (
          <Typography
            variant="smallSectionLabel"
            sx={{
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.08em",
              color: theme.palette.grey[700],
              lineHeight: 1,
            }}
          >
            {number}
          </Typography>
        ) : null}
        {eyebrow ? (
          <Typography
            variant="overline"
            sx={{
              letterSpacing: "0.1em",
              color: theme.palette.grey[700],
              lineHeight: 1.2,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </Typography>
        ) : null}
        <Typography
          variant="h6"
          sx={{
            mt: theme.space.component.xs,
            fontWeight: 600,
            color: theme.palette.text.primary,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: theme.space.component.lg,
          minWidth: 0,
        }}
      >
        {figure && figurePosition === "before" ? <Box>{figure}</Box> : null}
        <Box sx={bodyTextStyles}>{children}</Box>
        {figure && figurePosition === "after" ? <Box>{figure}</Box> : null}
      </Box>
    </Box>
  )
}

/**
 * Container that locks the how-to-read body to a flush-left column with a
 * civilized measure. Wrap the Section list of any modal body with this to
 * get the neo-Swiss layout framing for free.
 */
export function HowToReadBody({ children }: { children: React.ReactNode }) {
  const theme = useTheme()
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1080,
        mx: "auto",
        px: { xs: 0, md: theme.space.component.sm },
        color: theme.palette.text.primary,
        display: "flex",
        flexDirection: "column",
        gap: theme.space.section.md,
      }}
    >
      {children}
    </Box>
  )
}

export default Section
