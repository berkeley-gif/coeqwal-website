"use client"

import React, { useState } from "react"
import {
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
import { WaterNeedSetting } from "./types"

import { WATER_NEED_TYPES, BLANK_WATER_NEED } from "./constants"

const waterNeedSettings: WaterNeedSetting[] = []

const NeedsEditorPanel: React.FC = () => {
  const [expanded, setExpanded] = useState("")
  const [needsList, setNeedsList] = useState(waterNeedSettings)

  const [currentWaterNeedSetting, setCurrentWaterNeedSetting] =
    useState<WaterNeedSetting>(BLANK_WATER_NEED)

  const addNewNeed = (type: string) => {
    const defaultSetting = WATER_NEED_TYPES.find(
      (item) => item.label === type,
    )?.defaultSetting
    if (!defaultSetting) {
      return
    }

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

  return (
    <Box
      sx={{
        width: "100%",
        height: "fit-content",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
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
              expanded={expanded == item.label}
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
          />
        </Box>
        {needsList.length > 0 && (
          <Button
            variant="outlined"
            startIcon={<ArrowRightIcon />}
            size="medium"
            onClick={() => setNeedsList([])}
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
  )
}

export default NeedsEditorPanel
