import { BasePanel } from "@repo/ui"
import { Box, Typography, Stack } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"
import { ScrollDownIcon } from "@repo/ui"

export default function InterstitialPanel() {
  const { t } = useTranslation()

  const handleScrollDown = () => {
    // Scroll to the next section smoothly
    // Find and scroll to the next section element
    const californiaWaterSection = document.getElementById(
      "california-water-panel",
    )
    if (californiaWaterSection) {
      californiaWaterSection.scrollIntoView({ behavior: "smooth" })
    } else {
      // Fallback to a shorter scroll distance if next section not found
      window.scrollBy({
        top: 500, // Shorter distance than full viewport
        behavior: "smooth",
      })
    }
  }

  return (
    <Box
      id="interstitial"
      sx={{
        position: "relative",
        height: "100vh",
        zIndex: 1,
      }}
    >
      <BasePanel
        fullHeight={false}
        background="interstitial"
        paddingVariant="very-wide"
        includeHeaderSpacing={false}
        sx={{
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "auto",
          position: "relative", // Required for absolute positioning of ScrollDownIcon
        }}
      >
        <Box maxWidth="1000px">
          <Stack spacing={2}>
            <Typography variant="body1" sx={{ fontSize: "1.6rem" }}>
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("interstitial.boldText")}
              </Box>
              {" " + t("interstitial.part1")}
            </Typography>
            <Typography variant="body1" sx={{ fontSize: "1.6rem" }}>
              {t("interstitial.part2")}
            </Typography>
          </Stack>
        </Box>

        <ScrollDownIcon onClick={handleScrollDown} color="white" />
      </BasePanel>
    </Box>
  )
}
