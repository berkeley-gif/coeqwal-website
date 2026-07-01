"use client"

/**
 * Presentational primitives for the resilience sentence-style controls
 *
 * ResilienceControls.tsx` focuses on state wiring and layout.
 * These primitives are stateless building blocks:
 *
 *   PhraseButton   underlined inline trigger for a sentence phrase
 *   PopoverShell   titled container used by each phrase popover
 *   RadioRow       single-select option row shared by the popovers
 */

import React from "react"
import {
  Box,
  Divider,
  Typography,
  icons,
  useTheme,
  type Theme,
} from "@repo/ui/mui"

// --------------------------------------------------------------------
// Sentence-phrase trigger
// --------------------------------------------------------------------

interface PhraseButtonProps {
  label: React.ReactNode
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  active?: boolean
  ariaLabel?: string
}

function phraseButtonSx(theme: Theme, active: boolean) {
  return {
    display: "inline-flex",
    alignItems: "baseline",
    gap: 0.25,
    px: 0.5,
    py: 0.25,
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "inherit",
    fontWeight: 600,
    color: active ? theme.palette.blue.bright : theme.palette.text.primary,
    background: active
      ? theme.palette.interaction.selectedBackground
      : "transparent",
    textDecoration: "underline",
    textDecorationColor: theme.palette.grey[400],
    textUnderlineOffset: "3px",
    transition: "color 150ms ease, background 150ms ease",
    "&:hover, &:focus-visible": {
      color: theme.palette.blue.bright,
      background: theme.palette.action.hover,
      textDecorationColor: theme.palette.blue.bright,
      outline: "none",
    },
  } as const
}

export function PhraseButton({
  label,
  onClick,
  active = false,
  ariaLabel,
}: PhraseButtonProps) {
  const theme = useTheme()
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={active}
      aria-label={ariaLabel}
      sx={phraseButtonSx(theme, active)}
    >
      {label}
      <icons.KeyboardArrowDown
        sx={{ fontSize: "0.9em", transform: "translateY(2px)" }}
      />
    </Box>
  )
}

// --------------------------------------------------------------------
// Reusable popover shell
// --------------------------------------------------------------------

interface PopoverShellProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  width?: number
}

export function PopoverShell({
  title,
  subtitle,
  children,
  width = 280,
}: PopoverShellProps) {
  const theme = useTheme()
  return (
    <Box
      sx={{
        width,
        maxWidth: "90vw",
        p: 1.25,
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
      }}
    >
      <Box>
        <Typography
          variant="compactCaption"
          sx={{
            fontWeight: 700,
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: theme.palette.grey[800],
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              fontSize: "0.72rem",
              color: theme.palette.grey[600],
              mt: 0.25,
              lineHeight: 1.3,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      <Divider sx={{ borderColor: theme.palette.divider }} />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        {children}
      </Box>
    </Box>
  )
}

// --------------------------------------------------------------------
// Radio-row option (shared by X / Y / Z popovers)
// --------------------------------------------------------------------

interface RadioRowProps {
  active: boolean
  disabled?: boolean
  label: React.ReactNode
  onClick: () => void
}

export function RadioRow({
  active,
  disabled = false,
  label,
  onClick,
}: RadioRowProps) {
  const theme = useTheme()
  return (
    <Box
      component="button"
      type="button"
      disabled={disabled}
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        px: 0.75,
        py: 0.5,
        border: "none",
        borderRadius: "6px",
        cursor: disabled ? "default" : "pointer",
        textAlign: "left",
        background: active
          ? theme.palette.interaction.selectedBackground
          : "transparent",
        color: disabled
          ? theme.palette.grey[400]
          : active
            ? theme.palette.blue.bright
            : theme.palette.text.primary,
        fontSize: "0.8125rem",
        opacity: disabled ? 0.6 : 1,
        "&:hover:not(:disabled)": {
          background: theme.palette.action.hover,
        },
      }}
    >
      {active ? (
        <icons.RadioButtonChecked
          sx={{ fontSize: "1rem", color: theme.palette.blue.bright }}
        />
      ) : (
        <icons.RadioButtonUnchecked
          sx={{ fontSize: "1rem", color: theme.palette.grey[400] }}
        />
      )}
      {label}
    </Box>
  )
}
