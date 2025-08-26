"use client"

import React from "react"
import { Button, ArrowForwardIcon } from "@repo/ui/mui"
import type { ButtonProps } from "@mui/material/Button"
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

// Default styling for the MoreButton
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

export interface MoreButtonProps extends ButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  children?: React.ReactNode
}

export function MoreButton({
  onClick,
  children,
  variant = defaultStyling.variant,
  sx = {},
  ...props
}: MoreButtonProps) {
  const { locale, isLoading } = useTranslation()

  // Use 'en' as default until client-side hydration is complete
  const safeLocale = !locale || isLoading ? "en" : locale
  const componentText =
    translations[safeLocale as keyof TranslationsMap] || translations.en

  // Merge default styling with any custom sx props passed
  const mergedSx = { ...defaultStyling.sx, ...sx }

  return (
    <Button
      onClick={onClick}
      endIcon={<ArrowForwardIcon />}
      variant={variant}
      sx={mergedSx}
      {...props}
    >
      {children || componentText.text}
    </Button>
  )
}
