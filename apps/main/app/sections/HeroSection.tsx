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
        backgroundImage="/images/steven-kelly-tO63oH6mGlg-unsplash.jpg"
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
        headlineColor="common.white"
        overlayCircles={[
          // Circle 1: Upper left
          {
            xPercent: -25,
            yPercent: -30,
            radius: 80,
            stroke: "white",
            strokeWidth: 4,
          },
          // Circle 2: Upper right
          {
            xPercent: 25,
            yPercent: -25,
            radius: 90,
            stroke: "white",
            strokeWidth: 4,
          },
          // Circle 3: Middle left
          {
            xPercent: -30,
            yPercent: 10,
            radius: 70,
            stroke: "white",
            strokeWidth: 4,
          },
          // Circle 4: Lower right
          {
            xPercent: 15,
            yPercent: 20,
            radius: 85,
            stroke: "white",
            strokeWidth: 4,
          },
          // Circle 5: Bottom center
          {
            xPercent: 0,
            yPercent: 35,
            radius: 75,
            stroke: "white",
            strokeWidth: 4,
          },
        ]}
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
