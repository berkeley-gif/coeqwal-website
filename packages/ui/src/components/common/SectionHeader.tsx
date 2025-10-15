"use client"

import { Typography, useTheme, TypographyProps } from "../.."

type SectionHeaderVariant = "h5" | "h4" | "h3" | "subtitle1" | "subtitle2"

export interface SectionHeaderProps extends Omit<TypographyProps, 'variant'> {
  children: React.ReactNode
  variant?: SectionHeaderVariant
}

export function SectionHeader({
  children,
  variant = "h5",
  sx,
  ...props
}: SectionHeaderProps) {
  const theme = useTheme()

  const getVariantStyles = (variant: SectionHeaderVariant) => {
    switch (variant) {
      case "h3":
        return {
          fontWeight: 600,
          mb: theme.spacing(3),
        }
      case "h4":
        return {
          fontWeight: 600,
          mb: theme.spacing(2.5),
        }
      case "h5":
        return {
          fontWeight: 600,
          mb: theme.spacing(0.5),
        }
      case "subtitle1":
        return {
          fontWeight: 600,
          mb: theme.spacing(theme.cards.spacing.standard),
        }
      case "subtitle2":
        return {
          fontWeight: 500,
          mb: theme.spacing(1),
        }
      default:
        return {
          fontWeight: 500,
          mb: theme.spacing(2),
        }
    }
  }

  const sectionHeaderStyles = {
    display: "inline-block",
    letterSpacing: 0.5,
    ...getVariantStyles(variant),
    ...sx,
  }

  return (
    <Typography variant={variant} sx={sectionHeaderStyles} {...props}>
      {children}
    </Typography>
  )
}
