import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { Box } from "@repo/ui/mui"
import ScenarioCard from "./ScenarioCard"

interface SortableScenarioCardProps {
  id: string
  title?: string
  scenarioNumber: number
  data?: string | null
  metricType?: string
  isExpanded?: boolean
  onExpand?: () => void
  style?: React.CSSProperties
}

const SortableScenarioCard = React.memo(
  ({
    id,
    title,
    scenarioNumber,
    data,
    metricType,
    isExpanded = false,
    onExpand,
    style: externalStyle = {},
  }: SortableScenarioCardProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id })

    const style = {
      transform: transform
        ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
        : undefined,
      transition,
      zIndex: isDragging ? 6 : 1,
      opacity: isDragging ? 0.8 : 1,
      position: "relative" as const,
      gridColumn: isExpanded ? "1 / -1" : "auto",
      order: isExpanded ? -1 : 0,
      ...externalStyle,
    }

    return (
      <div ref={setNodeRef} style={style} data-expanded={isExpanded}>
        {/* Drag handle */}
        <Box
          sx={{
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 2,
            cursor: "grab",
            color: "rgba(0, 0, 0, 0.5)",
            padding: (theme) => theme.spacing(0.5),
            borderRadius: (theme) => theme.spacing(1),
            background: "rgba(255, 255, 255, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "20px",
            height: "20px",
            fontSize: (theme) => theme.typography.compact.caption.fontSize,
          }}
          // spread operators that apply drag-and-drop functionality from the @dnd-kit/sortable library
          {...attributes} // accessibility attributes that make the draggable element screen-reader friendly
          {...listeners} // event handlers that enable drag functionality
        >
          ⋮⋮
        </Box>
        <Box
          onClick={onExpand}
          sx={{
            position: "absolute",
            top: "10px",
            right: "40px",
            zIndex: 2,
            cursor: "pointer",
            color: "rgba(0, 0, 0, 0.5)",
            padding: (theme) => theme.spacing(0.5),
            borderRadius: (theme) => theme.spacing(1),
            background: "rgba(255, 255, 255, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "20px",
            height: "20px",
            fontSize: (theme) => theme.typography.compact.caption.fontSize,
            fontWeight: "bold",
          }}
        >
          {isExpanded ? "↓" : "↔"}
        </Box>
        <ScenarioCard
          title={title}
          scenarioNumber={scenarioNumber}
          data={data}
          metricType={metricType}
          expanded={isExpanded}
        />
      </div>
    )
  },
)

SortableScenarioCard.displayName = "SortableScenarioCard"

export default SortableScenarioCard
