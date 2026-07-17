import React, { type ElementType, useState } from "react"
import { useFetchData } from "../../hooks/useFetchData"
import FlowLine, { FlowEntry } from "./HydroClimateLine"
import {
  Box,
  Button,
  LocalFireDepartmentIcon,
  Stack,
  Typography,
  WaterDropIcon,
  WbSunnyIcon,
  useTheme,
} from "@repo/ui/mui"

export type ContainerSize = {
  width: number
  height: number
}

type Model = {
  model: string
  background: string
  hover: string
  text: string
  icon: ElementType
}

const models: Model[] = [
  {
    model: "Moderate-wet climate risk",
    background: "#44ce1b",
    hover: "#35a915",
    text: "#fcfbfa",
    icon: WaterDropIcon,
  },
  {
    model: "Moderate-dry climate risk",
    background: "#f7e379",
    hover: "#dfc94f",
    text: "#fcfbfa",
    icon: WbSunnyIcon,
  },
  {
    model: "High climate risk",
    background: "#f2a134",
    hover: "#d8841f",
    text: "#fcfbfa",
    icon: WbSunnyIcon,
  },
  {
    model: "Extreme climate risk",
    background: "#e51f1f",
    hover: "#bf1616",
    text: "#fcfbfa",
    icon: LocalFireDepartmentIcon,
  },
]

const modelQueryMap: Record<string, string> = {
  "Moderate-wet climate risk": "Warmer & Wetter",
  "Moderate-dry climate risk": "Warmer & Drier I",
  "High climate risk": "Warmer & Drier II",
  "Extreme climate risk": "Warmer & Drier III",
}

export default function HydroClimateContainer() {
  const [flowData, setFlowData] = useState<FlowEntry[]>([])
  const [flowYExtents, setFlowYExtents] = useState<[number, number]>([0, 0])
  const [selectedModel, setSelectedModel] = useState<string>(
    "Moderate-wet climate risk",
  )
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
            gap: "0.75rem",
          }}
        >
          <Typography
            variant="body2"
            sx={{ mr: 2, whiteSpace: "nowrap", fontWeight: 700 }}
          >
            {"Examine a hydroclimate:"}
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
        {models.map((model: Model) => {
          const Icon = model.icon
          const isSelected = selectedModel === model.model

          return (
            <Button
              key={model.model}
              variant="contained"
              size="small"
              onClick={() => onSelect(model.model)}
              startIcon={
                <Box
                  component="span"
                  sx={{
                    width: { xs: 20, md: 24 },
                    height: { xs: 20, md: 24 },
                    borderRadius: "50%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: model.background,
                    color: model.text,
                    boxShadow: isSelected
                      ? "0 0 0 2px rgba(252, 251, 250, 0.86)"
                      : "0 0 0 1px rgba(252, 251, 250, 0.45)",
                  }}
                >
                  <Icon sx={{ fontSize: { xs: 14, md: 16 } }} />
                </Box>
              }
              sx={{
                borderRadius: "999px",
                px: { xs: 1.25, md: 1.5 },
                py: { xs: 0.5, md: 0.9 },
                minHeight: { xs: "16px", md: "20px" },
                fontSize: {
                  xs: theme.typography.body2.fontSize,
                  md: theme.typography.caption.fontSize,
                },
                textTransform: "none",
                fontWeight: 700,
                letterSpacing: "0.01em",
                backgroundColor: isSelected
                  ? "rgba(252, 251, 250, 0.16)"
                  : "rgba(252, 251, 250, 0.08)",
                color: "#fcfbfa",
                border: isSelected
                  ? `2px solid ${model.background}`
                  : "1px solid rgba(252, 251, 250, 0.28)",
                boxShadow: isSelected
                  ? "0 0 0 2px rgba(241, 177, 67, 0.26), 0 8px 20px rgba(0, 0, 0, 0.25)"
                  : "0 4px 12px rgba(0, 0, 0, 0.2)",
                "& .MuiButton-startIcon": {
                  mr: 0.75,
                  ml: 0,
                },
                "&:hover": {
                  backgroundColor: "rgba(252, 251, 250, 0.18)",
                  transform: "translateY(-1px)",
                  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.25)",
                },
              }}
            >
              {model.model}
            </Button>
          )
        })}
      </Stack>
    </Box>
  )
}
