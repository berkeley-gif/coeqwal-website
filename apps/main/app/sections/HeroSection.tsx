import { HeroQuestionsPanel } from "@repo/ui"
import { Box } from "@repo/ui/mui"
import { ScrollDownIcon } from "@repo/ui"
import { useTranslation } from "@repo/i18n"
import React from "react"

export default function HeroSection() {
  const { t } = useTranslation()

  const handleScrollDown = () => {
    // Scroll to the next section smoothly
    window.scrollBy({
      top: window.innerHeight,
      behavior: "smooth",
    })
  }

  // Get translated headlines or fall back to default values
  const headlines = (t("heroPanel.headlines") as string[]) || [
    "Is California ready for the next drought?",
    "Does saving salmon mean changing how we use water?",
    "How is climate change reshaping California's water?",
    "Do some Californians still lack water justice?",
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
            speechBubblePadding: 20,
          },
          // Circle 2
          {
            xPercent: 5,
            yPercent: 25,
            radius: 90,
            stroke: "white",
            strokeWidth: 6,
            speechBubbleText: headlines[1],
            speechBubbleAnchor: "top-left",
            speechBubbleWidth: 600,
            speechBubbleVariant: "h1",
            speechBubblePadding: 20,
          },
          // Circle 3
          {
            xPercent: 24,
            yPercent: -18,
            radius: 85,
            stroke: "white",
            strokeWidth: 6,
            speechBubbleText: headlines[2],
            speechBubbleAnchor: "bottom-left",
            speechBubbleWidth: 600,
            speechBubbleVariant: "h1",
            speechBubblePadding: 20,
          },
          // Circle 4
          {
            xPercent: 34,
            yPercent: 34,
            radius: 70,
            stroke: "white",
            strokeWidth: 6,
            speechBubbleText: headlines[3],
            speechBubbleAnchor: "top-left",
            speechBubbleWidth: 600,
            speechBubbleVariant: "h1",
            speechBubblePadding: 10,
          },
          // Circle 5
          {
            xPercent: 5,
            yPercent: -35,
            radius: 90,
            stroke: "white",
            strokeWidth: 6,
            speechBubbleText: headlines[4],
            speechBubbleAnchor: "bottom-left",
            speechBubbleWidth: 600,
            speechBubbleVariant: "h1",
            speechBubblePadding: 30,
          },
        ]}
        sx={{
          "& > div": {
            marginTop: "-15vh",
          },
        }}
      />

      <ScrollDownIcon onClick={handleScrollDown} color="white" />
    </Box>
  )
}
