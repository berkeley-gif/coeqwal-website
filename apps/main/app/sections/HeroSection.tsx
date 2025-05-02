import { HeroQuestionsPanel } from "@repo/ui"
import { Box, Typography } from "@repo/ui/mui"
import { ScrollDownIcon } from "@repo/ui"
import { useTranslation } from "@repo/i18n"
import React, { useState, useEffect } from "react"

// Custom headline component that formats the last headline with a line break
function CustomHeadlineText({ text }: { text: string | undefined }) {
  // Handle undefined text
  if (!text) return null

  // Check if this is the last headline (contains "Where does your water")
  if (text.includes("Where does your water")) {
    // Split into two parts
    const parts = [
      "Where does your water come from?",
      "Who else depends on it?",
    ]

    return (
      <>
        <div style={{ display: "block" }}>{parts[0]}</div>
        <div style={{ display: "block" }}>{parts[1]}</div>
      </>
    )
  }

  // Check if this is the salmon headline
  if (text.includes("saving salmon")) {
    // Split into two parts
    const parts = ["Does saving salmon mean changing", "how we use water?"]

    return (
      <>
        <div style={{ display: "block" }}>{parts[0]}</div>
        <div style={{ display: "block" }}>{parts[1]}</div>
      </>
    )
  }

  // Check if this is the climate change headline
  if (text.includes("climate change")) {
    const parts = ["How is climate change reshaping", "California's water?"]
    
    return (
      <>
        <div style={{ display: "block" }}>{parts[0]}</div>
        <div style={{ display: "block" }}>{parts[1]}</div>
      </>
    )
  }

  // Return regular text for other headlines
  return <>{text}</>
}

export default function HeroSection() {
  const { t } = useTranslation()
  const [currentHeadlineIndex, setCurrentHeadlineIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

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

  // Set up headline transition (similar to TransitionHeadline component)
  useEffect(() => {
    if (headlines.length <= 1) return

    const interval = setInterval(() => {
      // Fade out
      setIsVisible(false)

      // Change headline and fade in
      setTimeout(() => {
        setCurrentHeadlineIndex((prev) => (prev + 1) % headlines.length)
        setIsVisible(true)
      }, 500)
    }, 6000) // Match the default interval in HeroQuestionsPanel

    return () => clearInterval(interval)
  }, [headlines])

  return (
    <Box
      id="hero"
      sx={{
        pointerEvents: "auto",
        position: "relative",
        zIndex: 1,
        height: "100vh",
      }}
    >
      <HeroQuestionsPanel
        backgroundImage="/images/steven-kelly-tO63oH6mGlg-unsplash.jpg"
        headlines={[]}
        verticalAlignment="center"
        background="transparent"
        includeHeaderSpacing={false}
        headlineColor="common.white"
        sx={{
          "& > div": {
            marginTop: "-15vh",
          },
        }}
      >
        {/* Custom headline with line break */}
        <Box
          sx={{
            opacity: isVisible ? 1 : 0,
            transition: "opacity 500ms ease-in-out",
          }}
        >
          <Typography
            variant="h1"
            sx={{
              color: "common.white",
              textShadow: "0px 0px 6px rgba(0, 0, 0, 0.7)",
            }}
          >
            <CustomHeadlineText text={headlines[currentHeadlineIndex]} />
          </Typography>
        </Box>
      </HeroQuestionsPanel>

      <ScrollDownIcon
        onClick={handleScrollDown}
        color="white"
        text="Water connects us. Explore California's water system and discover possibilities for the future of water in our state."
      />
    </Box>
  )
}
