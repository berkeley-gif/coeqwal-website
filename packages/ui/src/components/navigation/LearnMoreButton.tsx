"use client"

import React from "react"
import { Button, ButtonProps } from "@mui/material"
import CustomArrowForwardIcon from "./CustomArrowForwardIcon"
import { useTranslation } from "@repo/i18n"

type ButtonTranslations = {
  text: string
}

type TranslationsMap = {
  en: ButtonTranslations
  es: ButtonTranslations
}

const translations: TranslationsMap = {
  en: {
    text: "Learn More",
  },
  es: {
    text: "Aprender Más",
  },
}

interface LearnMoreButtonProps extends ButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  children?: React.ReactNode
}

export function LearnMoreButton({
  onClick,
  children,
  ...props
}: LearnMoreButtonProps) {
  const { locale, isLoading } = useTranslation()

  // Use 'en' as default until client-side hydration is complete
  const safeLocale = !locale || isLoading ? "en" : locale
  const componentText =
    translations[safeLocale as keyof TranslationsMap] || translations.en

  return (
    <Button onClick={onClick} endIcon={<CustomArrowForwardIcon />} {...props}>
      {children || componentText.text}
    </Button>
  )
}
