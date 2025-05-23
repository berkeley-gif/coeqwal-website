"use client"

import { Box, Typography, Stack, VisibilityIcon } from "@repo/ui/mui"
import {
  BasePanel,
  LearnMoreButton as ExploreButton,
  SearchScenariosButton,
} from "@repo/ui"
import { useTranslation } from "@repo/i18n"
import { useStoryStore, useDrawerStore } from "@repo/state"

// Add props interface
interface InvitationSectionProps {
  onOpenCurrentOpsDrawer?: (sectionId: string) => void
  onOpenThemesDrawer?: (operationId?: string) => void
}

export default function InvitationSection({
  onOpenCurrentOpsDrawer,
  onOpenThemesDrawer,
}: InvitationSectionProps = {}) {
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
      id="invitation"
      sx={{
        pointerEvents: "auto",
      }}
    >
      <BasePanel
        background="transparent"
        fullHeight={false}
        paddingVariant="content-last"
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
              {t("invitation.title")}
            </Typography>

            <Stack>
              {renderParagraph("invitation.paragraph1", undefined, false)}

              <Box sx={{ mt: 2, mb: 3, pl: 1 }}>
                <ExploreButton
                  onClick={() => {
                    if (onOpenCurrentOpsDrawer) {
                      onOpenCurrentOpsDrawer("invitation")
                    } else {
                      useDrawerStore
                        .getState()
                        .setDrawerContent({ selectedSection: "operations" })
                      useDrawerStore.getState().openDrawer("glossary")
                    }
                  }}
                >
                  Explore Current Operations
                </ExploreButton>
              </Box>

              {renderParagraph("invitation.paragraph2", undefined, false)}

              <Box sx={{ mt: 2, mb: 3, pl: 1 }}>
                <ExploreButton
                  onClick={() => {
                    if (onOpenThemesDrawer) {
                      onOpenThemesDrawer("delta-conveyance-tunnel")
                    } else {
                      useDrawerStore.getState().setDrawerContent({
                        selectedOperation: "delta-conveyance-tunnel",
                      })
                      useDrawerStore.getState().openDrawer("glossary")
                    }
                  }}
                >
                  Explore Scenario Themes
                </ExploreButton>
              </Box>

              {renderParagraph("invitation.paragraph3", undefined, false)}
              {renderParagraph("invitation.paragraph4", undefined, false)}

              {/* Search Scenarios button with down arrow */}
              <Box sx={{ mt: 2, mb: 3, pl: 1 }}>
                <SearchScenariosButton
                  onClick={() => {
                    // Scroll to combined-panel
                    const combinedPanel =
                      document.getElementById("combined-panel")
                    if (combinedPanel) {
                      combinedPanel.scrollIntoView({ behavior: "smooth" })
                    }
                  }}
                >
                  Search Scenarios
                </SearchScenariosButton>
              </Box>
            </Stack>
          </Box>

          {/* Right placeholder column */}
          <Box sx={{ width: { xs: "100%", md: "50%" } }} />
        </Box>
      </BasePanel>
    </Box>
  )
}
