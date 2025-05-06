"use client"

import React, { useState } from "react"
import {
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Button,
  Box,
  ExpandMoreIcon,
  ArrowRightIcon,
} from "@repo/ui/mui"

import AddedWaterNeeds from "./AddedNeedsList"
import WaterNeedEditor from "./WaterNeedEditor"
import BucketScene from "./NeedsBuckets"
import ActionPanel from "./ActionPanel"
import TutorialSlider from "./TutorialSlider"
import { WaterNeedSetting } from "./types"

import { WATER_NEED_TYPES, BLANK_WATER_NEED } from "./constants"

const waterNeedSettings: WaterNeedSetting[] = []

const NeedsEditorPanel: React.FC = () => {
  const theme = useTheme()
  const [expanded, setExpanded] = useState("")
  const [needsList, setNeedsList] = useState(waterNeedSettings)
  const [showTutorial, setShowTutorial] = useState(true)
  const [showBucketScene, setShowBucketScene] = useState(false)
  const [showActionPanel, setShowActionPanel] = useState(false)

  const [currentWaterNeedSetting, setCurrentWaterNeedSetting] =
    useState<WaterNeedSetting>(BLANK_WATER_NEED)

  const addNewNeed = (type: string) => {
    const defaultSetting = WATER_NEED_TYPES.find(
      (item) => item.label === type,
    )?.defaultSetting
    if (!defaultSetting) {
      return
    }
    // console.log("Adding new need of type:", type, "with default setting:", defaultSetting)

    const newNeed: WaterNeedSetting = {
      name: type,
      setting: JSON.parse(JSON.stringify(defaultSetting)),
    }

    setCurrentWaterNeedSetting(newNeed)
    setExpanded("")
  }

  const handleAccordionChange = (panelName: string) => () => {
    setExpanded((prevExpanded) => (prevExpanded === panelName ? "" : panelName))
  }

  const handleEditWaterNeed = (idx: number) => {
    const needToEdit = needsList[idx]
    if (!needToEdit) return
    console.log("Editing need at index:", idx, "need:", needToEdit)
    setNeedsList((prevNeeds) => {
      console.log(
        "Removing need at index:",
        needToEdit,
        "from needs:",
        prevNeeds,
      )
      return prevNeeds.filter((_, index) => index !== idx)
    })

    setCurrentWaterNeedSetting(needToEdit)
    setShowBucketScene(false) // Close the bucket scene if open
  }

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        width: "100%",
        height: "fit-content",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative", // Added for overlay positioning
      }}
    >
      {showTutorial && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0)", // Semi-transparent dark overlay
            backdropFilter: "blur(2px)", // Bokeh effect
            zIndex: 10, // Ensure it overlays other content
          }}
        >
          <TutorialSlider onFinish={() => setShowTutorial(false)} />
        </Box>
      )}
      {!showBucketScene && !showActionPanel && (
        <Box
          sx={{
            width: "90%",
            height: "fit-content",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="h3" sx={{ mb: 2 }}>
            <span style={{ fontStyle: "italic" }}>Water Needs</span>-based
            search
          </Typography>
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                maxWidth: "25%",
                p: 2,
              }}
            >
              <Typography variant="h4" sx={{ mb: 1 }}>
                Water Need Types
              </Typography>
              {WATER_NEED_TYPES.map((item) => (
                <Accordion
                  key={item.label}
                  expanded={expanded === item.label}
                  onChange={handleAccordionChange(item.label)}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight="bold">{item.label}</Typography>
                  </AccordionSummary>
                  {item.description && (
                    <AccordionDetails>
                      <Typography
                        variant="h6"
                        sx={{ display: "flex", alignItems: "center" }}
                      >
                        {item.description}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={() => addNewNeed(item.label)}
                      >
                        Add
                      </Button>
                    </AccordionDetails>
                  )}
                </Accordion>
              ))}
            </Box>
            <Box
              sx={{
                flex: 1,
                p: 2,
                height: "100%",
              }}
              id="needs-editor-panel"
            >
              <WaterNeedEditor
                currentWaterNeed={currentWaterNeedSetting}
                setCurrentWaterNeed={setCurrentWaterNeedSetting}
                setNeedsList={setNeedsList}
              />
            </Box>
          </Box>
          <Box
            sx={{
              p: 2,
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "end",
              gap: 2,
            }}
          >
            <Box sx={{ flexGrow: 1 }}>
              <AddedWaterNeeds
                waterNeeds={needsList}
                setWaterNeeds={setNeedsList}
                editWaterNeed={handleEditWaterNeed}
              />
            </Box>
            {needsList.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<ArrowRightIcon />}
                size="medium"
                onClick={() => setShowBucketScene(true)}
                sx={{
                  color: "black",
                  borderColor: "black",
                  width: "fit-content",
                  height: "fit-content",
                }}
              >
                Continue
              </Button>
            )}
          </Box>
        </Box>
      )}
      {showBucketScene && (
        <Box
          sx={{
            width: "90%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <BucketScene
            needsList={needsList}
            height={600}
            editWaterNeed={handleEditWaterNeed}
            finishWaterNeed={(selectedNeedsList) => {
              setNeedsList(selectedNeedsList)
              setShowBucketScene(false)
              setTimeout(() => setShowActionPanel(true), 0)
            }}
          />
        </Box>
      )}
      {showActionPanel && (
        <Box
          sx={{
            width: "90%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <ActionPanel finalNeedsList={needsList} />
        </Box>
      )}
    </Box>
  )
}

export default NeedsEditorPanel
