import { HeroQuestionsPanel } from "@repo/ui"
import { Box } from "@repo/ui/mui"
import { ScrollDownIcon } from "@repo/ui"
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

export default function HeroSection() {
  // const { t } = useTranslation()
  const handleScrollDown = () => {
    // Scroll to the next section smoothly
    window.scrollBy({
      top: window.innerHeight,
      behavior: "smooth",
    })
  }

  // Define SVG questions with positions
  const questionSvgs = [
    {
      src: "/images/question1.svg",
      xPercent: -20,
      yPercent: 0,
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
      yPercent: 28,
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
        background="transparent"
        includeHeaderSpacing={false}
        headlineColor="common.white"
        questionSvgs={questionSvgs}
        useSvgQuestions={true}
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
        text="Our water connects us. Explore California's water system and discover possibilities for the future of water in our state."
      />
    </Box>
  )
}
