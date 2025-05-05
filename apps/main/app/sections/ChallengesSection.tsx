"use client"

import { Box, Typography, Stack, VisibilityIcon } from "@repo/ui/mui"
import { BasePanel, LearnMoreButton } from "@repo/ui"
import { useTranslation } from "@repo/i18n"
import { useStoryStore, useDrawerStore } from "@repo/state"

// Add props interface
interface ChallengesSectionProps {
  onOpenLearnDrawer?: (sectionId: string) => void
  onOpenCurrentOpsDrawer?: (sectionId: string) => void
  onOpenThemesDrawer?: (operationId?: string) => void
}

export default function ChallengesSection({
  onOpenLearnDrawer,
  onOpenCurrentOpsDrawer,
  onOpenThemesDrawer,
}: ChallengesSectionProps = {}) {
  const { t } = useTranslation()

  // Access the darkened paragraphs flag from the store
  const darkenParagraphs = useStoryStore(
    (s) => s.overlays.paragraphShade ?? false,
  )

  // helper for list items
  const renderParagraph = (
    translationKey: string,
    onClick?: () => void,
    showIcon: boolean = true,
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
        {showIcon && (
          <VisibilityIcon
            sx={{
              ml: 1,
              verticalAlign: "middle",
            }}
            onClick={(e) => {
              e.stopPropagation()
              onClick?.()
            }}
          />
        )}
      </Typography>
    </Box>
  )

  return (
    <Box
      id="challenges"
      sx={{
        mt: 0,
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
              {t("challenges.title")}
            </Typography>

            <Stack>
              {renderParagraph("challenges.paragraph1", undefined, false)}
              {renderParagraph("challenges.paragraph2", undefined, false)}
              {renderParagraph("challenges.paragraph3", undefined, false)}
              {renderParagraph("challenges.paragraph4", undefined, false)}
            </Stack>

            <Box sx={{ mt: 3, pl: 1 }}>
              <LearnMoreButton
                sx={{ mb: 2, fontSize: "0.875rem" }}
                onClick={() => {
                  if (onOpenLearnDrawer) {
                    onOpenLearnDrawer("challenges")
                  } else {
                    useDrawerStore
                      .getState()
                      .setDrawerContent({ selectedSection: "challenges" })
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
