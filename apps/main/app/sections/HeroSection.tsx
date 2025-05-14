import { HeroQuestionsPanel } from "../features/heroQuestionsPanel/HeroQuestionsPanel"
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
      xPercent: 34,
      yPercent: 16,
      width: 360,
      height: 360,
    },
    {
      src: "/images/question2.svg",
      xPercent: 34,
      yPercent: 50,
      width: 500,
      height: 500,
    },
    {
      src: "/images/question3.svg",
      xPercent: -40,
      yPercent: 5,
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
      xPercent: 30,
      yPercent: 70,
      width: 460,
      height: 460,
    },
  ]

  // Background images that match each question index
  const backgroundImages = [
    "/images/DWR_FL_Caltrans_Sign-7163.jpg",
    "/images/DWR_CC_salmon_underH20-5_10_15_2012.jpg",
    "/images/DWR_2020_10_13_FL_Lookout_Slough-0252.jpg",
    "/images/steven-kelly-tO63oH6mGlg-unsplash.jpg",
    "/images/DWR_2024_09_27_XM_0691_Native_American_Day.jpg",
  ]

  const backgroundPositions = [
    "center top", // first image top aligned
    "center center", // second centered
    "center center", // third centered
    "center top", // fourth top aligned
    "center top", // fifth top aligned
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
        backgroundImages={backgroundImages}
        backgroundPositions={backgroundPositions}
        verticalAlignment="top"
        background="light"
        fullHeight={false}
        includeHeaderSpacing={false}
        headlineColor="common.white"
        questionSvgs={questionSvgs}
        transitionInterval={6000}
        sx={{
          backgroundSize: "cover",
          backgroundPosition: "center",
          width: "100vw",
          marginLeft: "50%",
          transform: "translateX(-50%)",
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
