import React, { useState, useEffect } from "react"
import {
  TextField,
  Typography,
  Box,
  Stack,
  Paper,
  useTheme,
  Button,
  AddIcon,
  CloseIcon,
  BarChartIcon,
  CheckIcon,
  VisibilityIcon,
} from "@repo/ui/mui"
import { ColoredText } from "../../scenarioResults/components/ui"
import ExceedancePlot from "./ExceedancePlot"

import {
  EditingFieldTarget,
  UserSetting,
  Setting,
  WaterNeedSetting,
} from "./types"

import { WATER_NEED_TYPES } from "./constants"

type EditableNeedsRendererProps = {
  // userSetting: UserSetting
  // setUserSetting: React.Dispatch<React.SetStateAction<UserSetting>>

  currentWaterNeed: WaterNeedSetting
  setCurrentWaterNeed: React.Dispatch<React.SetStateAction<WaterNeedSetting>>
}

const getCurrentFieldValue = (
  editingField: EditingFieldTarget,
  setting: UserSetting,
) => {
  if (editingField.type === "title") {
    return setting.title[editingField.name]?.value || ""
  } else {
    return (
      setting.rule[editingField.ruleIndex]?.[editingField.name]?.value || ""
    )
  }
}

const isInputValid = (dataType: string, value: string | number) => {
  if (value === "" || value === null || value === undefined) {
    return false
  }
  if (dataType === "text") {
    return typeof value === "string"
  } else if (dataType === "float") {
    return !isNaN(Number(value))
  } else if (dataType === "integer") {
    return !isNaN(Number(value)) && Number.isInteger(Number(value))
  } else {
    console.warn(`Unknown data type: ${dataType}`)
    return false
  }
}

const shouldShowExceedancePlot = (
  currentWaterNeed: WaterNeedSetting,
): boolean => {
  // Show the Exceedance Plot only for "Water Delivery" needs and if all units are TAF

  const currentWaterNeedType = WATER_NEED_TYPES.find(
    (item) => item.label === currentWaterNeed.name,
  )

  return (
    currentWaterNeedType?.label === "Water Delivery" &&
    currentWaterNeed.setting.rule
      .map((d) => d["Unit"]?.value === "TAF")
      .every((value) => value === true)
  )
}

const getTargetKey = (target: EditingFieldTarget) =>
  `${target.type}-${target.ruleIndex ?? ""}-${target.index}`

