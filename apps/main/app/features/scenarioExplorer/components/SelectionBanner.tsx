"use client"

/**
 * SelectionBanner - Scenario selection summary bar
 *
 * Displays selected scenarios with compare button.
 * Appears when scenarios are selected for comparison.
 * Uses dnd-kit for 2D drag-to-reorder with wrapped layouts.
 * Uses framer-motion for smooth enter/exit animations.
 */

import React from "react"
import { Box, Typography, Button, Chip, useTheme } from "@repo/ui/mui"
import { motion, AnimatePresence } from "@repo/motion"
import {
  DndContext,
  pointerWithin,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { useScenarioExplorerStore } from "../store"
import { useScenarioList } from "../../scenarios/hooks"

// Transform utility - only use translate, ignore scale to prevent chip resizing
function transformToCSS(
  transform: { x: number; y: number; scaleX: number; scaleY: number } | null,
): string | undefined {
  if (!transform) return undefined
  const { x, y } = transform
  return `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`
}

const END_DROP_ZONE_ID = "__end_drop_zone__"

/**
 * SortableChip - Draggable chip using dnd-kit
 */
function SortableChip({
  id,
  label,
  onDelete,
}: {
  id: string
  label: string
  onDelete: () => void
}) {
  const theme = useTheme()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: transformToCSS(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    touchAction: "none",
    zIndex: isDragging ? 100 : "auto",
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Chip
        label={label}
        onDelete={onDelete}
        size="small"
        sx={{
          backgroundColor: theme.palette.grey[100],
          color: theme.palette.blue.darkest,
          fontWeight: theme.typography.fontWeightMedium,
          "& .MuiChip-deleteIcon": {
            color: theme.palette.grey[400],
            fontSize: "1rem",
            "&:hover": {
              color: theme.palette.grey[600],
            },
          },
        }}
      />
    </div>
  )
}

/**
 * EndDropZone - Drop target at the end of the list using useDroppable
 */
function EndDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: END_DROP_ZONE_ID })

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        minWidth: 60,
        height: 32,
        opacity: isOver ? 0.4 : 0,
        backgroundColor: isOver ? "#ccc" : "transparent",
        borderRadius: 4,
        transition: "opacity 0.15s, background-color 0.15s",
      }}
    />
  )
}

/**
 * SelectionBanner: Shows selected scenarios with clear all option
 */
export default function SelectionBanner() {
  const theme = useTheme()
  const { selectedScenarios, clearScenarios, toggleScenario, selectScenarios } =
    useScenarioExplorerStore()
  const { getDisplayName } = useScenarioList()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = active.id as string
    const overId = over.id as string

    // Handle drop on end zone - move to end of list
    if (overId === END_DROP_ZONE_ID) {
      const oldIndex = selectedScenarios.indexOf(activeId)
      const newOrder = [...selectedScenarios]
      const [moved] = newOrder.splice(oldIndex, 1)
      if (moved) {
        newOrder.push(moved)
        selectScenarios(newOrder)
      }
      return
    }

    // Normal reorder
    const oldIndex = selectedScenarios.indexOf(activeId)
    const newIndex = selectedScenarios.indexOf(overId)
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      selectScenarios(arrayMove(selectedScenarios, oldIndex, newIndex))
    }
  }

  const hasSelection = selectedScenarios.length > 0

  return (
    <AnimatePresence>
      {hasSelection && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ overflow: "hidden" }}
        >
          <Box
            role="status"
            aria-live="polite"
            aria-atomic="true"
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderBottom: theme.border.light,
              px: theme.space.page.x,
              py: theme.space.component.md,
            }}
          >
            {/* Top row: count + Clear button */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: theme.space.gap.md,
                mb: selectedScenarios.length > 0 ? theme.space.gap.sm : 0,
              }}
            >
              <Typography
                variant="overline"
                sx={{ color: theme.palette.grey[500], flexShrink: 0 }}
              >
                {selectedScenarios.length} scenario
                {selectedScenarios.length !== 1 ? "s" : ""} selected
              </Typography>

              <Button
                variant="text"
                size="small"
                onClick={clearScenarios}
                sx={{
                  color: theme.palette.grey[500],
                  minWidth: "auto",
                  flexShrink: 0,
                  px: theme.space.component.sm,
                  "&:hover": {
                    color: theme.palette.grey[700],
                    backgroundColor: theme.palette.grey[100],
                  },
                }}
              >
                Clear
              </Button>
            </Box>

            {/* Chips with dnd-kit sorting */}
            <DndContext
              sensors={sensors}
              collisionDetection={pointerWithin}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={selectedScenarios}>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    alignItems: "center",
                  }}
                >
                  {selectedScenarios.map((scenarioId) => (
                    <SortableChip
                      key={scenarioId}
                      id={scenarioId}
                      label={getDisplayName(scenarioId)}
                      onDelete={() => toggleScenario(scenarioId)}
                    />
                  ))}
                  <EndDropZone />
                </Box>
              </SortableContext>
            </DndContext>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
