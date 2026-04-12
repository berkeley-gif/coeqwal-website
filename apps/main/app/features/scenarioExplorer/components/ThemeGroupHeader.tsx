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
  /** "grid" (default) uses CSS subgrid for StrategyGrid; "flex" uses a flat flex row for sidebar */
  layout?: "grid" | "flex"
}

export default function ThemeGroupHeader({
  themeKey,
  scenarioIds,
  layout = "grid",
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

  const isFlex = layout === "flex"

  return (
    <Box
      data-theme-header={themeKey}
      sx={{
        ...(isFlex
          ? {
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 1.5,
              py: 0.5,
            }
          : {
              gridColumn: "1 / -1",
              display: "grid",
              gridTemplateColumns: "subgrid",
            }),
        alignItems: "center",
        minHeight: "24px",
        borderRadius: isFlex ? 0 : "4px",
        backgroundColor: isFlex
          ? allChecked
            ? themeColors.background
            : theme.palette.learn.background
          : allChecked
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
      <Box
        sx={{
          display: "flex",
          justifyContent: isFlex ? "center" : "flex-end",
          alignItems: "center",
          ...(isFlex ? {} : { mr: -0.5 }),
        }}
      >
        <Checkbox
          checked={allChecked}
          indeterminate={someChecked}
          onChange={handleToggle}
          sx={{
            ...(isFlex
              ? theme.scenarios.checkbox.sm
              : theme.scenarios.checkbox.md),
            mt: 0,
            color: themeColors.text,
            "&.Mui-checked": { color: themeColors.text },
            "&.MuiCheckbox-indeterminate": { color: themeColors.text },
          }}
        />
      </Box>

      <Box
        sx={{
          ...(isFlex ? {} : { gridColumn: "2 / -1" }),
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          pr: isFlex ? 0 : 1.5,
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
