import { Box, Typography } from "@repo/ui/mui"
import { WaterNeedSetting } from "./types" // Adjust the import path as necessary
import { getTitleText, getRuleText } from "./utils"
import { WATER_NEED_TYPES } from "./constants"

type ActionPanelProps = {
  finalNeedsList: WaterNeedSetting[]
}
const ActionPanel = ({ finalNeedsList }: ActionPanelProps) => {
  const scenarioIDS = [3, 45, 90, 800]
  const policies = ["Policy A", "Policy B", "Policy C"]
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-between",
        "& > *": {
          flex: 1,
          margin: "0 8px",
        },
      }}
    >
      <Box>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Selected Water Needs
        </Typography>
        {finalNeedsList.map((need, index) => (
          <Box
            key={index}
            sx={{ p: 2, border: "1px solid #ccc", mb: 2, borderRadius: 1 }}
          >
            <Typography variant="h6">
              {need.setting?.title
                ? getTitleText(
                    need.setting,
                    WATER_NEED_TYPES.find((item) => item.label === need.name)
                      ?.titleGrammar || "",
                  )
                : "No title available"}
            </Typography>
            <Typography variant="body1">
              {need?.setting?.rule
                ? getRuleText(
                    need.setting,
                    WATER_NEED_TYPES.find((item) => item.label === need.name)
                      ?.ruleGrammar || "",
                  )
                : "No rule available"}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box>
        <Typography variant="h4" sx={{ mb: 2 }}>
          COEQWAL Scenarios that satisfy these needs
          <br />
          <span style={{ fontStyle: "italic", fontSize: "0.8em" }}>
            [Dev note: currently random...]
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
      <Box>
        <Typography variant="h4" sx={{ mb: 2 }}>
          How to realize these scenarios?
          <br />
          <span style={{ fontStyle: "italic", fontSize: "0.8em" }}>
            [Dev note: currently random...]
          </span>
        </Typography>
        {policies.map((policy) => (
          <Box
            key={policy}
            sx={{ p: 2, border: "1px solid #ccc", mb: 2, borderRadius: 1 }}
          >
            <Typography variant="h5">{policy}</Typography>
            <Typography variant="h6">
              📒 [Policy description for {policy} goes here.]
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default ActionPanel
