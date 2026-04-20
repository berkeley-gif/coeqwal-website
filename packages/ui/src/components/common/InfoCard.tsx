"use client"

import {
  Box,
  Typography,
  useTheme,
  type SxProps,
  type Theme,
} from "@mui/material"

export interface InfoCardProps {
  title: string
  description?: string
  /** Click handler — makes the card interactive. */
  onClick?: () => void
  /** Visual variant. "onDark" uses translucent white; "onLight" uses a tinted fill. */
  variant?: "onDark" | "onLight"
  /** Custom background override (e.g. "rgba(210,228,242,0.8)"). */
  background?: string
  /** Custom border override. */
  border?: string
  /** Custom hover background override. */
  hoverBackground?: string
  /** Reduce the card to dimmed opacity (e.g. for coming-soon items). */
  dimmed?: boolean
  /** Title color override. Defaults to text.secondary (onDark) or text.primary (onLight). */
  titleColor?: string
  /** Description color override. Same defaults as titleColor. */
  descriptionColor?: string
  sx?: SxProps<Theme>
  children?: React.ReactNode
}

export function InfoCard({
  title,
  description,
  onClick,
  variant = "onDark",
  background: bgProp,
  border: borderProp,
  hoverBackground: hoverBgProp,
  dimmed = false,
  titleColor,
  descriptionColor,
  sx,
  children,
}: InfoCardProps) {
  const theme = useTheme()
  const isDark = variant === "onDark"

  const defaults = isDark
    ? {
        bg: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        hoverBg: "rgba(255,255,255,0.14)",
        color: "text.secondary",
      }
    : {
        bg: "rgba(210,228,242,0.8)",
        border: "1px solid rgba(210,228,242,0.85)",
        hoverBg: "rgba(210,228,242,0.9)",
        color: "text.primary",
      }

  const bg = bgProp ?? defaults.bg
  const border = borderProp ?? defaults.border
  const hoverBg = hoverBgProp ?? defaults.hoverBg
  const color = titleColor ?? defaults.color
  const descColor = descriptionColor ?? defaults.color
  const interactive = !!onClick

  return (
    <Box
      component={interactive ? "button" : "div"}
      onClick={interactive ? onClick : undefined}
      sx={{
        background: bg,
        border,
        borderRadius: theme.borderRadius.md,
        p: theme.space.component.lg,
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        cursor: interactive ? "pointer" : "default",
        transition: theme.transition.default,
        ...(dimmed && { opacity: 0.45 }),
        ...(interactive &&
          !dimmed && {
            "&:hover": {
              background: hoverBg,
              ...(isDark && { borderColor: "rgba(255,255,255,0.25)" }),
            },
          }),
        ...((sx as object) ?? {}),
      }}
    >
      <Typography variant="body2" fontWeight={600} sx={{ color }}>
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          sx={{ color: descColor, mt: theme.space.component.sm }}
        >
          {description}
        </Typography>
      )}
      {children}
    </Box>
  )
}

export default InfoCard
