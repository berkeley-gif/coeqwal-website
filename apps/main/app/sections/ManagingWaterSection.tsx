"use client"

import { Box, Typography, Stack, VisibilityIcon } from "@repo/ui/mui"
import { BasePanel, LearnMoreButton } from "@repo/ui"
import { useTranslation } from "@repo/i18n"
import { useStoryStore, useDrawerStore } from "@repo/state"

// Add props interface
interface ManagingWaterSectionProps {
  onOpenLearnDrawer?: () => void
}

export default function ManagingWaterSection({
  onOpenLearnDrawer,
}: ManagingWaterSectionProps = {}) {
  const { t } = useTranslation()

  // Access the darkened paragraphs flag from the store
  const darkenParagraphs = useStoryStore(
    (s) => s.overlays.paragraphShade ?? false,
  )

  const renderParagraph = (translationKey: string) => (
    <Box
      sx={(theme) => ({
        ...theme.mixins.hoverParagraph,
        p: "16px 16px 16px 8px",
        borderRadius: "8px",
        ...(darkenParagraphs
          ? {
              ...theme.mixins.hoverParagraphDarkened,
              p: "16px 16px 16px 8px",
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
    <Box
      id="managing-water"
      sx={{
        mb: 0,
        pointerEvents: "auto",
      }}
    >
      <BasePanel
        background="transparent"
        fullHeight={false}
        paddingVariant="content-middle"
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
          <Box sx={{ width: { xs: "100%", md: "48%" }, pr: { md: 4 } }}>
            <Typography variant="h2" sx={{ mb: 1 }}>
              {t("managingWater.title")}
            </Typography>

            <Stack>
              {renderParagraph("managingWater.paragraph1")}
              {renderParagraph("managingWater.paragraph2")}
              {renderParagraph("managingWater.paragraph3")}
            </Stack>

            <Box sx={{ mt: 3, pl: 1 }}>
              <LearnMoreButton
                onClick={() =>
                  onOpenLearnDrawer
                    ? onOpenLearnDrawer()
                    : useDrawerStore.getState().openDrawer("learn")
                }
              />
            </Box>
          </Box>

          {/* Right placeholder column */}
          <Box sx={{ width: { xs: "100%", md: "50%" } }} />
        </Box>
      </BasePanel>
    </Box>
  )
}
