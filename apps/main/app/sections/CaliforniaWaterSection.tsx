import React, { useState } from "react"
import { Box, Typography, Stack, VisibilityIcon } from "@repo/ui/mui"
import { BasePanel, LearnMoreButton } from "@repo/ui"
import { useTranslation } from "@repo/i18n"
import { useMap } from "@repo/map"
import { usePrecipitationAnimation } from "../hooks/usePrecipitationAnimation"

interface Props {
  onOpenDrawer: () => void
}

export default function CaliforniaWaterSection({ onOpenDrawer }: Props) {
  const { t } = useTranslation()
  const { mapRef } = useMap()
  // precipitation animation hook
  const { animateBands, isAnimating } = usePrecipitationAnimation(mapRef, {
    bandDurationMs: 250, // band cycling rate
    snowfallThreshold: 6, // band timing for fade-in
  })

  const [showARLabel, setShowARLabel] = useState(false)

  const handleAnimateBands = () => {
    animateBands()
    setShowARLabel(true)
  }

  // helper for list items
  const renderParagraph = (translationKey: string, onClick?: () => void) => (
    <Box
      sx={{
        cursor: "pointer",
        p: 1,
        borderRadius: 1,
        transition: "background-color 0.3s ease",
        "&:hover": {
          backgroundColor: "rgba(25, 118, 210, 0.08)",
        },
        "&:hover .MuiSvgIcon-root": {
          color: "#42a5f5",
          transform: "scale(1.2)",
        },
        "&:active": {
          backgroundColor: "rgba(25, 118, 210, 0.16)",
        },
      }}
      onClick={onClick || (() => console.log(`Clicked ${translationKey}`))}
    >
      <Typography variant="body1">
        {t(translationKey)}
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
      </Typography>
    </Box>
  )

  return (
    <Box sx={{ pointerEvents: "auto" }} id="california-water-panel">
      <BasePanel
        background="transparent"
        paddingVariant="wide"
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
              width: { xs: "100%", md: "50%" },
              pr: { md: 4 },
            }}
          >
            <Typography variant="h2" sx={{ mb: 1 }}>
              {t("californiaWater.title")}
            </Typography>

            <Stack spacing={1}>
              {renderParagraph(
                "californiaWater.paragraph1",
                handleAnimateBands,
              )}
              {/* Paragraph 2 includes map flyTo */}
              {renderParagraph("californiaWater.paragraph2", () => {
                console.log("👁 flyTo clicked", mapRef.current)
                mapRef.current?.flyTo({
                  center: [-122.305, 37.075],
                  zoom: 7.82,
                  pitch: 60,
                  bearing: 45,
                  duration: 3000,
                  essential: true,
                })
              })}
              {renderParagraph("californiaWater.paragraph3")}
              {renderParagraph("californiaWater.paragraph4")}
            </Stack>

            <Box sx={{ mt: 3 }}>
              <LearnMoreButton
                onClick={onOpenDrawer}
                variant="outlined"
                sx={{
                  borderColor: "white",
                  color: "white",
                  backgroundColor: "transparent",
                  "&:hover": {
                    borderColor: "white",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
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
