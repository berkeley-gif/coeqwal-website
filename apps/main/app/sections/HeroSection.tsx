import { HeroQuestionsPanel } from "@repo/ui"
import { Box } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"
import React from "react"

export default function HeroSection() {
  const { t } = useTranslation()

  // Get translated headlines or fall back to default values
  const headlines = (t("heroPanel.headlines") as string[]) || [
    "Is California ready for the next drought?",
    "Does saving salmon means changing how we use water?",
    "Do some Californians still lack water justice?",
    "How is climate change reshaping California's water?",
    "Where does your water come from? Who else depends on it?",
  ]

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
        headlines={[]}
        verticalAlignment="center"
        background="transparent"
        includeHeaderSpacing={false}
        headlineColor="common.white"
        overlayCircles={[
          // Circle 1
          {
            xPercent: -30,
            yPercent: -36,
            radius: 80,
            stroke: "white",
            strokeWidth: 6,
            speechBubbleText: headlines[0],
            speechBubbleAnchor: "bottom-right",
            speechBubbleWidth: 600,
            speechBubbleVariant: "h1",
          },
          // Circle 2: Upper right
          {
            xPercent: 25,
            yPercent: -25,
            radius: 90,
            stroke: "white",
            strokeWidth: 4,
            speechBubbleText: headlines[1],
            speechBubbleAnchor: "bottom-left",
            speechBubbleWidth: 300,
            speechBubbleVariant: "h1",
          },
          // Circle 3: Middle left
          {
            xPercent: -30,
            yPercent: 10,
            radius: 70,
            stroke: "white",
            strokeWidth: 4,
            speechBubbleText: headlines[2],
            speechBubbleAnchor: "top-right",
            speechBubbleWidth: 350,
            speechBubbleVariant: "h1",
          },
          // Circle 4: Lower right
          {
            xPercent: 15,
            yPercent: 20,
            radius: 85,
            stroke: "white",
            strokeWidth: 4,
            speechBubbleText: headlines[3],
            speechBubbleAnchor: "top-left",
            speechBubbleWidth: 300,
            speechBubbleVariant: "h1",
          },
          // Circle 5: Bottom center
          {
            xPercent: 0,
            yPercent: 35,
            radius: 75,
            stroke: "white",
            strokeWidth: 4,
            speechBubbleText: headlines[4],
            speechBubbleAnchor: "top-left",
            speechBubbleWidth: 300,
            speechBubbleVariant: "h1",
          },
        ]}
        sx={{
          "& > div": {
            marginTop: "-15vh",
          },
        }}
      />
    </Box>
  )
}
