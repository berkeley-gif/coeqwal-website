import React, { useState } from "react"
import { useFetchData } from "../../hooks/useFetchData"
import FlowLine, { FlowEntry } from "./HydroClimateLine"
import { Box, Button, Stack, Typography, useTheme } from "@repo/ui/mui"

export type ContainerSize = {
  width: number
  height: number
}

type Model = {
  model: string
  background: string
  hover: string
  text: string
}

const models: Model[] = [
  {
    model: "Moderate climate risk",
    background: "#c28433",
    hover: "rgb(160, 101, 25)",
    text: "#fcfbfa",
  },
  {
    model: "High climate risk",
    background: "#a72525",
    hover: "#961919",
    text: "#fcfbfa",
  },
  {
    model: "Extreme climate risk",
    background: "#5c0b0b",
    hover: "#460909",
    text: "#fcfbfa",
  },
]

const modelQueryMap: Record<string, string> = {
  "Moderate climate risk": "Warmer & Drier I",
  "High climate risk": "Warmer & Drier II",
  "Extreme climate risk": "Warmer & Drier III",
}

export default function HydroClimateContainer() {
  const [flowData, setFlowData] = useState<FlowEntry[]>([])
  const [flowYExtents, setFlowYExtents] = useState<[number, number]>([0, 0])
  const [selectedModel, setSelectedModel] = useState<string>("")
  const selectedDataModel = modelQueryMap[selectedModel] ?? selectedModel

  useFetchData(
    "./data/hydroclimate_streamflow_change.json",
    (rawData: FlowEntry[]) => {
      const processedData = rawData.filter((d) => d.model !== "Historical")
      const allValues = processedData.flatMap((d) => [d.Qone, d.Qthree])
      const maxAbs = Math.ceil(Math.max(...allValues.map(Math.abs)))
      setFlowData(processedData)
      setFlowYExtents([-maxAbs, maxAbs])
    },
  )

  function onModelSelect(model: string) {
    setSelectedModel(model)
  }

  return (
    <>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            height: "10%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            marginBottom: "1rem",
          }}
        >
          <Typography
            variant="body2"
            sx={{ mr: 2, whiteSpace: "nowrap", fontWeight: 700 }}
          >
            {"Choose a hydroclimate:"}
          </Typography>
          <ClimateModelSelector
            onSelect={onModelSelect}
            selectedModel={selectedModel}
          />
        </div>
        {selectedModel && (
          <FlowLine
            selected={selectedModel}
            data={flowData.filter((d) => d.model === selectedDataModel)}
            yExtents={flowYExtents}
          />
        )}
        {!selectedModel && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "50%",
            }}
          >
            <Typography variant="body1">
              Click a <span className="highlight-text">hydroclimate</span> above
              to see how the river flows change across months in a year!
            </Typography>
          </div>
        )}
      </div>
    </>
  )
}

function ClimateModelSelector({
  onSelect,
  selectedModel,
}: {
  onSelect: (model: string) => void
  selectedModel: string
}) {
  const theme = useTheme()

  return (
    <Box
      width="100%"
      height="100%"
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          px: 2,
        }}
      >
        {models.map((model: Model, idx) => (
          <Button
            key={idx}
            variant="contained"
            size="small"
            onClick={() => onSelect(model.model)}
            sx={{
              borderRadius: "999px",
              px: { xs: 1, md: 2 },
              py: { xs: 0.5, md: 0.9 },
              minHeight: { xs: "16px", md: "20px" },
              fontSize: {
                xs: theme.typography.body2.fontSize,
                md: theme.typography.caption.fontSize,
              },
              textTransform: "none",
              fontWeight: 700,
              letterSpacing: "0.01em",
              backgroundColor:
                selectedModel === model.model ? model.hover : model.background,
              color: selectedModel === model.model ? "#ffffff" : model.text,
              border:
                selectedModel === model.model
                  ? "2px solid rgba(252, 251, 250, 0.92)"
                  : "1px solid rgba(252, 251, 250, 0.35)",
              boxShadow:
                selectedModel === model.model
                  ? "0 0 0 2px rgba(241, 177, 67, 0.26), 0 8px 20px rgba(0, 0, 0, 0.25)"
                  : "0 4px 12px rgba(0, 0, 0, 0.2)",
              "&:hover": {
                backgroundColor: model.hover,
                transform: "translateY(-1px)",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.25)",
              },
            }}
          >
            {model.model}
          </Button>
        ))}
      </Stack>
    </Box>
  )
}
