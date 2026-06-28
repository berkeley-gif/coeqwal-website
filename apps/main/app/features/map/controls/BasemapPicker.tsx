"use client"

import { Box, Typography, useTheme, alpha } from "@repo/ui/mui"
import { MAP_THEME_URLS, type MapThemeKey } from "@repo/map"
import { mapActions, useMapStyle, useMapMode } from "../store"

const BASEMAP_OPTIONS: { key: MapThemeKey; label: string }[] = [
  { key: "satellite", label: "Satellite" },
  { key: "light", label: "Minimal" },
  { key: "streets", label: "Streets" },
]

const THUMB_SIZE = 44

const STYLE_OWNER_ID: Record<MapThemeKey, string> = {
  satellite: "coeqwal/cmh2f40sm000w01qy8m0gaea8",
  light: "mapbox/light-v11",
  streets: "mapbox/streets-v12",
}

function getThumbUrl(key: MapThemeKey): string {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ""
  const ownerStyle = STYLE_OWNER_ID[key]
  return `https://api.mapbox.com/styles/v1/${ownerStyle}/static/-119.5,37.5,5/${THUMB_SIZE * 2}x${THUMB_SIZE * 2}@2x?access_token=${token}`
}

export function BasemapPicker() {
  const theme = useTheme()
  const currentStyle = useMapStyle()
  const mapMode = useMapMode()

  if (mapMode !== "explore") return null

  const activeKey =
    (Object.entries(MAP_THEME_URLS) as [MapThemeKey, string][]).find(
      ([, url]) => url === currentStyle,
    )?.[0] ?? "light"

  return (
    <Box
      sx={{
        position: "absolute",
        zIndex: 2,
        display: "flex",
        pointerEvents: "auto",
        bgcolor: alpha(theme.palette.common.white, 0.92),
        backdropFilter: "blur(6px)",
        borderRadius: 1.5,
        p: 0.75,
        boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
        flexDirection: "row",
        gap: 1,
        left: "87.5%",
        right: "auto",
        bottom: 40,
        transform: "translateX(-50%)",
      }}
    >
      {BASEMAP_OPTIONS.map(({ key, label }) => {
        const isActive = key === activeKey
        return (
          <Box
            key={key}
            onClick={() => mapActions.setMapStyle(MAP_THEME_URLS[key])}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                mapActions.setMapStyle(MAP_THEME_URLS[key])
              }
            }}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.25,
              borderRadius: 1,
              p: 0.5,
              cursor: "pointer",
              transition: "transform 0.1s, background-color 0.15s",
              bgcolor: isActive ? "rgba(45,137,182,0.1)" : "transparent",
              "&:hover": {
                bgcolor: isActive
                  ? "rgba(45,137,182,0.15)"
                  : "rgba(0,0,0,0.04)",
              },
              "&:active": { transform: "scale(0.96)" },
            }}
          >
            <Box
              component="img"
              src={getThumbUrl(key)}
              alt={`${label} basemap`}
              sx={{
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                borderRadius: 0.75,
                border: 2,
                borderColor: isActive ? "primary.main" : "transparent",
                objectFit: "cover",
                transition: "border-color 0.15s",
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.55rem",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "primary.main" : "grey.600",
                lineHeight: 1,
                userSelect: "none",
              }}
            >
              {label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}
