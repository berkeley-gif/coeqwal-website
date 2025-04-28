import { BasePanel } from "@repo/ui"
import { Box, Typography } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"

export default function InterstitialPanel() {
  const { t } = useTranslation()
  return (
    <BasePanel
      fullHeight={false}
      background="dark"
      paddingVariant="very-wide"
      includeHeaderSpacing={false}
      sx={{
        backgroundColor: "rgb(44, 110, 145)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "left",
        pointerEvents: "auto",
      }}
    >
      <Box maxWidth="900px">
        <Typography variant="body2" color="white">
          <Box component="span" sx={{ fontWeight: 600 }}>
            {t("interstitial.boldText")}
          </Box>
          {" " + t("interstitial.part1")}
        </Typography>
        <Typography variant="body2" color="white" sx={{ fontWeight: 300 }}>
          {t("interstitial.part2")}
        </Typography>
      </Box>
    </BasePanel>
  )
}
