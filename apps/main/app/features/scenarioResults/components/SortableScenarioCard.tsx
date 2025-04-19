import React from "react"
import { useSortable } from "@dnd-kit/sortable"
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
      zIndex: isDragging ? 10 : 1,
      opacity: isDragging ? 0.8 : 1,
      position: "relative" as const,
      ...externalStyle,
    }

    return (
      <div ref={setNodeRef} style={style}>
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 2,
            cursor: "grab",
            color: "rgba(0, 0, 0, 0.5)",
            padding: "4px",
            borderRadius: "4px",
            background: "rgba(255, 255, 255, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "20px",
            height: "20px",
          }}
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </div>
        <div
          onClick={onExpand}
          style={{
            position: "absolute",
            top: "10px",
            right: "40px",
            zIndex: 2,
            cursor: "pointer",
            color: "rgba(0, 0, 0, 0.5)",
            padding: "4px",
            borderRadius: "4px",
            background: "rgba(255, 255, 255, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "20px",
            height: "20px",
            fontWeight: "bold",
          }}
        >
          {isExpanded ? "↓" : "↔"}
        </div>
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
