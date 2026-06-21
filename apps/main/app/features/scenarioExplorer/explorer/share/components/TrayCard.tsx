"use client"

import { Box, useTheme, icons } from "@repo/ui/mui"
import type { ShareItem } from "../types"
import ShareItemView from "../ShareItemView"
import type { ShareCardRenderProps } from "./types"

/** Fixed width of a tray card; the tray column reserves this + padding. */
export const TRAY_CARD_WIDTH = 280

interface TrayCardProps extends ShareCardRenderProps {
  item: ShareItem
  isInStory: boolean
  onToggle: () => void
  onNoteChange: (id: string, note: string) => void
  onRegisterTrayContentRef: (id: string, el: HTMLDivElement | null) => void
}

/**
 * Full-size card shown in the Share-tab tray. Clicking the card toggles
 * whether it is part of the story (clicks inside the note block are
 * ignored so users can edit notes without toggling). Same content as
 * `StoryCard`, minus the drag handle and per-card download actions.
 */
export default function TrayCard({
  item,
  isInStory,
  onToggle,
  onNoteChange,
  onRegisterTrayContentRef,
  outcomeNames,
  scenarioLookup,
  allChartData,
  radarLiveByHydro,
}: TrayCardProps) {
  const theme = useTheme()

  return (
    <Box
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-share-note]")) {
          return
        }
        onToggle()
      }}
      sx={{
        position: "relative",
        width: TRAY_CARD_WIDTH,
        minWidth: TRAY_CARD_WIDTH,
        borderRadius: "8px",
        border: `2px solid ${isInStory ? theme.palette.primary.main : theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        overflow: "hidden",
        cursor: "pointer",
        opacity: isInStory ? 0.55 : 1,
        transition: "all 150ms ease",
        "&:hover": {
          borderColor: theme.palette.primary.main,
          opacity: isInStory ? 0.65 : 1,
        },
      }}
    >
      <Box
        ref={(el: HTMLDivElement | null) => {
          onRegisterTrayContentRef(item.id, el)
        }}
        sx={{ px: 0.5, pb: 0.5 }}
      >
        <ShareItemView
          item={item}
          outcomeNames={outcomeNames}
          scenarioLookup={scenarioLookup}
          allChartData={allChartData}
          radarLiveByHydro={radarLiveByHydro}
          onNoteChange={onNoteChange}
        />
      </Box>

      {/* In-story badge */}
      {isInStory && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: theme.palette.primary.main,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: theme.shadow.sm,
          }}
        >
          <icons.Check
            sx={{ fontSize: "1rem", color: theme.palette.common.white }}
          />
        </Box>
      )}
    </Box>
  )
}
