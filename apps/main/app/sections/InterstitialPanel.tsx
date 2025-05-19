import { BasePanel } from "@repo/ui"
import { Box, Typography, Stack } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"

export default function InterstitialPanel() {
  const { t } = useTranslation()

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
          backgroundColor: "white",
          color: "text.teal",
          alignItems: "left",
          justifyContent: "center",
          pointerEvents: "auto",
          position: "relative",
          backgroundImage: "url('/images/collage_water.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          minHeight: "100vh",
        }}
      >
        {/* Content container for proper blending context */}
        <Box
          sx={{
            position: "relative",
            isolation: "isolate",
            width: "100%",
            height: "100%",
          }}
        >
          {/* Text content with mix-blend-mode */}
          <Box
            maxWidth="876px"
            sx={{
              position: "relative",
              zIndex: 10,
              backgroundColor: "transparent",
              padding: 3,
              borderRadius: 2,
              "& .blend-text": {
                mixBlendMode: "difference",
                color: "#FFFFFF",
                textShadow: "0 0 10px rgba(0,0,0,0.1)",
              },
            }}
          >
            <Stack spacing={4}>
              <Typography
                variant="h2"
                className="blend-text"
                sx={{
                  fontWeight: 500,
                }}
              >
                What is California&apos;s water future?
              </Typography>
              <Typography variant="body2" className="blend-text">
                {t("interstitial.part1")}
              </Typography>
              <Typography variant="body2" className="blend-text">
                {t("interstitial.part2")}
              </Typography>
              <Typography variant="body2" className="blend-text">
                {t("interstitial.part3")}
              </Typography>
            </Stack>
          </Box>
        </Box>
      </BasePanel>
    </Box>
  )
}
