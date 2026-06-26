"use client"

import React, { useCallback, useRef } from "react"
import { Box, IconButton, useTheme, icons } from "@repo/ui/mui"
import { HoverTip } from "@repo/ui"
import { useSortable } from "@dnd-kit/sortable"
import type { ShareItem } from "../types"
import type { CsvLookups } from "../variants"
import ShareItemView from "../ShareItemView"
import {
  downloadShareItemAsPng,
  downloadShareItemAsSvg,
} from "../export/shareItemDownload"
import type { ShareCardRenderProps } from "./types"

/** Map dnd-kit's transform to a CSS translate string. */
function transformToCSS(
  transform: { x: number; y: number; scaleX: number; scaleY: number } | null,
): string | undefined {
  if (!transform) return undefined
  const { x, y } = transform
  return `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`
}

interface StoryCardProps extends ShareCardRenderProps {
  item: ShareItem
  onRemoveFromStory: (id: string) => void
  onDelete: (id: string) => void
  onDownloadData: (item: ShareItem) => void
  onRegisterContentRef: (id: string, el: HTMLDivElement | null) => void
  onNoteChange: (id: string, note: string) => void
  csvLookups: CsvLookups
}

/**
 * Sortable full-size card on the story canvas. Adds a drag handle and a
 * per-card action row (download PNG / SVG / data, remove from story,
 * delete) on top of the shared `ShareItemView` content.
 */
export default function StoryCard({
  item,
  onRemoveFromStory,
  onDelete,
  onDownloadData,
  onRegisterContentRef,
  onNoteChange,
  outcomeNames,
  scenarioLookup,
  allChartData,
  radarLiveByHydro,
  csvLookups,
}: StoryCardProps) {
  const theme = useTheme()
  const contentRef = useRef<HTMLDivElement>(null)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const handleDownloadPng = useCallback(async () => {
    await downloadShareItemAsPng(
      item,
      contentRef.current,
      theme.palette.common.white,
      csvLookups,
    )
  }, [item, theme.palette.common.white, csvLookups])

  const handleDownloadSvg = useCallback(async () => {
    await downloadShareItemAsSvg(
      item,
      contentRef.current,
      theme.palette.common.white,
      csvLookups,
    )
  }, [item, theme.palette.common.white, csvLookups])

  const style: React.CSSProperties = {
    transform: transformToCSS(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: "none",
    zIndex: isDragging ? 100 : "auto",
  }

  const hasData =
    !!item.cachedChartData && Object.keys(item.cachedChartData).length > 0

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        position: "relative",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "8px",
        backgroundColor: theme.palette.background.paper,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Drag handle */}
      <Box
        {...attributes}
        {...listeners}
        sx={{
          cursor: isDragging ? "grabbing" : "grab",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 0.5,
          color: theme.palette.grey[400],
          "&:hover": { color: theme.palette.grey[600] },
        }}
      >
        <icons.DragIndicator sx={{ fontSize: "1rem" }} />
      </Box>

      <Box
        ref={(el: HTMLDivElement | null) => {
          ;(
            contentRef as React.MutableRefObject<HTMLDivElement | null>
          ).current = el
          onRegisterContentRef(item.id, el)
        }}
      >
        <Box sx={{ px: 0.5, pb: 0.5 }}>
          <ShareItemView
            item={item}
            outcomeNames={outcomeNames}
            scenarioLookup={scenarioLookup}
            allChartData={allChartData}
            radarLiveByHydro={radarLiveByHydro}
            onNoteChange={onNoteChange}
          />
        </Box>
      </Box>

      {/* Actions */}
      <Box sx={{ px: 1.5, pb: 1.5 }}>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            mt: 1,
            alignItems: "center",
          }}
        >
          <HoverTip content="Download as PNG" compact>
            <IconButton
              size="small"
              onClick={handleDownloadPng}
              sx={{ p: 0.75, color: theme.palette.grey[600] }}
            >
              <icons.Image sx={{ fontSize: "1.25rem" }} />
            </IconButton>
          </HoverTip>
          <HoverTip content="Download as SVG" compact>
            <IconButton
              size="small"
              onClick={handleDownloadSvg}
              sx={{ p: 0.75, color: theme.palette.grey[600] }}
            >
              <icons.Code sx={{ fontSize: "1.25rem" }} />
            </IconButton>
          </HoverTip>
          <HoverTip
            content={
              hasData ? "Download data" : "No data available. Try re-sharing."
            }
            compact
          >
            <span>
              <IconButton
                size="small"
                onClick={() => onDownloadData(item)}
                disabled={!hasData}
                sx={{
                  p: 0.75,
                  color: hasData
                    ? theme.palette.grey[600]
                    : theme.palette.grey[300],
                }}
              >
                <icons.DataObject sx={{ fontSize: "1.25rem" }} />
              </IconButton>
            </span>
          </HoverTip>
          <Box sx={{ flex: 1 }} />
          <HoverTip content="Remove from story" compact>
            <IconButton
              size="small"
              onClick={() => onRemoveFromStory(item.id)}
              sx={{ p: 0.75, color: theme.palette.grey[500] }}
            >
              <icons.RemoveCircleOutline sx={{ fontSize: "1.25rem" }} />
            </IconButton>
          </HoverTip>
          <HoverTip content="Delete card" compact>
            <IconButton
              size="small"
              onClick={() => onDelete(item.id)}
              sx={{ p: 0.75, color: theme.palette.grey[500] }}
            >
              <icons.Delete sx={{ fontSize: "1.25rem" }} />
            </IconButton>
          </HoverTip>
        </Box>
      </Box>
    </Box>
  )
}
