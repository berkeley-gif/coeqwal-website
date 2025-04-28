import { HeroQuestionsPanel } from "@repo/ui"
import { Box } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"
import React from "react"

export default function HeroSection() {
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        pointerEvents: "auto",
        position: "relative",
        zIndex: 1,
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <HeroQuestionsPanel
        headlines={
          (t("heroPanel.headlines") as string[]) || [
            "How do reservoir operations affect Delta water quality?",
            "Which water futures support salmon survival?",
            "How do cities and farms share water in a hotter, drier future?",
            "Which policies help meet environmental goals?",
            "What happens if we let our rivers run?",
          ]
        }
        verticalAlignment="center"
        background="light"
        includeHeaderSpacing={false}
        sx={{
          backgroundColor: "rgb(191, 218, 220)",
          "& > div": {
            marginTop: "-15vh",
          },
        }}
      />
    </Box>
  )
}
