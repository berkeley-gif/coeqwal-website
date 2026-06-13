"use client"

import { useMemo, useCallback } from "react"
import { Box, Typography, Button, useTheme } from "@repo/ui/mui"
import { useWorkspaceSlice } from "../../store"
import type { ShareItem } from "../../../store"
import type { ShareRadarLiveDataFields } from "../utils/shareRadarLiveData"
import { useTabNavigation } from "../../../../../hooks/useTabNavigation"
import { useShareRenderContext } from "../hooks/useShareRenderContext"
import { useCsvLookups } from "../hooks/useCsvLookups"
import { useShareDownloads } from "../hooks/useShareDownloads"
import ShareUrlVersionNotice from "../ui/ShareUrlVersionNotice"
import ShareDataRehydrationHost, {
  useShareDataReady,
} from "../ShareDataRehydrationHost"
import TrayCard, { TRAY_CARD_WIDTH } from "../components/TrayCard"
import StoryCanvas from "../components/StoryCanvas"
import ShareExportBar from "../components/ShareExportBar"

/**
 * Per-hydroclimate radar fields for share. See `buildShareRadarLiveDataFields`
 * and `useTierChartData(period, true)` in `useShareRenderContext`.
 */
export type ShareRenderLiveData = ShareRadarLiveDataFields
export type { ShareRadarHydroKey } from "../utils/shareRadarLiveData"

/**
 * Share tab: a left tray of every staged card and a right "story"
 * canvas the user arranges and exports. This component wires the
 * pieces together. The data setup, label lookups, downloads, card
 * rendering, and export bar each live in their own module under
 * `share/hooks/` and `share/components/`.
 */
export default function SharePanel() {
  const theme = useTheme()
  const { navigateToTab } = useTabNavigation()

  const {
    shareItems,
    storyItemIds,
    removeShareItem,
    addToStory,
    removeFromStory,
    reorderStory,
    updateShareItem,
  } = useWorkspaceSlice()

  const handleNoteChange = useCallback(
    (id: string, note: string) => {
      updateShareItem(id, { note })
    },
    [updateShareItem],
  )

  const { scenarioLookup, radarLiveByHydro, outcomeNames, allChartData } =
    useShareRenderContext()

  const storyItemIdSet = useMemo(() => new Set(storyItemIds), [storyItemIds])

  const storyItems = useMemo(() => {
    const byId = new Map(shareItems.map((s) => [s.id, s]))
    return storyItemIds.map((id) => byId.get(id)).filter(Boolean) as ShareItem[]
  }, [shareItems, storyItemIds])

  const handleToggleStory = useCallback(
    (id: string) => {
      if (storyItemIdSet.has(id)) {
        removeFromStory(id)
      } else {
        addToStory(id)
      }
    },
    [storyItemIdSet, addToStory, removeFromStory],
  )

  const { csvLookups } = useCsvLookups(outcomeNames, scenarioLookup)

  const {
    registerCardRef,
    registerTrayCardRef,
    handleDownloadData,
    handleDownloadAllImages,
    handleDownloadAllData,
  } = useShareDownloads({
    csvLookups,
    storyItems,
    shareItems,
    backgroundColor: theme.palette.common.white,
  })

  // Gate the bulk-data button until every variant's rehydrator has
  // populated `cachedChartData`. Without this gate the ZIP would
  // silently drop items whose async resolver is still loading on
  // first share-tab open after a URL load.
  const bulkItems = useMemo(
    () => (storyItems.length > 0 ? storyItems : shareItems),
    [storyItems, shareItems],
  )
  const dataReady = useShareDataReady(bulkItems)

  // The host has to live inside the share panel so the rehydrators
  // can read SWR caches the panel already populated (resolved tier
  // data, comparison data). Build the context once per render with
  // the same fields the cards already use.
  const rehydrationContext = useMemo(
    () => ({
      allChartData,
      radarLiveByHydro,
      updateShareItem,
    }),
    [allChartData, radarLiveByHydro, updateShareItem],
  )

  // Empty state: no share items at all.
  if (shareItems.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          minHeight: 400,
          gap: 2,
          px: 3,
        }}
      >
        <Typography variant="h3" component="h2" color="text.secondary">
          Share
        </Typography>
        <Typography
          sx={{
            fontSize: "0.9375rem",
            color: theme.palette.text.secondary,
            textAlign: "center",
            maxWidth: 420,
            opacity: 0.8,
          }}
        >
          No scenarios staged for sharing yet. Go to the Explore tab, find
          scenarios that you want to share, and click the share icon on each
          one.
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigateToTab("explore")}
          sx={{
            textTransform: "none",
            mt: 1,
            color: theme.palette.text.secondary,
            borderColor: theme.palette.text.secondary,
          }}
        >
          Go to Explore
        </Button>
      </Box>
    )
  }

  // Section headline (full width) + two-zone body (tray | story).
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <ShareDataRehydrationHost items={shareItems} context={rehydrationContext} />
      <Box
        sx={{
          flexShrink: 0,
          width: "100%",
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: theme.space.section.md,
        }}
      >
        <Typography variant="h3" component="h2" color="text.secondary">
          Tell your water story
        </Typography>
        <ShareUrlVersionNotice />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Scorecard tray (left, fixed-width, vertical scroll) */}
        <Box
          sx={{
            flexShrink: 0,
            width: TRAY_CARD_WIDTH + 32,
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.grey[50],
            px: 2,
            py: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            overflowY: "auto",
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: theme.palette.grey[300],
              borderRadius: 3,
            },
          }}
        >
          {shareItems.map((item) => (
            <TrayCard
              key={item.id}
              item={item}
              isInStory={storyItemIdSet.has(item.id)}
              onToggle={() => handleToggleStory(item.id)}
              onNoteChange={handleNoteChange}
              onRegisterTrayContentRef={registerTrayCardRef}
              outcomeNames={outcomeNames}
              scenarioLookup={scenarioLookup}
              allChartData={allChartData}
              radarLiveByHydro={radarLiveByHydro}
            />
          ))}
        </Box>

        {/* Story canvas (right, scrollable) */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            overflow: "auto",
            px: 3,
            pt: theme.space.section.lg,
            pb: 3,
          }}
        >
          <StoryCanvas
            storyItems={storyItems}
            storyItemIds={storyItemIds}
            onReorder={reorderStory}
            onRemoveFromStory={removeFromStory}
            onDelete={removeShareItem}
            onDownloadData={handleDownloadData}
            onRegisterContentRef={registerCardRef}
            onNoteChange={handleNoteChange}
            outcomeNames={outcomeNames}
            scenarioLookup={scenarioLookup}
            allChartData={allChartData}
            radarLiveByHydro={radarLiveByHydro}
            csvLookups={csvLookups}
          />

          {storyItems.length > 0 && (
            <ShareExportBar
              onDownloadAllImages={handleDownloadAllImages}
              onDownloadAllData={handleDownloadAllData}
              dataReady={dataReady}
            />
          )}
        </Box>
      </Box>
    </Box>
  )
}
