"use client"

import { Typography, useTheme } from "@repo/ui/mui"

interface PanelHeadingProps {
  title: string
  /** Optional `body1` question line under the title (e.g.
   *  "How are climate change impacts evaluated?"). Renders at 0.85 opacity */
  kicker?: string
  /** Optional `body2` lead-in paragraph under the kicker
   *  (e.g. "There are a few things to keep in mind:") */
  lead?: string
}

/** Standard heading block for Get Started content panels.
 *  Compose alongside `<PanelShell>` */
export default function PanelHeading({
  title,
  kicker,
  lead,
}: PanelHeadingProps) {
  const theme = useTheme()
  const sp = theme.space.component

  // Tighter mb under the title when more heading content follows; bigger
  // mb when the title is the only heading element above the body
  const titleMb = kicker
    ? sp.sm
    : lead
      ? theme.space.section.md
      : theme.space.section.lg

  return (
    <>
      <Typography
        variant="h3"
        component="h2"
        color="text.secondary"
        sx={{ maxWidth: "66%", mb: titleMb }}
      >
        {title}
      </Typography>
      {kicker && (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            maxWidth: "66%",
            mb: theme.space.section.md,
            opacity: 0.85,
          }}
        >
          {kicker}
        </Typography>
      )}
      {lead && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: "50%", mb: theme.space.section.md }}
        >
          {lead}
        </Typography>
      )}
    </>
  )
}
