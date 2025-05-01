"use client"

import React from "react"
import { Box, Paper, PaperProps } from "@mui/material"
import { styled } from "@mui/material/styles"

export interface CardProps extends Omit<PaperProps, "color"> {
  children: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  actions?: React.ReactNode
  color?: "default" | "primary" | "secondary" | "pop"
}

const StyledCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "color",
})<{ color?: string }>(({ theme, color = "default" }) => ({
  borderRadius: theme.borderRadius.card,
  backgroundColor: theme.palette.common.white,
  width: "100%",
  overflow: "hidden",
  // transition: "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms", // MUI v7 transition
  transition: "none",
  border: theme.border.none,
  padding: theme.spacing(3),

  // Custom softer shadow
  // boxShadow:
  //   "0px 2px 4px -1px rgba(0,0,0,0.1), 0px 1px 2px 0px rgba(0,0,0,0.05), 0px 1px 5px 0px rgba(0,0,0,0.08)",
  boxShadow: "none",

  // Color variants as accent borders
  ...(color === "primary" && {
    borderLeft: `4px solid ${theme.palette.primary.main}`,
  }),
  ...(color === "secondary" && {
    borderLeft: `4px solid ${theme.palette.secondary.main}`,
  }),
  ...(color === "pop" && {
    borderLeft: `4px solid ${theme.palette.pop.main}`,
  }),

  // Softer hover shadow
  // "&:hover": {
  //   boxShadow:
  //     "0px 3px 5px -1px rgba(0,0,0,0.12), 0px 5px 8px 0px rgba(0,0,0,0.08), 0px 1px 10px 0px rgba(0,0,0,0.06)",
  // },
}))

const CardHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  paddingBottom: theme.spacing(2),
  borderBottom: theme.border.thin,
}))

const CardContent = styled(Box)({
  // No additional padding as it's handled by StyledCard
})

const CardFooter = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  paddingTop: theme.spacing(2),
  borderTop: theme.border.thin,
}))

const CardActions = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(1),
}))

/**
 * Card component that follows MUI v7 patterns
 * Uses Paper as base with custom styling for different card sections
 */
export function Card({
  children,
  elevation = 0,
  variant = "elevation",
  header,
  footer,
  actions,
  color = "default",
  sx,
  ...rest
}: CardProps) {
  return (
    <StyledCard
      elevation={elevation}
      variant={variant}
      color={color}
      sx={sx}
      {...rest}
    >
      {header && <CardHeader>{header}</CardHeader>}
      <CardContent>{children}</CardContent>
      {actions && <CardActions>{actions}</CardActions>}
      {footer && <CardFooter>{footer}</CardFooter>}
    </StyledCard>
  )
}
