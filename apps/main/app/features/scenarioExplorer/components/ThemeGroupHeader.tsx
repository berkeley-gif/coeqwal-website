"use client"

import {
  Box,
  Checkbox,
  IconButton,
  Tooltip,
  useTheme,
  icons,
} from "@repo/ui/mui"
import { InfoIconButton } from "@repo/ui"
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
}: ThemeGroupHeaderProps) {
  const theme = useTheme()
  const { selectedScenarios, selectScenarios, sharedScenarioIds, addToShare } =
    useScenarioExplorerStore()

  const themeConfig = THEME_LABEL_CONFIG[themeKey]
  const themeColors = theme.palette.waterThemes[themeKey]
  if (!themeConfig || !themeColors) return null

  const allChecked =
    scenarioIds.length > 0 &&
    scenarioIds.every((id) => selectedScenarios.includes(id))
  const someChecked =
    !allChecked && scenarioIds.some((id) => selectedScenarios.includes(id))
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
      sx={{
        gridColumn: "1 / -1",
        display: "grid",
        gridTemplateColumns: "subgrid",
        alignItems: "center",
        minHeight: "24px",
        borderRadius: "4px",
        backgroundColor: allChecked
          ? themeColors.background
          : someChecked
            ? `${themeColors.background}44`
            : "transparent",
        transition: "background-color 0.15s ease",
        "&:hover .theme-action-icon": {
          opacity: 1,
        },
      }}
    >
      {/* Column 1: Checkbox — inherits grid column 1 from parent */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          mr: -0.5,
        }}
      >
        <Checkbox
          checked={allChecked}
          indeterminate={someChecked}
          onChange={handleToggle}
          sx={{
            ...theme.scenarios.checkbox.md,
            mt: 0,
            color: themeColors.text,
            "&.Mui-checked": { color: themeColors.text },
            "&.MuiCheckbox-indeterminate": { color: themeColors.text },
          }}
        />
      </Box>

      {/* Column 2+: Label, info, and actions */}
      <Box
        sx={{
          gridColumn: "2 / -1",
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          pr: 1.5,
        }}
      >
        <Box
          component="span"
          sx={{
            fontSize: "0.6875rem",
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

        {themeConfig.tooltip && (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <InfoIconButton
              tooltipContent={themeConfig.tooltip}
              placement="right"
            />
          </Box>
        )}

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
            onClick={() => {
              scenarioIds.forEach((id) => addToShare(id))
            }}
            sx={{
              p: 0.25,
              opacity: allShared ? 1 : 0,
              color: theme.palette.text.primary,
              transition: "opacity 200ms ease",
            }}
          >
            <icons.IosShare sx={{ fontSize: "0.8rem" }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}
