import { Box, Chip, Typography } from "@repo/ui/mui"
import { WaterNeedSetting } from "../components/types" // Adjust the import path as necessary
import {
  WATER_NEED_TYPES,
  SYNERGY_COLOR,
  UNSATISFIABLE_COLOR,
} from "../components/constants"
import { getTitleText, getRuleText } from "../components/utils"

type NeedCardProps = {
  currentWaterNeedSetting: WaterNeedSetting
}

const NeedCard = ({ currentWaterNeedSetting }: NeedCardProps) => {
  return (
    <Box>
      <Box
        sx={{
          border: "3px solid #ccc",
          borderRadius: 1,
          width: "fit-content",
          p: 2,
        }}
      >
        <Typography variant="h4" sx={{ mb: 2 }}>
          {currentWaterNeedSetting?.setting?.title
            ? getTitleText(
                currentWaterNeedSetting.setting,
                WATER_NEED_TYPES.find(
                  (item) => item.label === currentWaterNeedSetting.name,
                )?.titleGrammar || "",
              )
            : "No title available"}
        </Typography>
        <Typography variant="h5">
          {currentWaterNeedSetting?.setting?.rule
            ? getRuleText(
                currentWaterNeedSetting.setting,
                WATER_NEED_TYPES.find(
                  (item) => item.label === currentWaterNeedSetting.name,
                )?.ruleGrammar || "",
              )
            : "No rule available"}
        </Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          width: "fit-content",
        }}
      >
        <Chip
          label={`${
            currentWaterNeedSetting?.isUserDefined
              ? "👤 Defined by You!"
              : "⚙️ A Predefined need known to COEQWAL"
          }`}
          color={currentWaterNeedSetting?.isUserDefined ? "default" : "default"}
        />
        {!currentWaterNeedSetting?.isSelected && (
          <Chip
            label={`${
              currentWaterNeedSetting?.isSatisfiable
                ? "✅ Satisfiable"
                : "⚠️ Unsatisfiable with current selection"
            }`}
            sx={{
              backgroundColor: currentWaterNeedSetting?.isSatisfiable
                ? SYNERGY_COLOR
                : UNSATISFIABLE_COLOR,
            }}
          />
        )}
      </Box>
      {!currentWaterNeedSetting?.isSatisfiable &&
        !currentWaterNeedSetting?.isSelected && (
          <Box>
            <Typography variant="h5" sx={{}}>
              Why isn&apos;t this need satisfiable?
            </Typography>
            <Typography variant="h6" sx={{}}>
              This water need is in conflict with [Water Need Name]
            </Typography>
          </Box>
        )}
    </Box>
  )
}

export default NeedCard
