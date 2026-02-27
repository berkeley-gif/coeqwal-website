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
import { Box, Typography, Button, Chip, useTheme, icons } from "@repo/ui/mui"
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
import { getScenarioTheme } from "../../../content/scenarios"

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
  backgroundColor,
  color,
}: {
  id: string
  label: string
  onDelete: () => void
  backgroundColor?: string
  color?: string
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
          backgroundColor: backgroundColor ?? theme.palette.grey[100],
          color: color ?? theme.palette.blue.darkest,
          fontWeight: theme.typography.fontWeightMedium,
          "& .MuiChip-deleteIcon": {
            color: color ? `${color}99` : theme.palette.grey[400],
            fontSize: "1rem",
            "&:hover": {
              color: color ?? theme.palette.grey[600],
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
              py: theme.space.component.sm,
            }}
          >
            {/* Outer row: [count + wrapping chips] pinned to left, [Clear] pinned to right */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={selectedScenarios}>
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      columnGap: 1,
                      rowGap: 0,
                    }}
                  >
                    <Typography
                      variant="overline"
                      sx={{ color: theme.palette.grey[500], flexShrink: 0, lineHeight: 1 }}
                    >
                      {selectedScenarios.length} scenario
                      {selectedScenarios.length !== 1 ? "s" : ""}:
                    </Typography>

                    {selectedScenarios.map((scenarioId) => {
                      const themeKey = getScenarioTheme(scenarioId)
                      const themeColors = theme.palette.waterThemes[themeKey]
                      return (
                        <SortableChip
                          key={scenarioId}
                          id={scenarioId}
                          label={getDisplayName(scenarioId)}
                          onDelete={() => toggleScenario(scenarioId)}
                          backgroundColor={themeColors?.background}
                          color={themeColors?.text}
                        />
                      )
                    })}
                    <EndDropZone />
                  </Box>
                </SortableContext>
              </DndContext>

              <Button
                variant="text"
                size="small"
                onClick={clearScenarios}
                startIcon={<icons.Close sx={{ fontSize: 14 }} />}
                sx={{
                  color: theme.palette.grey[400],
                  minWidth: "auto",
                  flexShrink: 0,
                  px: theme.space.component.xs,
                  py: 0,
                  "&:hover": {
                    color: theme.palette.grey[600],
                    backgroundColor: theme.palette.grey[100],
                  },
                }}
              >
                Clear
              </Button>
            </Box>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
