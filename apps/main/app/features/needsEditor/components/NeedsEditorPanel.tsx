"use client"

import React, { useState, useEffect } from "react"
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Button,
  Box,
  ExpandMoreIcon,
  ArrowRightIcon,
  Dialog,
  DialogContent,
  DialogActions,
  useTheme,
} from "@repo/ui/mui"
import { Map, useMap, NavigationControl, GeolocateControl } from "@repo/map"

import AddedWaterNeeds from "./AddedNeedsList"
import WaterNeedEditor from "./WaterNeedEditor"
import { WaterNeedSetting } from "./types"

import {
  WATER_NEED_TYPES,
  BLANK_WATER_NEED,
  DEFAULT_OTHER_WATER_NEEDS,
} from "./constants"

const NeedsEditorPanel: React.FC = () => {
  const theme = useTheme()
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const {
    addSource,
    addLayer,
    removeLayer,
    removeSource,
    hasSource,
    hasLayer,
    flyTo,
  } = useMap()
  const [expanded, setExpanded] = useState("")
  const [needsList, setNeedsList] = useState<WaterNeedSetting[]>(
    DEFAULT_OTHER_WATER_NEEDS,
  )

  const [currentWaterNeedSetting, setCurrentWaterNeedSetting] =
    useState<WaterNeedSetting>(BLANK_WATER_NEED)

  // Load DU GeoJSON data and add to map
  useEffect(() => {
    const loadAndAddDuLayer = async () => {
      try {
        // Check if source already exists
        if (hasSource("du-geojson")) {
          return
        }

        // Load GeoJSON data
        const response = await fetch("/geospatial_data/du.geojson")
        const geoJsonData = await response.json()

        // Add source to map
        addSource("du-geojson", {
          type: "geojson",
          data: geoJsonData,
        })

        // Add fill layer
        if (!hasLayer("du-polygons")) {
          addLayer(
            "du-polygons",
            "du-geojson",
            "fill",
            {
              "fill-color": "rgba(100, 164, 214, 0.3)", // Semi-transparent blue
              "fill-outline-color": "rgba(100, 164, 214, 1)", // Solid blue outline
            },
            {
              visibility: "visible",
            },
          )
        }

        // Add outline layer
        if (!hasLayer("du-polygons-outline")) {
          addLayer(
            "du-polygons-outline",
            "du-geojson",
            "line",
            {
              "line-color": "rgba(100, 164, 214, 1)", // Solid blue outline
              "line-width": 1,
            },
            {
              visibility: "visible",
            },
          )
        }
      } catch (error) {
        console.error("Error loading DU GeoJSON data:", error)
      }
    }

    // loadAndAddDuLayer()

    // Cleanup function to remove layers when component unmounts
    return () => {
      if (hasLayer("du-polygons-outline")) {
        removeLayer("du-polygons-outline")
      }
      if (hasLayer("du-polygons")) {
        removeLayer("du-polygons")
      }
    }
  }, [addSource, addLayer, removeLayer, hasSource, hasLayer])

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
      isSatisfiable: false,
      isUserDefined: true,
      isSelected: true,
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
  }

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative", // Added for overlay positioning
      }}
    >
      {
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
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Water Need Types Accordion */}
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
            {/* Water Need Editor Panel */}
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
                mapFunctions={{
                  addSource,
                  addLayer,
                  removeLayer,
                  removeSource,
                  hasSource,
                  hasLayer,
                  flyTo,
                }}
              />
            </Box>
          </Box>
          {/* Map Panel */}
          <Box
            sx={{
              width: "70%",
              height: "30vh",
              mr: 2,
              position: "relative",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Map
              mapboxToken={mapboxToken}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              initialViewState={{
                longitude: -120.759,
                latitude: 38.032,
                zoom: 6.3,
              }}
              style={{ width: "100%", height: "100%" }}
              scrollZoom={true}
              touchZoom={true}
              touchRotate={false}
            >
              <NavigationControl position="top-right" />
              <GeolocateControl position="top-right" />
            </Map>
          </Box>
          {/* Added Needs List and Continue Button */}
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
                onClick={() => {}}
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
      }
    </Box>
  )
}

export default NeedsEditorPanel
