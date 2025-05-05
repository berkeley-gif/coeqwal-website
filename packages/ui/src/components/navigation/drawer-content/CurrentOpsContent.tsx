"use client"

import React from "react"
import {
  Box,
  Typography,
  Slider,
  FormControlLabel,
  Switch,
  Divider,
  useTheme,
} from "@mui/material"
import { ContentWrapper } from "./ContentWrapper"
import SettingsIcon from "@mui/icons-material/Settings"

export interface CurrentOpsContentProps {
  /** Function called when the close button is clicked */
  onClose: () => void
}

/**
 * Content component for the Current Operations tab in the MultiDrawer
 */
export function CurrentOpsContent({ onClose }: CurrentOpsContentProps) {
  const theme = useTheme()

  // Sample operations state - replace with your actual state logic
  const [flowValue, setFlowValue] = React.useState<number>(50)
  const [enabledOps, setEnabledOps] = React.useState({
    deltaConveyance: false,
    flowRequirements: true,
    groundwaterBanking: false,
  })

  const handleFlowChange = (_event: Event, newValue: number | number[]) => {
    setFlowValue(newValue as number)
  }

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEnabledOps({
      ...enabledOps,
      [event.target.name]: event.target.checked,
    })
  }

  return (
    <ContentWrapper title="Current Operations" onClose={onClose}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure current water operation settings that will affect all
        scenarios.
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
          <SettingsIcon
            sx={{ mr: 1, color: theme.palette.primary.main, opacity: 0.7 }}
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            Flow Controls
          </Typography>
        </Box>

        <Box sx={{ px: 2, pt: 1 }}>
          <Typography id="flow-slider-label" gutterBottom>
            Sacramento River Flow
          </Typography>
          <Slider
            aria-labelledby="flow-slider-label"
            value={flowValue}
            onChange={handleFlowChange}
            valueLabelDisplay="auto"
            step={10}
            marks
            min={0}
            max={100}
          />
          <Typography variant="caption" color="text.secondary">
            Controls the amount of water flowing through the Sacramento River.
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
          <SettingsIcon
            sx={{ mr: 1, color: theme.palette.primary.main, opacity: 0.7 }}
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            Operation Toggles
          </Typography>
        </Box>

        <Box sx={{ pl: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={enabledOps.deltaConveyance}
                onChange={handleSwitchChange}
                name="deltaConveyance"
                color="primary"
              />
            }
            label="Delta Conveyance Tunnel"
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", ml: 4, mb: 2 }}
          >
            Enable/disable the Delta conveyance tunnel in simulations.
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={enabledOps.flowRequirements}
                onChange={handleSwitchChange}
                name="flowRequirements"
                color="primary"
              />
            }
            label="Flow Requirements"
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", ml: 4, mb: 2 }}
          >
            Apply regulatory flow requirements to rivers.
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={enabledOps.groundwaterBanking}
                onChange={handleSwitchChange}
                name="groundwaterBanking"
                color="primary"
              />
            }
            label="Groundwater Banking"
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", ml: 4 }}
          >
            Enable groundwater banking in wet years.
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{ mt: 4, p: 2, bgcolor: "rgba(0, 0, 0, 0.03)", borderRadius: 1 }}
      >
        <Typography
          variant="subtitle2"
          color="primary"
          sx={{ fontWeight: "bold" }}
        >
          What are current operations?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Current operations represent the baseline configuration of
          California's water system. Changes here will affect how all scenarios
          operate.
        </Typography>
      </Box>
    </ContentWrapper>
  )
}

export default CurrentOpsContent
