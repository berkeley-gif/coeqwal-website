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
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            minHeight: { xs: "5.5rem", md: "6rem", lg: "10%" },
            width: "100%",
            display: "flex",
            alignItems: { xs: "flex-start", lg: "center" },
            justifyContent: "flex-start",
            flexDirection: { xs: "column", lg: "row" },
            mb: { xs: 1, lg: 2 },
            gap: { xs: 0.5, lg: 1.5 },
            "@media (min-width: 750px) and (max-width: 899.95px)": {
              minHeight: "10rem",
            },
            "@media (min-width: 900px) and (max-width: 1399.95px)": {
              minHeight: "8rem",
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              mr: { xs: 0, lg: 2 },
              whiteSpace: "nowrap",
              fontWeight: "fontWeightBold",
            }}
          >
            {"Examine a hydroclimate:"}
          </Typography>
          <ClimateModelSelector
            onSelect={onModelSelect}
            selectedModel={selectedModel}
          />
        </Box>
        {selectedModel && (
          <FlowLine
            selected={selectedModel}
            data={flowData.filter((d) => d.model === selectedDataModel)}
            yExtents={flowYExtents}
          />
        )}
      </Box>
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
  return (
    <Box
      width="100%"
      height="100%"
      role="group"
      aria-label="Hydroclimate scenario"
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
      }}
    >
      <Stack
        direction="row"
        spacing={{ xs: 0.5, md: 0.75, lg: 1.5 }}
        useFlexGap
        sx={{
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          px: 0,
          "@media (min-width: 750px) and (max-width: 1399.95px)": {
            flexDirection: "column",
            alignItems: "stretch",
          },
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
              aria-pressed={isSelected}
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
                px: { xs: 1, md: 1.25, lg: 1.5 },
                py: { xs: 0.35, md: 0.55, lg: 0.9 },
                minHeight: { xs: "16px", md: "20px" },
                typography: "dashboardBold",
                textTransform: "none",
                "@media (min-width: 750px) and (max-width: 1399.95px)": {
                  justifyContent: "flex-start",
                },
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
