import React from "react"
import { Box, Typography, Stack, VisibilityIcon } from "@repo/ui/mui"
import { BasePanel, LearnMoreButton } from "@repo/ui"
import { useTranslation } from "@repo/i18n"
import { useMap } from "@repo/map"
import type { MapboxMapRef } from "@repo/map"

interface Props {
  onOpenDrawer: () => void
}

export default function CaliforniaWaterSection({ onOpenDrawer }: Props) {
  const { t } = useTranslation()
  const { mapRef } = useMap()

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
          sx={{ ml: 1, verticalAlign: "middle" }}
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
              {renderParagraph("californiaWater.paragraph1")}
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

          {/* Right column (empty placeholder for future content) */}
          <Box sx={{ width: { xs: "100%", md: "50%" } }} />
        </Box>
      </BasePanel>
    </Box>
  )
}
