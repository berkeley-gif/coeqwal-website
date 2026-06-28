"use client"

import { useState } from "react"
import { Box, Button, useTheme, icons } from "@repo/ui/mui"
import { HoverTip } from "@repo/ui"
import { useExplorerStore } from "../../store"
import { encodeShareItems } from "../url"

interface ShareExportBarProps {
  onDownloadAllImages: () => void
  onDownloadAllData: () => void
  /** False while variant rehydrators are still filling cachedChartData. */
  dataReady: boolean
}

/**
 * Action bar under the story canvas: copy a shareable URL, download all
 * cards as an image ZIP (a PNG and an SVG per card), download all card
 * data as a CSV ZIP, and a disabled PDF placeholder. The copy-link
 * state and clipboard fallback live here since nothing else needs them.
 */
export default function ShareExportBar({
  onDownloadAllImages,
  onDownloadAllData,
  dataReady,
}: ShareExportBarProps) {
  const theme = useTheme()
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    const st = useExplorerStore.getState()
    const url = encodeShareItems(
      st.shareItems,
      st.hydroclimate,
      st.storyItemIds,
    )
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
        content={copied ? "Copied!" : "Copy shareable URL to clipboard"}
        density="compact"
      >
        <Button
          variant="outlined"
          size="small"
          onClick={handleCopyLink}
          startIcon={
            copied ? (
              <icons.Check sx={{ fontSize: "1rem" }} />
            ) : (
              <icons.ContentCopy sx={{ fontSize: "1rem" }} />
            )
          }
          sx={{
            textTransform: "none",
            color: theme.palette.text.secondary,
            borderColor: theme.palette.divider,
          }}
        >
          {copied ? "Copied!" : "Copy link"}
        </Button>
      </HoverTip>
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
      <Button
        variant="outlined"
        size="small"
        disabled
        startIcon={
          <icons.PictureAsPdf
            sx={{
              fontSize: "0.875rem",
              color: theme.palette.action.disabled,
            }}
          />
        }
        sx={{
          textTransform: "none",
          opacity: 0.45,
          color: theme.palette.action.disabled,
          borderColor: theme.palette.action.disabled,
          pointerEvents: "none",
          "&.Mui-disabled": {
            opacity: 0.45,
            color: theme.palette.action.disabled,
            borderColor: theme.palette.action.disabled,
          },
        }}
      >
        Download PDF
      </Button>
    </Box>
  )
}
