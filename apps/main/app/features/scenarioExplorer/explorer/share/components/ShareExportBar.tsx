"use client"

import { Box, Button, useTheme, icons } from "@repo/ui/mui"
import { HoverTip } from "@repo/ui"

interface ShareExportBarProps {
  onDownloadAllImages: () => void
  onDownloadAllData: () => void
  /** False while variant rehydrators are still filling cachedChartData. */
  dataReady: boolean
}

/**
 * Action bar under the story canvas: download all cards as an image ZIP (a
 * PNG and an SVG per card) and download all card data as a CSV ZIP. The
 * share-URL and PDF exports were retired: both rendered a button that did
 * nothing.
 */
export default function ShareExportBar({
  onDownloadAllImages,
  onDownloadAllData,
  dataReady,
}: ShareExportBarProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.5,
        mt: 3,
        pt: 2,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <HoverTip
        content="Download a ZIP with a PNG and an SVG per card"
        density="compact"
      >
        <Button
          variant="outlined"
          size="small"
          onClick={onDownloadAllImages}
          startIcon={<icons.Image sx={{ fontSize: "0.875rem" }} />}
          sx={{
            textTransform: "none",
            color: theme.palette.text.secondary,
            borderColor: theme.palette.divider,
          }}
        >
          Download all images
        </Button>
      </HoverTip>
      <HoverTip
        content={
          dataReady
            ? "Download a ZIP with one CSV per card"
            : "Preparing data..."
        }
        density="compact"
      >
        <span>
          <Button
            variant="outlined"
            size="small"
            onClick={onDownloadAllData}
            disabled={!dataReady}
            startIcon={<icons.DataObject sx={{ fontSize: "0.875rem" }} />}
            sx={{
              textTransform: "none",
              color: theme.palette.text.secondary,
              borderColor: theme.palette.divider,
            }}
          >
            Download all data
          </Button>
        </span>
      </HoverTip>
    </Box>
  )
}
