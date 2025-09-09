"use client"

import { useState } from "react"
import { TextField, Box, IconButton, Theme } from "@repo/ui/mui"
import { SearchIcon } from "@repo/ui/mui"
import { useMap } from "@repo/map"

interface MapGeoSearchProps {
  /** Callback when a location is searched */
  onLocationSearch?: (query: string) => void
  /** Optional placeholder text */
  placeholder?: string
  /** Position of the search box */
  position?: "bottom-left" | "top-left" | "bottom-right" | "top-right"
  /** Mapbox access token for geocoding */
  mapboxToken?: string
}

export default function MapGeoSearch({
  onLocationSearch,
  placeholder = "Search location...",
  position = "bottom-left",
  mapboxToken,
}: MapGeoSearchProps) {
  const [searchValue, setSearchValue] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const { mapRef } = useMap()

  const handleSearch = async () => {
    if (!searchValue.trim()) return

    setIsSearching(true)

    try {
      // Use Mapbox Geocoding API
      const token = mapboxToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      console.log("🔍 Searching for:", searchValue)
      console.log("🔑 Using token:", token ? "✅ Available" : "❌ Missing")

      const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchValue)}.json?access_token=${token}&country=US&bbox=-124.5,32.5,-114.0,42.0&limit=1`
      console.log("📡 Geocode URL:", geocodeUrl)

      const response = await fetch(geocodeUrl)

      if (!response.ok) {
        throw new Error("Geocoding failed")
      }

      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center
        const placeName = data.features[0].place_name

        // Move map to the location
        if (mapRef?.current) {
          mapRef.current.getMap()?.flyTo({
            center: [lng, lat],
            zoom: 10,
            duration: 1500,
          })
        }

        console.log(
          `📍 Found location: ${placeName} at [${lng.toFixed(4)}, ${lat.toFixed(4)}]`,
        )

        if (onLocationSearch) {
          onLocationSearch(searchValue.trim())
        }

        setSearchValue("") // Clear search after success
      } else {
        console.warn(`❌ Location not found: ${searchValue}`)
      }
    } catch (error) {
      console.error("Geocoding error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const getPositionStyles = () => {
    const baseStyles = {
      position: "absolute" as const,
      zIndex: 1000,
      pointerEvents: "auto" as const,
    }

    switch (position) {
      case "bottom-left":
        return {
          ...baseStyles,
          bottom: "10px", // Align with NavigationControl
          left: "110px",
        }
      case "top-left":
        return {
          ...baseStyles,
          top: (theme: Theme) => theme.spacing(2),
          left: (theme: Theme) => theme.spacing(2),
        }
      case "bottom-right":
        return {
          ...baseStyles,
          bottom: (theme: Theme) => theme.spacing(2),
          right: (theme: Theme) => theme.spacing(2),
        }
      case "top-right":
        return {
          ...baseStyles,
          top: (theme: Theme) => theme.spacing(2),
          right: (theme: Theme) => theme.spacing(2),
        }
      default:
        return baseStyles
    }
  }

  return (
    <Box sx={getPositionStyles()}>
      <TextField
        size="small"
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyPress={handleKeyPress}
        sx={{
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: 0,
          minWidth: 300,
          width: 360,
          "& .MuiOutlinedInput-root": {
            height: 32,
            fontSize: (theme) => theme.typography.nav.fontSize,
            backgroundColor: (theme) => theme.palette.common.white,
            "& fieldset": {
              borderColor: (theme) => theme.palette.grey[300],
              borderWidth: "1px",
            },
            "&:hover fieldset": {
              borderColor: (theme) => theme.palette.blue.medium,
            },
            "&.Mui-focused fieldset": {
              borderColor: (theme) => theme.palette.blue.medium,
              borderWidth: "1px",
            },
          },
          "& .MuiOutlinedInput-input": {
            fontSize: (theme) => theme.typography.nav.fontSize,
            padding: "6px 8px",
            minWidth: 0,
          },
          "& .MuiInputBase-input::placeholder": {
            fontSize: (theme) => theme.typography.nav.fontSize,
            opacity: 0.6,
          },
        }}
        slotProps={{
          input: {
            endAdornment: searchValue && (
              <IconButton
                size="small"
                onClick={handleSearch}
                disabled={isSearching}
                sx={{
                  color: (theme) => theme.palette.blue.medium,
                  p: 0.5,
                }}
              >
                <SearchIcon fontSize="small" />
              </IconButton>
            ),
          },
        }}
      />
    </Box>
  )
}
