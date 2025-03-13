"use client"

import React from "react"
import { Button, ButtonProps } from "@mui/material"
import CustomArrowForwardIcon from "./customArrowForwardIcon"
import { useTranslation } from "@repo/i18n"

interface LearnMoreButtonProps extends ButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export function LearnMoreButton({ onClick, ...props }: LearnMoreButtonProps) {
  const { t } = useTranslation()

  const text = t("learnMore") || "Learn More"

  return (
    <Button
      onClick={onClick}
      {...props}
      sx={{
        zIndex: 3,
        mt: 2,
        ...props.sx,
      }}
    >
      {text} <CustomArrowForwardIcon />
    </Button>
  )
}
