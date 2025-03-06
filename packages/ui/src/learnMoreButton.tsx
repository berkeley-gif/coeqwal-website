"use client"

import React from "react"
import { Button, ButtonProps } from "@mui/material"
import CustomArrowForwardIcon from "./customArrowForwardIcon"
import en from "../public/locales/english.json"
import es from "../public/locales/spanish.json"
import { useUiLocale } from "./context/UiLocaleContext"

interface LearnMoreButtonProps extends ButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export function LearnMoreButton({ onClick, ...props }: LearnMoreButtonProps) {
  const { locale } = useUiLocale()

  const text =
    locale === "en" ? en.drawerButton.learnMore : es.drawerButton.learnMore

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
