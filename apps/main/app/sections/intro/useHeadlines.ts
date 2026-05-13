"use client"

/**
 * Three-panel headline strings for the IntroSection's MorphingHeadline.
 *
 * Index 0 corresponds to the VideoHero panel, index 1 to the About
 * panel, and index 2 to the WaterThemes panel. The terminal headline
 * (index 2) is the one that stays fixed as the headline docks at the
 * bottom of the WaterThemes scroll runway.
 */

import { useTranslation } from "@repo/i18n"

export interface IntroHeadline {
  line1: string
  line2: string
  textShadow: boolean
  textColor?: string
}

export function useHeadlines(): IntroHeadline[] {
  const { t } = useTranslation()
  return [
    {
      line1: t("homePanel.titleLine1"),
      line2: t("homePanel.titleLine2"),
      textShadow: true,
    },
    {
      line1: "What is",
      line2: "COEQWAL?",
      textShadow: false,
      textColor: "text.secondary",
    },
    {
      line1: "What water issues",
      line2: "matter to you?",
      textShadow: false,
      textColor: "text.primary",
    },
  ]
}
