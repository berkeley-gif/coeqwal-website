"use client"

import React from "react"
import { Button, ButtonProps } from "@mui/material"
import CustomArrowDownIcon from "./CustomArrowDownIcon"

// Default styling for the SearchScenariosButton - same as LearnMoreButton
const defaultStyling = {
  variant: "outlined" as const,
  sx: {
    borderColor: "white",
    color: "white",
    backgroundColor: "transparent",
    "&:hover": {
      borderColor: "white",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  },
}

interface SearchScenariosButtonProps extends ButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  children?: React.ReactNode
}

export function SearchScenariosButton({
  onClick,
  children,
  variant = defaultStyling.variant,
  sx = {},
  ...props
}: SearchScenariosButtonProps) {
  // Merge default styling with any custom sx props passed
  const mergedSx = { ...defaultStyling.sx, ...sx }

  return (
    <Button
      onClick={onClick}
      endIcon={<CustomArrowDownIcon />}
      variant={variant}
      sx={mergedSx}
      {...props}
    >
      {children || "Search Scenarios"}
    </Button>
  )
}

export default SearchScenariosButton
