"use client"

import { Box, Typography, Stack } from "@repo/ui/mui"
import { BasePanel, LearnMoreButton } from "@repo/ui"
import { useTranslation } from "@repo/i18n"
import { useStoryStore, useDrawerStore } from "@repo/state"

// Add props interface
interface CalSimSectionProps {
  onOpenLearnDrawer?: (sectionId: string) => void
}

export default function CalSimSection({
  onOpenLearnDrawer,
}: CalSimSectionProps = {}) {
  const { t } = useTranslation()

  // Access the darkened paragraphs flag from the store
  const darkenParagraphs = useStoryStore(
    (s) => s.overlays.paragraphShade ?? false,
  )

  // helper for list items
  const renderParagraph = (
    translationKey: string,
    onClick?: () => void,
  ) => (
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
      onClick={onClick || (() => console.log(`Clicked ${translationKey}`))}
    >
      <Typography variant="body1">
        {t(translationKey)}
      </Typography>
    </Box>
  )

  return (
    <Box
      id="calsim"
      sx={{
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
              {t("calsim.title")}
            </Typography>

            <Stack>
              {renderParagraph("calsim.paragraph1")}
              {renderParagraph("calsim.paragraph2")}
              {renderParagraph("calsim.paragraph3")}
            </Stack>

            <Box sx={{ mt: 3, pl: 1 }}>
              <LearnMoreButton
                onClick={() => {
                  if (onOpenLearnDrawer) {
                    onOpenLearnDrawer("calsim")
                  } else {
                    useDrawerStore
                      .getState()
                      .setDrawerContent({ selectedSection: "calsim" })
                    useDrawerStore.getState().openDrawer("learn")
                  }
                }}
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
