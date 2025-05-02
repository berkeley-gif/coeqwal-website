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

  // Get translated headlines
  const headlines = (t("heroPanel.headlines") as string[]) || [
    "Is California ready for the next drought?",
    "Does saving salmon mean changing how we use water?",
    "How is climate change reshaping California's water?",
    "Do some Californians still lack water justice?",
    "Where does your water come from? Who else depends on it?",
  ]

  return (
    <Box
      id="hero"
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
        headlines={headlines}
        verticalAlignment="center"
        background="transparent"
        includeHeaderSpacing={false}
        headlineColor="common.white"
        sx={{
          "& > div": {
            marginTop: "-15vh",
          },
        }}
      />

      <ScrollDownIcon
        onClick={handleScrollDown}
        color="white"
        text="Water connects us. Explore California's water system and discover possibilities for the future of water in our state."
      />
    </Box>
  )
}
