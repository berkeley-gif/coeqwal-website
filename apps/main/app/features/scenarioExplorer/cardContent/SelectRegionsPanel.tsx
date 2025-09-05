import React from "react"
import { Box, Typography, Checkbox, FormControlLabel } from "@repo/ui/mui"

interface SelectRegionsPanelProps {
  selectedRegion: string
  onRegionSelect: (region: string) => void
  showRegionDropdown: boolean
  onToggleDeliveryAreaDropdown: () => void
  isDrawingCustomRegion: boolean
  polygonPoints: Array<{ lng: number; lat: number }>
  onSelectRegionOnMap: () => void
  onClearCustomRegion: () => void
}

export function SelectRegionsPanel({
  selectedRegion,
  onRegionSelect,
  showRegionDropdown: _showRegionDropdown, // eslint-disable-line @typescript-eslint/no-unused-vars
  onToggleDeliveryAreaDropdown,
  isDrawingCustomRegion,
  polygonPoints,
  onSelectRegionOnMap,
  onClearCustomRegion,
}: SelectRegionsPanelProps) {
  const regions = [
    { id: "sacramento-valley", label: "Sacramento Valley" },
    { id: "san-joaquin-valley", label: "San Joaquin Valley" },
    { id: "delta", label: "Delta" },
    { id: "tulare-basin", label: "Tulare Basin" },
    { id: "central-valley", label: "Central Valley" },
    { id: "bay-area", label: "Bay Area" },
  ]

  return (
    <Box sx={{ p: 2 }}>
      <Typography
        variant="h6"
        sx={{ mb: 2, color: (theme) => theme.palette.blue.darkest }}
      >
        Select Water Management Regions
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {/* Predefined Regions */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, color: (theme) => theme.palette.text.secondary }}
          >
            Predefined Regions
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
            {regions.map((region) => (
              <FormControlLabel
                key={region.id}
                control={
                  <Checkbox
                    size="small"
                    checked={selectedRegion === region.id}
                    onChange={() => onRegionSelect(region.id)}
                  />
                }
                label={region.label}
                sx={{ margin: 0 }}
              />
            ))}
          </Box>
        </Box>

        {/* Custom Region Selection */}
        <Box>
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, color: (theme) => theme.palette.text.secondary }}
          >
            Custom Region Selection
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  onChange={(e) => {
                    if (e.target.checked) {
                      onToggleDeliveryAreaDropdown()
                    }
                  }}
                />
              }
              label="Select delivery area"
              sx={{ margin: 0 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={isDrawingCustomRegion || polygonPoints.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onSelectRegionOnMap()
                    } else {
                      onClearCustomRegion()
                    }
                  }}
                />
              }
              label="Select region on map"
              sx={{ margin: 0 }}
            />
          </Box>
        </Box>

        {/* Current Selection Info */}
        {selectedRegion && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              backgroundColor: (theme) => theme.palette.blue.bright + "10",
              borderRadius: (theme) => theme.borderRadius.rounded,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Current Selection:{" "}
              {regions.find((r) => r.id === selectedRegion)?.label ||
                selectedRegion}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
