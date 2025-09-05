import React from "react"
import EditableNeedsRenderer from "./EditableNeedsRenderer"
import { Box, Typography, Button, CheckIcon } from "@repo/ui/mui"
import { WaterNeedSetting } from "./types" // Adjust the import path as necessary
import { BLANK_WATER_NEED } from "./constants"
import { useTheme } from "@repo/ui/mui"

type MapFunctions = {
  addSource: (id: string, data: any) => void
  addLayer: (id: string, sourceId: string, type: string, paint: any, layout?: any) => void
  removeLayer: (id: string) => void
  removeSource: (id: string) => void
  hasSource: (id: string) => boolean
  hasLayer: (id: string) => boolean
  flyTo: (longitude: number, latitude: number, zoom: number, pitch?: number, bearing?: number) => void
}

type WaterNeedEditorProps = {
  currentWaterNeed: WaterNeedSetting
  setCurrentWaterNeed: React.Dispatch<React.SetStateAction<WaterNeedSetting>>
  setNeedsList: React.Dispatch<React.SetStateAction<WaterNeedSetting[]>>
  mapFunctions?: MapFunctions
}

const WaterNeedEditor = ({
  currentWaterNeed,
  setCurrentWaterNeed,
  setNeedsList,
  mapFunctions,
}: WaterNeedEditorProps) => {
  const addNeedToList = () => {
    // Add to list and clear current need
    setNeedsList((prevList) => {
      return [...prevList, currentWaterNeed]
    })
    setCurrentWaterNeed(BLANK_WATER_NEED)
  }

  const theme = useTheme()

  return (
    <Box
      sx={{
        border: "3px solid #ccc",
        borderRadius: 1,
        textAlign: "left",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-evenly",
      }}
    >
      {currentWaterNeed.name == "" && (
        <Box
          sx={{
            p: 2,
            textAlign: "center",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Typography variant="h6">
            Select a Water Need to Add from the left
          </Typography>
        </Box>
      )}
      {currentWaterNeed.name && (
        <Box
          sx={{
            p: 2,
            gap: 2,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <EditableNeedsRenderer
            currentWaterNeed={currentWaterNeed}
            setCurrentWaterNeed={setCurrentWaterNeed}
            mapFunctions={mapFunctions}
          />

          <Button
            variant="outlined"
            startIcon={<CheckIcon />}
            size="medium"
            onClick={addNeedToList}
            sx={{
              color: theme.palette.primary.dark,
              borderColor: theme.palette.primary.dark,
              width: "fit-content",
            }}
          >
            Add this Water Need!
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default WaterNeedEditor
