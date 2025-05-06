import React from "react"
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  CloseIcon,
  EditIcon,
} from "@repo/ui/mui"
// import CloseIcon from '@mui/icons-material/Close';
import { WaterNeedSetting } from "./types" // Adjust the import path as necessary
import { getRuleText, getTitleText } from "./utils"
import { WATER_NEED_TYPES } from "./constants"
interface AddedWaterNeedsProps {
  waterNeeds: WaterNeedSetting[]
  setWaterNeeds: React.Dispatch<React.SetStateAction<WaterNeedSetting[]>>
  editWaterNeed: (idx: number) => void
}

export default function AddedWaterNeeds({
  waterNeeds,
  setWaterNeeds,
  editWaterNeed,
}: AddedWaterNeedsProps) {
  const onEditNeed = (idxToEdit: number) => {
    editWaterNeed(idxToEdit) // Signal to parent to edit this need
  }

  const onRemoveNeed = (idxToRemove: number) => {
    setWaterNeeds((prevNeeds) => {
      console.log(
        "Removing need at index:",
        idxToRemove,
        "from needs:",
        prevNeeds,
      )
      return prevNeeds.filter((_, index) => index !== idxToRemove)
    })
  }

  const getNeedTitle = (need: WaterNeedSetting) => {
    const currentWaterNeedType = WATER_NEED_TYPES.find(
      (item) => item.label === need.name,
    )
    if (!currentWaterNeedType) {
      return "No title available"
    }
    return getTitleText(need.setting, currentWaterNeedType.titleGrammar)
  }

  const getNeedSummary = (need: WaterNeedSetting) => {
    const currentWaterNeedType = WATER_NEED_TYPES.find(
      (item) => item.label === need.name,
    )
    if (!currentWaterNeedType) {
      return "No summary available"
    }
    return getRuleText(need.setting, currentWaterNeedType.ruleGrammar)
  }

  return (
    <Box
      sx={{
        border: "3px solid #ccc",
        borderRadius: 1,
        p: 2,
        maxWidth: "100%",
      }}
    >
      <Typography variant="h5" gutterBottom>
        Currently Added Water Needs
      </Typography>
      {/* if empty */}
      {waterNeeds?.length === 0 && (
        <Typography variant="h6">No water needs added yet.</Typography>
      )}

      {/* if not empty */}
      {waterNeeds?.length > 0 && (
        <Stack direction="row" flexWrap="wrap">
          {waterNeeds.map(
            (need, id) =>
              need.isUserDefined && (
                <Paper
                  key={id}
                  elevation={1}
                  sx={{
                    borderRadius: 1,
                    border: "1px solid #ddd",
                    p: 2,
                    minWidth: 200,
                    maxWidth: 300,
                  }}
                >
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {need.name}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 1, // Limit to 2 lines
                    }}
                  >
                    {/* {need.name} */}
                    {getNeedTitle(need)}
                  </Typography>
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2, // Limit to 2 lines
                    }}
                  >
                    {/* {need.name} */}
                    {getNeedSummary(need)}
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "row", gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<EditIcon />}
                      sx={{ mt: 1 }}
                      onClick={() => onEditNeed(id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<CloseIcon />}
                      sx={{ mt: 1 }}
                      onClick={() => onRemoveNeed(id)}
                    >
                      Remove
                    </Button>
                  </Box>
                </Paper>
              ),
          )}
        </Stack>
      )}
    </Box>
  )
}
