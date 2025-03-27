"use client"

import React from "react"
import { Paper, Switch, Typography, Box } from "@mui/material"
import WaterDropIcon from "@mui/icons-material/WaterDrop"
import LocationOnIcon from "@mui/icons-material/LocationOn"
import TerrainIcon from "@mui/icons-material/Terrain"
import LocalShippingIcon from "@mui/icons-material/LocalShipping"

interface MapControlsProps {
  showAquiferToggle: boolean
  isAquiferVisible: boolean
  onAquiferToggle: () => void
  showCalSimToggle: boolean
  isCalSimVisible: boolean
  onCalSimToggle: () => void
  showBasins?: boolean
  isBasinsVisible?: boolean
  onBasinsToggle?: () => void
}

export default function MapControlsPanel({
  showAquiferToggle,
  isAquiferVisible,
  onAquiferToggle,
  showCalSimToggle,
  isCalSimVisible,
  onCalSimToggle,
  isBasinsVisible = false,
  onBasinsToggle = () => {},
}: MapControlsProps) {
  // Add state for CalSim node subsets
  const [showInflow, setShowInflow] = React.useState(true)
  const [showStorage, setShowStorage] = React.useState(true)
  const [showFlow, setShowFlow] = React.useState(true)
  const [showGroundwater, setShowGroundwater] = React.useState(true)
  const [showDeliveries, setShowDeliveries] = React.useState(true)

  // State for delivery areas (keeping the local state for delivery areas)
  const [showDeliveryAreas, setShowDeliveryAreas] = React.useState(true)
  // We'll use the props for basins instead of local state
  // const [showBasins, setShowBasins] = React.useState(true)

  // Handler functions for subset toggles
  const handleInflowToggle = () => setShowInflow(!showInflow)
  const handleStorageToggle = () => setShowStorage(!showStorage)
  const handleFlowToggle = () => setShowFlow(!showFlow)
  const handleGroundwaterToggle = () => setShowGroundwater(!showGroundwater)
  const handleDeliveriesToggle = () => setShowDeliveries(!showDeliveries)

  // Handler function for delivery areas
  const handleDeliveryAreasToggle = () =>
    setShowDeliveryAreas(!showDeliveryAreas)
  // We'll use the prop handler for basins instead
  // const handleBasinsToggle = () => setShowBasins(!showBasins)

  // Determine if the panel should be shown at all
  if (!showAquiferToggle && !showCalSimToggle) {
    return null
  }

  // Common paper styles for both panels
  const paperStyles = {
    p: 2,
    borderRadius: 1,
    backgroundColor: "rgba(21, 79, 137, 0.7)",
    color: "white",
    pointerEvents: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: "220px",
    opacity: 0,
    animation: "fadeIn 0.8s ease-in-out forwards",
    "@keyframes fadeIn": {
      "0%": {
        opacity: 0,
        transform: "translateX(20px)",
      },
      "100%": {
        opacity: 1,
        transform: "translateX(0)",
      },
    },
  }

  // Switch track and thumb styles
  const switchStyles = {
    my: "auto",
    "& .MuiSwitch-track": {
      backgroundColor: "rgba(255, 255, 255, 0.3)",
      border: "1px solid rgba(255, 255, 255, 0.6)",
    },
    "& .MuiSwitch-thumb": {
      backgroundColor: "white",
    },
  }

  // The inactive switch thumb style
  const getThumbStyle = (isActive: boolean) => ({
    backgroundColor: isActive ? "white" : "rgba(255, 255, 255, 0.5)",
  })

  return (
    <div
      style={{
        position: "fixed",
        right: "10px",
        top: "200px", // Increased from 150px to 200px to move panels lower
        zIndex: 5,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Main panel with CalSim nodes and subsets */}
      {showCalSimToggle && (
        <Paper elevation={3} sx={paperStyles}>
          <Box
            display="flex"
            alignItems="center"
            width="100%"
            sx={{ minHeight: "36px" }}
          >
            <Box display="flex" alignItems="center" sx={{ flexGrow: 1, mr: 1 }}>
              <LocationOnIcon
                sx={{
                  fontSize: 20,
                  mr: 1.5,
                  color: isCalSimVisible ? "white" : "rgba(255, 255, 255, 0.5)",
                }}
              />
              <Typography
                variant="body2"
                sx={{ fontSize: "0.95rem", lineHeight: "20px" }}
              >
                CalSim nodes
              </Typography>
            </Box>
            <Switch
              checked={isCalSimVisible}
              onChange={onCalSimToggle}
              color="default"
              size="small"
              sx={{
                ...switchStyles,
                "& .MuiSwitch-thumb": getThumbStyle(isCalSimVisible),
              }}
            />
          </Box>

          {/* CalSim Node Subsets - only show when CalSim nodes are visible */}
          {isCalSimVisible && (
            <Box sx={{ pl: 4 }}>
              {/* Inflow Subset */}
              <Box
                display="flex"
                alignItems="center"
                width="100%"
                sx={{ minHeight: "30px", mb: 1 }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  sx={{ flexGrow: 1, mr: 1 }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontSize: "0.85rem", lineHeight: "18px" }}
                  >
                    Inflow
                  </Typography>
                </Box>
                <Switch
                  checked={showInflow}
                  onChange={handleInflowToggle}
                  color="default"
                  size="small"
                  sx={{
                    ...switchStyles,
                    transform: "scale(0.8)",
                    "& .MuiSwitch-thumb": getThumbStyle(showInflow),
                  }}
                />
              </Box>

              {/* Storage Subset */}
              <Box
                display="flex"
                alignItems="center"
                width="100%"
                sx={{ minHeight: "30px", mb: 1 }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  sx={{ flexGrow: 1, mr: 1 }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontSize: "0.85rem", lineHeight: "18px" }}
                  >
                    Storage
                  </Typography>
                </Box>
                <Switch
                  checked={showStorage}
                  onChange={handleStorageToggle}
                  color="default"
                  size="small"
                  sx={{
                    ...switchStyles,
                    transform: "scale(0.8)",
                    "& .MuiSwitch-thumb": getThumbStyle(showStorage),
                  }}
                />
              </Box>

              {/* Flow Subset */}
              <Box
                display="flex"
                alignItems="center"
                width="100%"
                sx={{ minHeight: "30px", mb: 1 }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  sx={{ flexGrow: 1, mr: 1 }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontSize: "0.85rem", lineHeight: "18px" }}
                  >
                    Flow
                  </Typography>
                </Box>
                <Switch
                  checked={showFlow}
                  onChange={handleFlowToggle}
                  color="default"
                  size="small"
                  sx={{
                    ...switchStyles,
                    transform: "scale(0.8)",
                    "& .MuiSwitch-thumb": getThumbStyle(showFlow),
                  }}
                />
              </Box>

              {/* Groundwater Subset */}
              <Box
                display="flex"
                alignItems="center"
                width="100%"
                sx={{ minHeight: "30px", mb: 1 }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  sx={{ flexGrow: 1, mr: 1 }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontSize: "0.85rem", lineHeight: "18px" }}
                  >
                    Groundwater
                  </Typography>
                </Box>
                <Switch
                  checked={showGroundwater}
                  onChange={handleGroundwaterToggle}
                  color="default"
                  size="small"
                  sx={{
                    ...switchStyles,
                    transform: "scale(0.8)",
                    "& .MuiSwitch-thumb": getThumbStyle(showGroundwater),
                  }}
                />
              </Box>

              {/* Deliveries Subset */}
              <Box
                display="flex"
                alignItems="center"
                width="100%"
                sx={{ minHeight: "30px" }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  sx={{ flexGrow: 1, mr: 1 }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontSize: "0.85rem", lineHeight: "18px" }}
                  >
                    Delivery
                  </Typography>
                </Box>
                <Switch
                  checked={showDeliveries}
                  onChange={handleDeliveriesToggle}
                  color="default"
                  size="small"
                  sx={{
                    ...switchStyles,
                    transform: "scale(0.8)",
                    "& .MuiSwitch-thumb": getThumbStyle(showDeliveries),
                  }}
                />
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* Panel for water layers (aquifers, delivery areas, basins) */}
      <Paper elevation={3} sx={{ ...paperStyles, animationDelay: "0.1s" }}>
        {/* Aquifers */}
        <Box
          display="flex"
          alignItems="center"
          width="100%"
          sx={{ minHeight: "36px", mb: 2 }}
        >
          <Box display="flex" alignItems="center" sx={{ flexGrow: 1, mr: 1 }}>
            <WaterDropIcon
              sx={{
                fontSize: 20,
                mr: 1.5,
                color: isAquiferVisible ? "white" : "rgba(255, 255, 255, 0.5)",
              }}
            />
            <Typography
              variant="body2"
              sx={{ fontSize: "0.95rem", lineHeight: "20px" }}
            >
              Aquifers
            </Typography>
          </Box>
          <Switch
            checked={isAquiferVisible}
            onChange={onAquiferToggle}
            color="default"
            size="small"
            sx={{
              ...switchStyles,
              "& .MuiSwitch-thumb": getThumbStyle(isAquiferVisible),
            }}
          />
        </Box>

        {/* Delivery Areas - now as a top-level toggle */}
        <Box
          display="flex"
          alignItems="center"
          width="100%"
          sx={{ minHeight: "36px", mb: 2 }}
        >
          <Box display="flex" alignItems="center" sx={{ flexGrow: 1, mr: 1 }}>
            <LocalShippingIcon
              sx={{
                fontSize: 20,
                mr: 1.5,
                color: showDeliveryAreas ? "white" : "rgba(255, 255, 255, 0.5)",
              }}
            />
            <Typography
              variant="body2"
              sx={{ fontSize: "0.95rem", lineHeight: "20px" }}
            >
              Delivery areas
            </Typography>
          </Box>
          <Switch
            checked={showDeliveryAreas}
            onChange={handleDeliveryAreasToggle}
            color="default"
            size="small"
            sx={{
              ...switchStyles,
              "& .MuiSwitch-thumb": getThumbStyle(showDeliveryAreas),
            }}
          />
        </Box>

        {/* Basins - now as a top-level toggle */}
        <Box
          display="flex"
          alignItems="center"
          width="100%"
          sx={{ minHeight: "36px" }}
        >
          <Box display="flex" alignItems="center" sx={{ flexGrow: 1, mr: 1 }}>
            <TerrainIcon
              sx={{
                fontSize: 20,
                mr: 1.5,
                color: isBasinsVisible ? "white" : "rgba(255, 255, 255, 0.5)",
              }}
            />
            <Typography
              variant="body2"
              sx={{ fontSize: "0.95rem", lineHeight: "20px" }}
            >
              Basins
            </Typography>
          </Box>
          <Switch
            checked={isBasinsVisible}
            onChange={onBasinsToggle}
            color="default"
            size="small"
            sx={{
              ...switchStyles,
              "& .MuiSwitch-thumb": getThumbStyle(isBasinsVisible),
            }}
          />
        </Box>
      </Paper>
    </div>
  )
}
