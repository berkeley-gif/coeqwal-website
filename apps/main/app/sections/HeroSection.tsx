import { HeroQuestionsPanel } from "../features/heroQuestionsPanel/HeroQuestionsPanel"
import { Box } from "@repo/ui/mui"
import { ScrollDownIcon } from "@repo/ui"
import { useEffect, useRef } from "react"
import { KenBurnsMapEffect } from "../utils/mapEffects"
// import { useTranslation } from "@repo/i18n"

// Custom headline component that formats the last headline with a line break
// function CustomHeadlineText({ text }: { text: string | undefined }) {
//   // Handle undefined text
//   if (!text) return null

//   // Check if this is the last headline (contains "Where does your water")
//   if (text.includes("Where does your water")) {
//     // Split into two parts
//     const parts = [
//       "Where does your water come from?",
//       "Who else depends on it?",
//     ]

//     return (
//       <>
//         <div style={{ display: "block" }}>{parts[0]}</div>
//         <div style={{ display: "block" }}>{parts[1]}</div>
//       </>
//     )
//   }

//   // Check if this is the salmon headline
//   if (text.includes("saving salmon")) {
//     // Split into two parts
//     const parts = ["Does saving salmon mean changing", "how we use water?"]

//     return (
//       <>
//         <div style={{ display: "block" }}>{parts[0]}</div>
//         <div style={{ display: "block" }}>{parts[1]}</div>
//       </>
//     )
//   }

//   // Check if this is the climate change headline
//   if (text.includes("climate change")) {
//     const parts = ["How is climate change reshaping", "California's water?"]

//     return (
//       <>
//         <div style={{ display: "block" }}>{parts[0]}</div>
//         <div style={{ display: "block" }}>{parts[1]}</div>
//       </>
//     )
//   }

//   // Return regular text for other headlines
//   return <>{text}</>
// }

interface HeroSectionProps {
  uncontrolledMapRef?: React.RefObject<any>
}

export default function HeroSection({ uncontrolledMapRef }: HeroSectionProps) {
  // Keep our own reference to the effect for cleanup
  const effectRef = useRef<KenBurnsMapEffect | null>(null)

  // Use a ref to track if the effect is already running
  const isRunningRef = useRef(false)

  // const { t } = useTranslation()
  const handleScrollDown = () => {
    // Scroll to the next section smoothly
    window.scrollBy({
      top: window.innerHeight,
      behavior: "smooth",
    })
  }

  // Monitor for map reference availability and start Ken Burns when ready
  useEffect(() => {
    // Clear any existing effect
    if (effectRef.current) {
      console.log("🧹 Cleaning up previous Ken Burns effect")
      effectRef.current.stop()
      effectRef.current = null
      isRunningRef.current = false
    }

    // Don't do anything if no map ref is provided
    if (!uncontrolledMapRef) {
      console.warn("⚠️ No map reference was provided to HeroSection")
      return
    }

    console.log("👀 Setting up map reference monitor...")

    // Create an interval to check for map availability
    const checkInterval = setInterval(() => {
      // Skip if already running
      if (isRunningRef.current) return

      // Check if the map ref is available
      if (uncontrolledMapRef.current) {
        console.log("🎉 Map reference now available, starting Ken Burns effect")

        // Create and store the effect
        const effect = new KenBurnsMapEffect(uncontrolledMapRef)

        // California-wide view
        effect
          .addKeyframe([-119.4179, 37.7653], 5, 12000) // Start with central California
          .addKeyframe([-123.7104, 39.4621], 7, 10000, 15) // Move to northern California coast with slight rotation
          .addKeyframe([-119.0222, 35.3733], 6.5, 10000) // Pan to central valleys
          .addKeyframe([-115.1391, 36.1699], 8, 10000) // Pan to Las Vegas/Colorado River
          .addKeyframe([-119.4179, 37.7653], 5, 10000) // Return to starting point
          .setLoop(true)

        // Start the effect
        effect.start()

        // Store the effect for cleanup
        effectRef.current = effect
        isRunningRef.current = true

        // Clear the interval as we've started the effect
        clearInterval(checkInterval)
      } else {
        console.log("⏳ Waiting for map reference...")
      }
    }, 1000) // Check every second

    // Cleanup function
    return () => {
      // Clear the check interval
      clearInterval(checkInterval)

      // Stop any running effect
      if (effectRef.current) {
        console.log("🛑 Stopping Ken Burns effect on unmount")
        effectRef.current.stop()
        effectRef.current = null
      }
    }
  }, [uncontrolledMapRef]) // Only re-run if the ref changes

  // Define SVG questions with positions
  const questionSvgs = [
    {
      src: "/images/question1.svg",
      xPercent: -30,
      yPercent: 10,
      width: 360,
      height: 360,
    },
    {
      src: "/images/question2.svg",
      xPercent: 3,
      yPercent: 18,
      width: 500,
      height: 500,
    },
    {
      src: "/images/question3.svg",
      xPercent: -24,
      yPercent: -10,
      width: 400,
      height: 400,
    },
    {
      src: "/images/question4.svg",
      xPercent: 4,
      yPercent: 0,
      width: 400,
      height: 400,
    },
    {
      src: "/images/question5.svg",
      xPercent: 28,
      yPercent: 50,
      width: 460,
      height: 460,
    },
  ]

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
        verticalAlignment="top"
        background="light"
        fullHeight={false}
        includeHeaderSpacing={false}
        headlineColor="common.white"
        questionSvgs={questionSvgs}
        transitionInterval={6000}
        sx={{
          backgroundSize: "cover",
          backgroundPosition: "center -100px",
          "& > div": {
            marginTop: "-15vh",
          },
        }}
      />

      <ScrollDownIcon
        onClick={handleScrollDown}
        color="white"
        sx={{
          "& .MuiIconButton-root": {
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.6)" },
          },
        }}
      />
    </Box>
  )
}
