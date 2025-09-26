"use client"

import { Typography, useTheme, TypographyProps } from "../.."

export interface SectionHeaderProps extends Omit<TypographyProps, "variant"> {
  children: React.ReactNode
  variant?: "subtitle1" | "subtitle2" | "h6"
}

export function SectionHeader({
  children,
  variant = "subtitle1",
  sx,
  ...props
}: SectionHeaderProps) {
  const theme = useTheme()

  const sectionHeaderStyles = {
    textIndent: theme.spacing(-2),
    paddingLeft: theme.spacing(2),
    mb: theme.spacing(3),
    ...sx,
  }

  return (
    <Typography variant={variant} sx={sectionHeaderStyles} {...props}>
      {children}
    </Typography>
  )
}
