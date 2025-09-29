"use client"

import { Typography, useTheme, TypographyProps } from "../.."

export interface SectionHeaderProps extends TypographyProps {
  children: React.ReactNode
}

export function SectionHeader({
  children,
  variant = "h5",
  sx,
  ...props
}: SectionHeaderProps) {
  const theme = useTheme()

  const sectionHeaderStyles = {
    display: "inline-block",
    mb: theme.spacing(3),
    fontWeight: 500,
    ...sx,
  }

  return (
    <Typography variant={variant} sx={sectionHeaderStyles} {...props}>
      {children}
    </Typography>
  )
}
