import { Box, Typography, Stack, VisibilityIcon } from "@repo/ui/mui"
import { BasePanel, LearnMoreButton } from "@repo/ui"
import { useTranslation } from "@repo/i18n"
import { useStoryStore } from "@repo/state"

interface Props {
  onOpenDrawer: () => void
}

export default function ManagingWaterSection({ onOpenDrawer }: Props) {
  const { t } = useTranslation()

  // Access the darkened paragraphs flag from the store
  const darkenParagraphs = useStoryStore(
    (s) => s.overlays.paragraphShade ?? false,
  )

  const renderParagraph = (translationKey: string) => (
    <Box
      sx={(theme) => ({
        ...theme.mixins.hoverParagraph,
        p: 2,
        borderRadius: "8px",
        ...(darkenParagraphs
          ? {
              ...theme.mixins.hoverParagraphDarkened,
              p: 2,
              borderRadius: "8px",
            }
          : {}),
      })}
    >
      <Typography variant="body1">
        {t(translationKey)}
        <VisibilityIcon sx={{ ml: 1, verticalAlign: "middle" }} />
      </Typography>
    </Box>
  )

  return (
    <Box sx={{ pointerEvents: "auto" }} id="managing-water-panel">
      <BasePanel
        background="transparent"
        paddingVariant="wide"
        includeHeaderSpacing={false}
        sx={{ color: (theme) => theme.palette.text.secondary }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            width: "100%",
          }}
        >
          {/* Left column */}
          <Box sx={{ width: { xs: "100%", md: "50%" }, pr: { md: 4 } }}>
            <Typography variant="h2" sx={{ mb: 1 }}>
              {t("managingWater.title")}
            </Typography>

            <Stack ml={"-10px"}>
              {renderParagraph("managingWater.paragraph1")}
              {renderParagraph("managingWater.paragraph2")}
              {renderParagraph("managingWater.paragraph3")}
            </Stack>

            <Box sx={{ mt: 3 }}>
              <LearnMoreButton onClick={onOpenDrawer} />
            </Box>
          </Box>

          {/* Right placeholder column */}
          <Box sx={{ width: { xs: "100%", md: "50%" } }} />
        </Box>
      </BasePanel>
    </Box>
  )
}
