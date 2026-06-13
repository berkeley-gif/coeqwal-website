"use client"

import { useCallback } from "react"
import { Box, Typography, useTheme, icons } from "@repo/ui/mui"
import {
  DndContext,
  pointerWithin,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import type { ShareItem } from "../types"
import type { CsvLookups } from "../variants"
import StoryCard from "./StoryCard"
import type { ShareCardRenderProps } from "./types"

interface StoryCanvasProps extends ShareCardRenderProps {
  storyItems: ShareItem[]
  storyItemIds: string[]
  onReorder: (newOrder: string[]) => void
  onRemoveFromStory: (id: string) => void
  onDelete: (id: string) => void
  onDownloadData: (item: ShareItem) => void
  onRegisterContentRef: (id: string, el: HTMLDivElement | null) => void
  onNoteChange: (id: string, note: string) => void
  csvLookups: CsvLookups
}

/**
 * The right-hand story canvas: a draggable grid of `StoryCard`s, or a
 * hint to add cards when the story is empty. Owns the dnd-kit sensors
 * and drag-end handling so the panel only has to provide the items and
 * a reorder callback.
 */
export default function StoryCanvas({
  storyItems,
  storyItemIds,
  onReorder,
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
}: StoryCanvasProps) {
  const theme = useTheme()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = storyItemIds.indexOf(active.id as string)
      const newIndex = storyItemIds.indexOf(over.id as string)
      if (oldIndex === -1 || newIndex === -1) return
      onReorder(arrayMove(storyItemIds, oldIndex, newIndex))
    },
    [storyItemIds, onReorder],
  )

  if (storyItems.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 8,
          gap: 1.5,
          opacity: 0.6,
        }}
      >
        <icons.ArrowBack
          sx={{ fontSize: "2rem", color: theme.palette.grey[400] }}
        />
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ maxWidth: 360 }}
        >
          Click cards in the tray on the left to add them to your story
        </Typography>
      </Box>
    )
  }

  return (
    <>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ opacity: 0.85, mb: theme.space.section.md }}
      >
        {storyItems.length} card{storyItems.length !== 1 ? "s" : ""} in your
        story. Drag to rearrange.
      </Typography>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={storyItemIds} strategy={rectSortingStrategy}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "1fr 1fr",
              },
              gap: 2,
            }}
          >
            {storyItems.map((item) => (
              <StoryCard
                key={item.id}
                item={item}
                onRemoveFromStory={onRemoveFromStory}
                onDelete={onDelete}
                onDownloadData={onDownloadData}
                onRegisterContentRef={onRegisterContentRef}
                onNoteChange={onNoteChange}
                outcomeNames={outcomeNames}
                scenarioLookup={scenarioLookup}
                allChartData={allChartData}
                radarLiveByHydro={radarLiveByHydro}
                csvLookups={csvLookups}
              />
            ))}
          </Box>
        </SortableContext>
      </DndContext>
    </>
  )
}
