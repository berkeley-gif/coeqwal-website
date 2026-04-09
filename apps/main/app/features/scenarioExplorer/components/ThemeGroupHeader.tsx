"use client"

import {
  Box,
  Checkbox,
  IconButton,
  Tooltip,
  useTheme,
  icons,
} from "@repo/ui/mui"
import { THEME_LABEL_CONFIG } from "../../../content/themes"
import type { ScenarioTheme } from "../../../content/scenarios"
import { useScenarioExplorerStore } from "../store"

interface ThemeGroupHeaderProps {
  themeKey: ScenarioTheme
  scenarioIds: string[]
  isFirst?: boolean
}

export default function ThemeGroupHeader({
  themeKey,
  scenarioIds,
  isFirst = false,
}: ThemeGroupHeaderProps) {
  const theme = useTheme()
  const {
    selectedScenarios,
    selectScenarios,
    pinnedScenarioIds,
    togglePinnedScenario,
    sharedScenarioIds,
    addToShare,
  } = useScenarioExplorerStore()

  const themeConfig = THEME_LABEL_CONFIG[themeKey]
  const themeColors = theme.palette.waterThemes[themeKey]
  if (!themeConfig || !themeColors) return null

  const allChecked =
    scenarioIds.length > 0 &&
    scenarioIds.every((id) => selectedScenarios.includes(id))
  const someChecked =
    !allChecked &&
    scenarioIds.some((id) => selectedScenarios.includes(id))
  const allPinned =
    scenarioIds.length > 0 &&
    scenarioIds.every((id) => pinnedScenarioIds.includes(id))
  const allShared =
    scenarioIds.length > 0 &&
    scenarioIds.every((id) => sharedScenarioIds.includes(id))

  const handleToggle = () => {
    if (scenarioIds.length === 0) return
    if (allChecked) {
      selectScenarios(
        selectedScenarios.filter((id) => !scenarioIds.includes(id)),
      )
    } else {
      const merged = new Set([...selectedScenarios, ...scenarioIds])
      selectScenarios([...merged])
    }
  }

  return (
    <Box
      data-theme-header={themeKey}
      onClick={handleToggle}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.5,
        pt: isFirst ? 1 : 1.5,
        pb: 0.5,
        cursor: "pointer",
        borderRadius: "4px",
        "&:hover": {
          backgroundColor: `${themeColors.background}66`,
        },
        "&:hover .theme-action-icon": {
          opacity: 1,
        },
      }}
    >
      <Checkbox
        size="small"
        checked={allChecked}
        indeterminate={someChecked}
        onClick={(e) => e.stopPropagation()}
        onChange={handleToggle}
        sx={{
          padding: 0,
          flexShrink: 0,
          transform: "scale(0.8)",
          color: themeColors.text,
          "&.Mui-checked": { color: themeColors.text },
          "&.MuiCheckbox-indeterminate": { color: themeColors.text },
        }}
      />
      <Box
        component="span"
        sx={{
          fontSize: "0.6rem",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: themeColors.text,
          backgroundColor: themeColors.background,
          px: "5px",
          py: "1.5px",
          borderRadius: "2px",
          lineHeight: 1.2,
        }}
      >
        {themeConfig.label}
      </Box>

      <Box sx={{ flex: 1 }} />

      <Tooltip
        title={
          allShared
            ? "All shared"
            : `Share all ${themeConfig.label} scenarios`
        }
        arrow
      >
        <IconButton
          className="theme-action-icon"
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            scenarioIds.forEach((id) => addToShare(id))
          }}
          sx={{
            p: 0.25,
            opacity: allShared ? 1 : 0,
            color: allShared ? theme.palette.blue.bright : themeColors.text,
            transition: "opacity 200ms ease",
          }}
        >
          <icons.IosShare sx={{ fontSize: "0.8rem" }} />
        </IconButton>
      </Tooltip>

      <Tooltip
        title={
          allPinned
            ? `Unpin all ${themeConfig.label}`
            : `Pin all ${themeConfig.label} scenarios`
        }
        arrow
      >
        <IconButton
          className="theme-action-icon"
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            if (allPinned) {
              scenarioIds.forEach((id) => togglePinnedScenario(id))
            } else {
              scenarioIds.forEach((id) => {
                if (!pinnedScenarioIds.includes(id)) togglePinnedScenario(id)
              })
            }
          }}
          sx={{
            p: 0.25,
            opacity: allPinned ? 1 : 0,
            color: themeColors.text,
            transition: "opacity 200ms ease",
          }}
        >
          <icons.PushPin
            sx={{
              fontSize: "0.875rem",
              transform: allPinned ? "none" : "rotate(45deg)",
            }}
          />
        </IconButton>
      </Tooltip>
    </Box>
  )
}
