import { BasePanel } from "@repo/ui"
import { Box, Typography, Stack } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"
// import { ScrollDownIcon } from "@repo/ui"

export default function InterstitialPanel() {
  const { t } = useTranslation()

  // const handleScrollDown = () => {
  //   // Scroll to the next section smoothly
  //   // Find and scroll to the next section element
  //   const californiaWaterSection = document.getElementById(
  //     "california-water-panel",
  //   )
  //   if (californiaWaterSection) {
  //     californiaWaterSection.scrollIntoView({ behavior: "smooth" })
  //   } else {
  //     // Fallback to a shorter scroll distance if next section not found
  //     window.scrollBy({
  //       top: 500, // Shorter distance than full viewport
  //       behavior: "smooth",
  //     })
  //   }
  // }

  return (
    <Box
      id="interstitial"
      sx={{
        position: "relative",
        height: "auto",
        zIndex: 1,
      }}
    >
      <BasePanel
        fullHeight={true}
        paddingVariant="wide"
        includeHeaderSpacing={false}
        sx={{
          backgroundColor: "transparent",
          color: "white",
          alignItems: "left",
          justifyContent: "center",
          pointerEvents: "auto",
          position: "relative", // Required for absolute positioning of ScrollDownIcon
        }}
      >
        <Box maxWidth="876px">
          <Stack spacing={4}>
            <Typography variant="h2" sx={{ fontWeight: 500 }}>
              What is California&apos;s water future?
            </Typography>
            <Typography variant="body2">{t("interstitial.part1")}</Typography>
            <Typography variant="body2">{t("interstitial.part2")}</Typography>
            <Typography variant="body2">{t("interstitial.part3")}</Typography>
          </Stack>
        </Box>

        {/* <ScrollDownIcon onClick={handleScrollDown} color="white" /> */}
      </BasePanel>
    </Box>
  )
}
