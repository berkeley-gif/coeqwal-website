"use client"

import React from "react"
import { Button, ButtonProps } from "@mui/material"
import CustomArrowForwardIcon from "./CustomArrowForwardIcon"

interface LearnMoreButtonProps extends ButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  children?: React.ReactNode
}

export function LearnMoreButton({
  onClick,
  children,
  ...props
}: LearnMoreButtonProps) {
  return (
    <Button onClick={onClick} endIcon={<CustomArrowForwardIcon />} {...props}>
      {children || "Learn More"}
    </Button>
  )
}
