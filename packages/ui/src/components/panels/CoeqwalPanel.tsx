"use client"

/**
 * CoeqwalPanel — standardised content section
 *
 * Provides consistent layout, typography and spacing:
 *
 *   - optional overline eyebrow
 *   - h5 headline
 *   - body1 paragraph(s)
 *   - optional CTA slot
 *   - optional children slot (for card grids, etc.)
 *
 * layout="single"  — everything stacked left-aligned in one column
 * layout="split"   — headline spans full width; description sits in the
 *                    right half only
 */

import React from "react"
import { Box, Typography, useTheme } from "@mui/material"
import { motion } from "@repo/motion"

const MotionBox = motion.create(Box)

/* ─────────────────────────────────────────────────────────────────────────── */

export interface CoeqwalPanelProps {
  /** HTML id for anchor/scroll targeting */
  id?: string
  /** Overline label rendered above the headline */
  eyebrow?: string
  /** Primary heading — accepts JSX so callers can embed <br /> etc. */
  headline: React.ReactNode
  /** Body description rendered below the headline */
  description?: React.ReactNode
  /** CTA slot — rendered below description (e.g. an arrow link) */
  cta?: React.ReactNode
  /**
   * "single"  — headline + description stacked in one column (default)
   * "split"   — headline spans full width; description in right half only
   */
  layout?: "single" | "split"
  /** Section background colour (default: theme.palette.common.white) */
  background?: string
  /** Bottom border (e.g. RULE constant). Omit for no border. */
  borderBottom?: string
  /** Content rendered below the text block — card grids, etc. */
  children?: React.ReactNode
}

/* ─────────────────────────────────────────────────────────────────────────── */

export function CoeqwalPanel({
  id,
  eyebrow,
  headline,
  description,
  cta,
  layout = "single",
  background,
  borderBottom,
  children,
}: CoeqwalPanelProps) {
  const theme = useTheme()
  const bg = background ?? theme.palette.common.white

  return (
    <Box
      component="section"
      id={id}
      sx={{
        backgroundColor: bg,
        borderBottom: borderBottom ?? "none",
        px: theme.space.panel.padding,
        py: theme.space.panel.padding,
      }}
    >
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        sx={
          layout === "split"
            ? {
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                rowGap: { xs: 3, md: 4 },
                columnGap: { md: 6 },
              }
            : { maxWidth: "680px" }
        }
      >
        {/* Headline block — full width in both layouts */}
        <Box sx={layout === "split" ? { gridColumn: { md: "1 / -1" } } : undefined}>
          {eyebrow && (
            <Typography
              variant="overline"
              component="p"
              sx={{ color: theme.palette.ink.subtle, mb: 2 }}
            >
              {eyebrow}
            </Typography>
          )}
          <Typography variant="h5" component="h2" sx={{ color: theme.palette.ink.heading }}>
            {headline}
          </Typography>
        </Box>

        {/* Description + CTA block */}
        {(description || cta) && (
          <Box
            sx={
              layout === "split"
                ? { gridColumn: { xs: "1", md: "2" } }
                : { mt: 3 }
            }
          >
            {description && (
              <Typography
                variant="body1"
                component="div"
                sx={{ color: theme.palette.ink.body, mb: cta ? 4 : 0 }}
              >
                {description}
              </Typography>
            )}
            {cta}
          </Box>
        )}
      </MotionBox>

      {/* Below-the-fold slot — card grids, etc. */}
      {children && <Box sx={{ mt: 5 }}>{children}</Box>}
    </Box>
  )
}
