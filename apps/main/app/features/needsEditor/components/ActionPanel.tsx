import { Box, Typography } from "@repo/ui/mui"
import { WaterNeedSetting } from "./types" // Adjust the import path as necessary
import NeedCard from "../ui/NeedCard"

type ActionPanelProps = {
  finalNeedsList: WaterNeedSetting[]
}
const ActionPanel = ({ finalNeedsList }: ActionPanelProps) => {
  const scenarioIDS = [3, 45, 90, 800]
  const operations = ["Operation A", "Operation B", "Operation C"]
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        gap: 4,
        justifyContent: "space-between",
        "& > *": {
          flex: 1,
          margin: "0 8px",
        },
        position: "relative",
      }}
    >
      <Box>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Selected Water Needs
        </Typography>
        {finalNeedsList.map((need, index) => (
          <Box sx={{ mb: 2 }} key={index}>
            <NeedCard currentWaterNeedSetting={need} />
          </Box>
        ))}
      </Box>
      <Box
        sx={{
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "-16px",
            width: "3px",
            backgroundColor: "#ccc",
          },
        }}
      >
        <Typography variant="h4" sx={{ mb: 2 }}>
          COEQWAL Scenarios that satisfy these needs
          <br />
          <span style={{ fontStyle: "italic", fontSize: "0.8em" }}>
            [Development note: currently random.]
          </span>
        </Typography>
        {scenarioIDS.map((id) => (
          <Box
            key={id}
            sx={{ p: 2, border: "1px solid #ccc", mb: 2, borderRadius: 1 }}
          >
            <Typography variant="h5">Scenario ID: {id}</Typography>
            <Typography variant="h6">
              🔎 [Scenario description for ID {id} goes here.]
            </Typography>
          </Box>
        ))}
      </Box>
      <Box
        sx={{
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "-16px",
            width: "3px",
            backgroundColor: "#ccc",
          },
        }}
      >
        <Typography variant="h4" sx={{ mb: 2 }}>
          How to realize these scenarios?
          <br />
          <span style={{ fontStyle: "italic", fontSize: "0.8em" }}>
            [Development note: currently random.]
          </span>
        </Typography>
        {operations.map((operation) => (
          <Box
            key={operation}
            sx={{ p: 2, border: "1px solid #ccc", mb: 2, borderRadius: 1 }}
          >
            <Typography variant="h5">{operation}</Typography>
            <Typography variant="h6">
              📒 [Operation change description for {operation} goes here.]
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default ActionPanel
