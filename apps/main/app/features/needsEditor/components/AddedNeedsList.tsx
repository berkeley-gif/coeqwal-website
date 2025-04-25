import React from "react"
import { Box, Typography, Paper, Button, Stack, CloseIcon } from "@repo/ui/mui"
// import CloseIcon from '@mui/icons-material/Close';
import { WaterNeedSetting } from "./types" // Adjust the import path as necessary
interface AddedWaterNeedsProps {
  waterNeeds: WaterNeedSetting[]
  setWaterNeeds: React.Dispatch<React.SetStateAction<WaterNeedSetting[]>>
}

export default function AddedWaterNeeds({
  waterNeeds,
  setWaterNeeds,
}: AddedWaterNeedsProps) {
  const onRemoveNeed = (idxToRemove: number) => {
    setWaterNeeds((prevNeeds) => {
      console.log(
        "Removing need at index:",
        idxToRemove,
        "from needs:",
        prevNeeds,
      )
      prevNeeds.splice(idxToRemove, 1)
      return [...prevNeeds]
    })
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
        <Stack direction="row" spacing={2} flexWrap="wrap">
          {waterNeeds.map((need, id) => (
            <Paper
              key={id}
              elevation={1}
              sx={{
                borderRadius: 1,
                border: "1px solid #ddd",
                p: 2,
                minWidth: 200,
                maxWidth: 240,
              }}
            >
              <Typography fontWeight="bold">{need.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {need.name}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CloseIcon />}
                sx={{ mt: 1 }}
                onClick={() => onRemoveNeed(id)}
              >
                Remove
              </Button>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  )
}
