import React from "react"
import EditableNeedsRenderer from "./EditableNeedsRenderer"
import { Box, Typography, Button, CheckIcon } from "@repo/ui/mui"
import { WaterNeedSetting } from "./types" // Adjust the import path as necessary
import { BLANK_WATER_NEED } from "./constants"

type WaterNeedEditorProps = {
  currentWaterNeed: WaterNeedSetting
  setCurrentWaterNeed: React.Dispatch<React.SetStateAction<WaterNeedSetting>>
  setNeedsList: React.Dispatch<React.SetStateAction<WaterNeedSetting[]>>
}

const WaterNeedEditor = ({
  currentWaterNeed,
  setCurrentWaterNeed,
  setNeedsList,
}: WaterNeedEditorProps) => {
  const addNeedToList = () => {
    // Add to list and clear current need
    setNeedsList((prevList) => {
      return [...prevList, currentWaterNeed]
    })
    setCurrentWaterNeed(BLANK_WATER_NEED)
  }

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
          />

          <Button
            variant="outlined"
            startIcon={<CheckIcon />}
            size="medium"
            onClick={addNeedToList}
            sx={{
              color: "black",
              borderColor: "black",
              width: "fit-content",
            }}
          >
            I&apos;m done with this Water Need!
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default WaterNeedEditor
