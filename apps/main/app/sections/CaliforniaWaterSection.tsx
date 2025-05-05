"use client"

import { Box, Typography, Stack, VisibilityIcon } from "@repo/ui/mui"
import { BasePanel, LearnMoreButton } from "@repo/ui"
import { useTranslation } from "@repo/i18n"
import { useMap } from "@repo/map"
import { usePrecipitationAnimation } from "../hooks/usePrecipitationAnimation"
import { useStoryStore, useDrawerStore } from "@repo/state"
import { useMapFly } from "../hooks/useMapFly"
import { views } from "../config/mapViews"

// Add props interface
interface CaliforniaWaterSectionProps {
  onOpenLearnDrawer?: () => void
}

export default function CaliforniaWaterSection({
  onOpenLearnDrawer,
}: CaliforniaWaterSectionProps = {}) {
  const { t } = useTranslation()
  const { mapRef } = useMap()
  const fly = useMapFly()
  // precipitation animation hook
  const { animateBands, isAnimating } = usePrecipitationAnimation(mapRef, {
    bandDurationMs: 250, // band cycling rate
    snowfallThreshold: 6, // band timing for fade-in
  })

  const showARLabel = useStoryStore((s) => s.overlays.arLabel ?? false)
  const darkenParagraphs = useStoryStore(
    (s) => s.overlays.paragraphShade ?? false,
  )
  const { setOverlay } = useStoryStore.getState()

  const handleAnimateBands = () => {
    animateBands()
  }

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
              animation:
                translationKey === "californiaWater.paragraph1" && isAnimating
                  ? "pulse 1.5s infinite"
                  : "none",
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
      id="california-water"
      sx={{
        pointerEvents: "auto",
      }}
    >
      <BasePanel
        background="transparent"
        fullHeight={false}
        paddingVariant="content-first"
        includeHeaderSpacing={false}
        sx={{
          color: (theme) => theme.palette.text.secondary,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            width: "100%",
          }}
        >
          {/* Left column */}
          <Box
            sx={{
              width: { xs: "100%", md: "48%" },
              pr: { md: 4 },
            }}
          >
            <Typography variant="h2" sx={{ mb: 1 }}>
              {t("californiaWater.title")}
            </Typography>

            <Stack>
              {renderParagraph(
                "californiaWater.paragraph1",
                handleAnimateBands,
              )}
              {/* Paragraph 2 includes map flyTo */}
              {renderParagraph("californiaWater.paragraph2", () => {
                setOverlay("arLabel", false)
                setOverlay("paragraphShade", true)
                fly(views.deltaClose)
              })}
              {renderParagraph("californiaWater.paragraph3")}
              {renderParagraph("californiaWater.paragraph4", undefined, false)}
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

          {/* Right column */}
          <Box
            sx={{
              width: { xs: "100%", md: "50%" },
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-start",
              pt: 2,
              pl: 2,
            }}
          >
            <Box
              sx={{
                opacity: showARLabel ? 1 : 0,
                transition: "opacity 1s ease",
                textAlign: "center",
                backgroundColor: "rgba(2, 18, 36, 0.9)",
                color: "#F2F0EF",
                px: 1,
                py: 1,
                borderRadius: "4px",
              }}
            >
              <Typography
                variant="body1"
                sx={{ fontSize: "1rem", color: "white", fontWeight: 600 }}
              >
                {t("californiaWater.arLabel.title")}
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontSize: "1rem", color: "white", fontWeight: 400 }}
              >
                {t("californiaWater.arLabel.date")}
              </Typography>
            </Box>
          </Box>
        </Box>
      </BasePanel>
    </Box>
  )
}
