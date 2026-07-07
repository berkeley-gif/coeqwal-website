"use client"

/** Text CTA with an arrow */

import { Box, Typography } from "@repo/ui/mui"
import { NavArrow } from "@repo/ui"

interface ButtonCtaProps {
  children: React.ReactNode
  /** Provide href for a real navigation link, OR onClick for an
   *  in-app action - not both. If href is present, this renders a
   *  link; otherwise it renders a <button> so actions that don't go
   *  anywhere aren't disguised as anchors. */
  href?: string
  onClick?: () => void
}

export function ButtonCta({ children, href, onClick }: ButtonCtaProps) {
  const content = (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        py: 1,
        "&:hover .about-arrow": { transform: "translateX(4px)" },
      }}
    >
      <Typography
        component="span"
        sx={(theme) => ({
          ...theme.typography.overline,
          fontWeight: 600,
          letterSpacing: "0.2em",
          lineHeight: 1.2,
          color: "inherit",
        })}
      >
        {children}
      </Typography>
      <NavArrow className="about-arrow" />
    </Box>
  )

  if (href) {
    return (
      <a href={href} style={{ textDecoration: "none", color: "inherit" }}>
        {content}
      </a>
    )
  }

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        color: "inherit",
        font: "inherit",
        textAlign: "inherit",
      }}
    >
      {content}
    </Box>
  )
}