const EditableNeedsRenderer = ({
  // userSetting,
  // setUserSetting,
  currentWaterNeed,
  setCurrentWaterNeed,
}: EditableNeedsRendererProps) => {
  const theme = useTheme()
  const [textFieldTempValue, setTextFieldTempValue] = useState<string | number>(
    "",
  )
  const [editingField, setEditingField] = useState<EditingFieldTarget | null>(
    null,
  )
  const [isShowingSelector, setIsShowingSelector] = useState(false)
  const [isShowingExeedancePlot, setIsShowingExceedancePlot] = useState(false)

  const [userSetting, setUserSetting] = useState<UserSetting>(
    currentWaterNeed.setting,
  )

  useEffect(() => {
    if (!currentWaterNeed) {
      console.warn("currentWaterNeed is null or undefined")
      return
    } else {
      setUserSetting(currentWaterNeed.setting)

      setIsShowingExceedancePlot(
        shouldShowExceedancePlot(currentWaterNeed) && isShowingExeedancePlot,
      )
    }
  }, [currentWaterNeed, isShowingExeedancePlot])

  const currentWaterNeedType = WATER_NEED_TYPES.find(
    (item) => item.label === currentWaterNeed.name,
  )

  if (currentWaterNeedType == null) {
    // console.error(`No water need type found for name: ${currentWaterNeed.name}`)
    return <Box sx={{ color: "red" }}></Box>
  }

  const handleAddRule = () => {
    setCurrentWaterNeed((prev) => {
      const newRule =
        prev.setting.rule.length > 0
          ? JSON.parse(
              JSON.stringify(prev.setting.rule[prev.setting.rule.length - 1]),
            )
          : JSON.parse(
              JSON.stringify(currentWaterNeedType.defaultSetting.rule[0]),
            )
      return {
        ...prev,
        setting: { ...prev.setting, rule: [...prev.setting.rule, newRule] },
      }
    })
  }

  const {
    titleGrammar: TITLE_GRAMMAR = "",
    titleDataType: TITLE_DATA_TYPE = {},
    ruleGrammar: RULE_GRAMMAR = "",
    ruleGrammarDataType: RULE_DATA_TYPE = {},
    fieldOptions: OPTIONS = {},
  } = currentWaterNeedType

  const handleFieldChange = (
    fieldName: string,
    value: string | number,
    target: EditingFieldTarget,
  ) => {
    if (target.type === "title") {
      const newTitleSetting = userSetting.title
      if (!newTitleSetting[fieldName]) {
        console.warn(`Field ${fieldName} does not exist in title setting`)
        return
      }
      newTitleSetting[fieldName].value = value as string

      setCurrentWaterNeed((prev) => {
        const newSetting = {
          ...prev.setting,
          title: newTitleSetting,
        }
        return {
          ...prev,
          setting: newSetting,
        }
      })
    } else {
      const editingRuleIndex = target.ruleIndex
      const newRuleSetting = [...userSetting.rule]
      if (!newRuleSetting[editingRuleIndex]?.[fieldName]) {
        console.warn(
          `Rule at index ${editingRuleIndex} does not exist in rule setting`,
        )
        return
      }
      newRuleSetting[editingRuleIndex][fieldName].value = value

      setCurrentWaterNeed((prev) => {
        const newSetting = {
          ...prev.setting,
          rule: newRuleSetting,
        }
        return {
          ...prev,
          setting: newSetting,
        }
      })
    }
  }

  const removeRule = (ruleIndex: number) => {
    const prevRuleSetting = [...userSetting.rule]
    prevRuleSetting.splice(ruleIndex, 1)

    setCurrentWaterNeed((prev) => {
      const newSetting = {
        ...prev.setting,
        rule: prevRuleSetting,
      }
      return {
        ...prev,
        setting: newSetting,
      }
    })
  }

  const splitStringBySpaces = (str: string) => {
    // Split by spaces, but keep the spaces
    const parts = str.split(/(\s+)/)
    return parts.map((part) => <>{part}</>)
  }

  const renderPart = (
    setting: Setting,
    part: string,
    target: EditingFieldTarget,
  ) => {
    const match = part.match(/^\[(.+?)\]$/)
    const i = target.index
    if (!match) {
      return (
        <Box key={i} component="span">
          {/* Split by spaces, but keep the spaces */}
          {splitStringBySpaces(part).map((part, index) => (
            <React.Fragment key={index}>{part}</React.Fragment>
          ))}
        </Box>
      )
    }

    const key = match?.[1] || ""
    const value = setting?.[key]?.value
    const meta =
      target.type === "title" ? TITLE_DATA_TYPE?.[key] : RULE_DATA_TYPE?.[key]

    if (value == null || meta == null) {
      console.warn(
        `Missing ${!value ? "value" : "meta"} for key: ${key} in target:`,
        target,
      )
      return (
        <Box key={i} component="span">
          {part}
        </Box>
      )
    }

    const hydratedTarget = {
      ...target,
      name: key ? key : "",
      dataType: meta,
    }

    const isFieldSelected =
      editingField &&
      getTargetKey(editingField) === getTargetKey(hydratedTarget)

    return (
      <Box key={i} component="span">
        {/* Split by spaces, but keep the spaces */}
        {splitStringBySpaces(value.toString() as string).map((part, index) => (
          <Box
            component="span"
            key={index}
            sx={{
              textDecoration: "underline",
              whiteSpace: "normal",
              cursor: "pointer",
              fontWeight: "bold",
            }}
            onClick={() => {
              setEditingField(hydratedTarget)
              setTextFieldTempValue(
                getCurrentFieldValue(hydratedTarget, userSetting),
              )
              setIsShowingSelector(true)
            }}
          >
            {isFieldSelected ? (
              <ColoredText color={theme.palette.pop.main}>
                <React.Fragment key={index}>{part}</React.Fragment>
              </ColoredText>
            ) : (
              <React.Fragment key={index}>{part}</React.Fragment>
            )}
          </Box>
        ))}
      </Box>
    )
  }

  const titleParts = TITLE_GRAMMAR.split(/(\[.*?\])/) // Split by [fields]
  // split by spaces, but keep the spaces
  const ruleParts = userSetting.rule.map(() => RULE_GRAMMAR.split(/(\[.*?\])/)) // Split by [fields]

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          overflow: "auto",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "start",
            justifyContent: "center",
            flex: 1,
          }}
        >
          <Box sx={{}}>
            <Typography variant="h3">
              {titleParts.map((part, i) => (
                <Box component="span" key={i}>
                  {renderPart(userSetting.title, part, {
                    type: "title",
                    index: i,
                    ruleIndex: 0,
                    dataType: "",
                    name: "",
                  })}
                </Box>
              ))}
            </Typography>
          </Box>
          <Box
            sx={{
              mt: 4,
              width: "100%",
              display: "flex",
            }}
          >
            <Typography variant="h5" sx={{ width: "100%" }}>
              {ruleParts.map((rulePart, ruleIndex) => (
                <Box
                  key={ruleIndex}
                  sx={{
                    mb: 2,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "start",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    {ruleIndex > 0 && (
                      <Typography
                        key={`rule-separator-and-${ruleIndex}`}
                        variant="h4"
                        sx={{ display: "inline", mx: 0.5 }}
                      >
                        and
                      </Typography>
                    )}
                    {rulePart.map(
                      (part, i) =>
                        userSetting.rule[ruleIndex] &&
                        renderPart(userSetting.rule[ruleIndex], part, {
                          type: "rule",
                          ruleIndex: ruleIndex,
                          index: i,
                          dataType: "",
                          name: "",
                        }),
                    )}
                    {ruleIndex < ruleParts.length - 1 &&
                      ruleParts.length > 2 && (
                        <Typography
                          key={`rule-separator-comma-${ruleIndex}`}
                          variant="h4"
                          sx={{ display: "inline", mx: 0.5 }}
                        >
                          ,
                        </Typography>
                      )}
                    {ruleIndex == ruleParts.length - 1 && (
                      <Typography
                        key={`rule-separator-period-${ruleIndex}`}
                        variant="h4"
                        sx={{ display: "inline", mx: 0.5 }}
                      >
                        .
                      </Typography>
                    )}
                  </Box>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<CloseIcon />}
                    onClick={() => removeRule(ruleIndex)}
                    sx={{
                      height: "fit-content",
                    }}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
            </Typography>
          </Box>
        </Box>

        {/* The Divider */}
        {isShowingSelector && (
          <Box
            sx={{
              width: "5px",
              backgroundColor: "#ccc",
              mx: 2,
            }}
            id="divider"
          />
        )}

        {/* User Input To Change Field Values */}
        {isShowingSelector && editingField?.dataType === "text" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "start",
                mb: 2,
              }}
            >
              <Button
                variant="text"
                size="small"
                endIcon={<VisibilityIcon />}
                sx={{
                  textTransform: "none",
                  color: "black",
                  "&:hover": { background: "lightgrey" },
                }}
                onClick={() => {
                  // Add your "Learn More" action here
                  console.log("Learn more clicked")
                }}
              >
                What&apos;s this?
              </Button>
              <Typography variant="h5">
                <>Select</> <>a</>
                <ColoredText color={theme.palette.pop.main}>
                  {" "}
                  {editingField.name}
                </ColoredText>
              </Typography>
            </Box>
            <Stack direction="column" spacing={2} flexWrap="wrap">
              {OPTIONS[editingField.name]?.map((option, i) => {
                const curEditingField =
                  editingField.type === "title"
                    ? userSetting.title
                    : userSetting.rule[editingField.ruleIndex]

                const isSelected =
                  curEditingField &&
                  curEditingField[editingField.name]?.value === option
                return (
                  <Paper
                    key={i}
                    elevation={1}
                    sx={{
                      p: 1,
                      cursor: "pointer",
                      backgroundColor: isSelected
                        ? "primary.main"
                        : "primary.light",

                      color: isSelected
                        ? "text.primary"
                        : "primary.contrastText",
                    }}
                    onClick={() => {
                      handleFieldChange(editingField.name, option, editingField)
                      setIsShowingSelector(false)
                      setEditingField(null)
                    }}
                  >
                    <Typography variant="h6">{option}</Typography>
                  </Paper>
                )
              })}
            </Stack>
            <Button
              variant="outlined"
              color="primary"
              sx={{
                borderColor: "black",
                color: "black",
                width: "fit-content",
                height: "fit-content",
              }}
              startIcon={<CloseIcon />}
              onClick={() => {
                setIsShowingSelector(false)
                setEditingField(null)
              }}
            >
              Close
            </Button>
          </Box>
        )}

        {isShowingSelector &&
          (editingField?.dataType === "float" ||
            editingField?.dataType === "integer") && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="h5" sx={{ mb: 2 }}>
                Edit
                <ColoredText color={theme.palette.pop.main}>
                  {" "}
                  {editingField.name}
                </ColoredText>
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  value={textFieldTempValue}
                  // error
                  error={
                    !isInputValid(editingField.dataType, textFieldTempValue)
                  } // Show error if not a number
                  helperText={
                    !isInputValid(editingField.dataType, textFieldTempValue)
                      ? "Please enter a valid input"
                      : ""
                  }
                  onChange={(newValue: React.ChangeEvent<HTMLInputElement>) => {
                    setTextFieldTempValue(newValue.target.value)
                  }}
                />
                <Box
                  sx={{
                    height: "auto",
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  {textFieldTempValue !==
                    getCurrentFieldValue(editingField, userSetting) && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Button
                        variant="outlined"
                        color="success"
                        sx={{
                          borderColor: "success.main",
                        }}
                        disabled={
                          !isInputValid(
                            editingField.dataType,
                            textFieldTempValue,
                          )
                        }
                        startIcon={<CheckIcon />}
                        onClick={() => {
                          handleFieldChange(
                            editingField.name,
                            textFieldTempValue,
                            editingField,
                          )
                          setIsShowingSelector(false)
                          setEditingField(null)
                        }}
                      >
                        Change
                      </Button>
                    </Box>
                  )}
                  <Button
                    variant="outlined"
                    color="primary"
                    sx={{
                      borderColor: "black",
                      color: "black",
                      width: "fit-content",
                      height: "fit-content",
                    }}
                    startIcon={<CloseIcon />}
                    onClick={() => {
                      setIsShowingSelector(false)
                      setEditingField(null)
                    }}
                  >
                    Close
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
      </Box>
      {isShowingExeedancePlot &&
        currentWaterNeedType.label == "Water Delivery" && (
          <Box
            sx={{ display: "flex", width: "100%", justifyContent: "center" }}
          >
            <ExceedancePlot
              currentWaterNeed={currentWaterNeed}
              width={500}
              height={200}
            />
          </Box>
        )}

      <Stack direction="row" spacing={2} sx={{}}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddRule}
          size="small"
          sx={{ color: "black", borderColor: "black" }}
        >
          Add another rule
        </Button>
        {shouldShowExceedancePlot(currentWaterNeed) && (
          <Button
            variant="outlined"
            startIcon={<BarChartIcon />}
            size="small"
            sx={{ color: "black", borderColor: "black" }}
            onClick={() => {
              setIsShowingExceedancePlot(!isShowingExeedancePlot)
            }}
          >
            Toggle Exceedance Plot
          </Button>
        )}
      </Stack>
    </Box>
  )
}

export default EditableNeedsRenderer
