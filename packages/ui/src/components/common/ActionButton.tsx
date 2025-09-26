"use client"

import { Button, useTheme, ButtonProps } from "../.."

export interface ActionButtonProps extends ButtonProps {
  children: React.ReactNode
}

export function ActionButton({ children, sx, ...props }: ActionButtonProps) {
  const theme = useTheme()

  const actionButtonStyles = {
    minWidth: "auto",
    whiteSpace: "nowrap",
    backgroundColor: theme.palette.blue.bright,
    boxShadow: "none",
    "&:hover": {
      boxShadow: "none",
      backgroundColor: theme.palette.blue.bright,
    },
    ...sx,
  }

  return (
    <Button variant="contained" sx={actionButtonStyles} {...props}>
      {children}
    </Button>
  )
}
