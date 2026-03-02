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
import {
  Box,
  Typography,
  useTheme,
  type SxProps,
  type Theme,
} from "@mui/material"
import { motion } from "@repo/motion"

const MotionBox = motion.create(Box)

/* ─────────────────────────────────────────────────────────────────────────── */

export interface CoeqwalPanelProps {
  /** HTML id for anchor/scroll targeting */
  id?: string
  /** Overline label rendered above the headline */
  eyebrow?: string
  /** Primary heading — accepts JSX so callers can embed <br /> etc. Optional
   *  when the headline is handled externally (e.g. MorphingHeadline overlay). */
  headline?: React.ReactNode
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
  /** Minimum height of the section — useful for scroll-driven panels that need
   *  extra scroll runway for animations to play out */
  minHeight?: string | number
  /** Override text colour for all typography within the panel
   *  (default: theme.palette.text.primary) */
  textColor?: string
  /** Bottom border (e.g. RULE constant). Omit for no border. */
  borderBottom?: string
  /** Content rendered below the text block — card grids, etc. */
  children?: React.ReactNode
  /** When provided, replaces the default whileInView entrance with a
   *  scroll-driven style (e.g. pass a MotionValue<number> for opacity). */
  contentMotionStyle?: object
  /** Extra sx merged into the description/CTA wrapper box — useful for
   *  adjusting alignment when the headline is an external overlay. */
  descriptionSx?: SxProps<Theme>
  /** Top margin above the children slot (default: 5 = 40px).
   *  Accepts any MUI spacing value, CSS string, or responsive object. */
  childrenMt?: string | number | Record<string, string | number>
  /** Headline rendered only on small screens (hidden at lg+) where the
   *  MorphingHeadline overlay is not active. Renders directly without a
   *  Typography wrapper so callers can supply the correct variant pair. */
  responsiveHeadline?: React.ReactNode
  /** Vertical content alignment when minHeight is set.
   *  "center" (default) — vertically centres content.
   *  "top" — content starts at the top (useful when descriptionSx handles positioning). */
  contentAlign?: "center" | "top"
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
  textColor,
  minHeight,
  borderBottom,
  children,
  contentMotionStyle,
  descriptionSx,
  childrenMt = 5,
  responsiveHeadline,
  contentAlign = "center",
}: CoeqwalPanelProps) {
  const theme = useTheme()
  const bg = background ?? theme.palette.common.white
  const fg = textColor ?? theme.palette.text.primary

  const motionProps = contentMotionStyle
    ? { style: contentMotionStyle }
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.3 },
        transition: { duration: 0.5, ease: "easeOut" },
      }

  return (
    <Box
      component="section"
      id={id}
      sx={{
        background: bg,
        borderBottom: borderBottom ?? "none",
        px: theme.space.panel.padding,
        py: theme.space.panel.padding,
        ...(minHeight !== undefined && {
          minHeight,
          display: "flex",
          flexDirection: "column",
          justifyContent: contentAlign === "top" ? "flex-start" : "center",
        }),
      }}
    >
      <MotionBox
        {...motionProps}
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
        {/* Responsive headline — visible on xs–md only; lg+ uses MorphingHeadline overlay */}
        {responsiveHeadline && (
          <Box
            sx={{
              display: { xs: "block", lg: "none" },
              ...(layout === "split" && { gridColumn: { md: "1 / -1" } }),
              mb: 2,
            }}
          >
            {responsiveHeadline}
          </Box>
        )}

        {/* Headline block — full width in both layouts */}
        {(eyebrow || headline) && (
          <Box
            sx={
              layout === "split" ? { gridColumn: { md: "1 / -1" } } : undefined
            }
          >
            {eyebrow && (
              <Typography
                variant="overline"
                component="p"
                sx={{ color: fg, opacity: 0.6, mb: 2 }}
              >
                {eyebrow}
              </Typography>
            )}
            {headline && (
              <Typography variant="h5" component="h2" sx={{ color: fg }}>
                {headline}
              </Typography>
            )}
          </Box>
        )}

        {/* Description + CTA block */}
        {(description || cta) && (
          <Box
            sx={{
              ...(layout === "split"
                ? { gridColumn: { xs: "1", md: "2" }, color: fg }
                : { mt: 3, color: fg }),
              ...(descriptionSx as object),
            }}
          >
            {description && (
              <Typography
                variant="body1"
                component="div"
                sx={{ color: fg, mb: cta ? 4 : 0 }}
              >
                {description}
              </Typography>
            )}
            {cta}
          </Box>
        )}
      </MotionBox>

      {/* Below-the-fold slot — card grids, etc. */}
      {children && <Box sx={{ mt: childrenMt }}>{children}</Box>}
    </Box>
  )
}
