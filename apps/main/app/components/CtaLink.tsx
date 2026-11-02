"use client"

/**
 * CtaLink - Text-style call-to-action link
 *
 * An uppercase, letter-spaced link with a trailing icon that slides on
 * hover. Reads as part of the page's typography rather than a boxed
 * button — used where a link should feel lighter-weight than a filled
 * Button component (e.g. "Learn more about COEQWAL", "View {document}").
 *
 * The icon is passed in by the caller (NavArrow for same-page navigation,
 * an "open in new tab" icon for links that open a document) so this
 * component only owns the shared text/spacing/hover styling.
 *
 * Two variants:
 * - "cta" (default): the uppercase page-level call to action above.
 * - "inline": a small sentence-case link that sits under body text, e.g.
 *   "Read the strategy brief" beneath a strategy description in the
 *   explorer. Same structure and icon slide, scaled down to read as part
 *   of the text around it.
 */

import React from "react"
import { Box, Typography } from "@repo/ui/mui"

interface CtaLinkProps {
  href: string
  children: React.ReactNode
  icon: React.ReactNode
  /** Anchor target, e.g. "_blank" to open in a new tab. */
  target?: string
  /** Anchor rel; pair with target="_blank" (e.g. "noopener noreferrer"). */
  rel?: string
  /** Visual size/weight; see the file summary. Defaults to "cta". */
  variant?: "cta" | "inline"
  /**
   * Accessible name, for when the visible text alone is ambiguous (e.g. the
   * same "Read the strategy brief" text repeated once per strategy row).
   */
  ariaLabel?: string
  /** Click handler, e.g. to stop the click bubbling to a clickable parent row. */
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void
}

export default function CtaLink({
  href,
  children,
  icon,
  target,
  rel,
  variant = "cta",
  ariaLabel,
  onClick,
}: CtaLinkProps) {
  const isInline = variant === "inline"

  return (
    <a
      href={href}
      target={target}
      rel={rel}
      aria-label={ariaLabel}
      onClick={onClick}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          // Inline sits directly under a line of text, so it drops the CTA's
          // vertical padding (which would add ~16px to every explorer row).
          gap: isInline ? "2px" : 1,
          py: isInline ? 0 : 1,
          "&:hover .cta-link-icon": {
            transform: isInline ? "translateX(2px)" : "translateX(4px)",
          },
        }}
      >
        <Typography
          component="span"
          sx={(theme) =>
            isInline
              ? {
                  // Matches the "more"/"less" toggles in strategy
                  // descriptions, so it reads as part of the description.
                  fontSize: "0.75rem",
                  lineHeight: 1.35,
                  textDecoration: "underline",
                  color: theme.palette.blue.medium,
                }
              : {
                  ...theme.typography.overline,
                  fontWeight: 600,
                  letterSpacing: "0.2em",
                  lineHeight: 1.6,
                  textDecoration: "underline",
                  color: "inherit",
                }
          }
        >
          {children}
        </Typography>
        <Box
          className="cta-link-icon"
          sx={{
            display: "inline-flex",
            transition: "transform 0.15s ease",
            // The variant sizes the icon, so callers can pass a bare icon
            // instead of each one restyling it. Blue to match the text,
            // since inline doesn't inherit color the way the CTA does.
            ...(isInline && {
              color: "blue.medium",
              "& svg": { fontSize: "0.875rem" },
            }),
          }}
        >
          {icon}
        </Box>
      </Box>
    </a>
  )
}
