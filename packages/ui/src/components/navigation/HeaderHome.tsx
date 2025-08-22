"use client"

import {
  AppBar,
  Toolbar,
  Stack,
  Button,
  Box,
  Menu,
  MenuItem,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { useMediaQuery } from "@mui/material"
import { useTranslation } from "@repo/i18n"
import { LanguageSwitcher } from "../index"
import { Logo } from "../common/Logo"
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"
import { useState } from "react"
export interface HeaderProps {
  onDataClick?: () => void
  onToolsClick?: (tool: "scenario-explorer" | "needs-search") => void
}

// Translation

type HeaderTranslations = {
  title: string
  buttons: {
    getData: string
    about: string
    tools: string
  }
  toolsDropdown: {
    scenarioExplorer: string
    needsSearch: string
  }
}

type TranslationsMap = {
  en: HeaderTranslations
  es: HeaderTranslations
}

const translations: TranslationsMap = {
  en: {
    title: "COEQWAL",
    buttons: {
      getData: "Data",
      about: "About COEQWAL",
      tools: "Tools",
    },
    toolsDropdown: {
      scenarioExplorer: "Scenario data explorer",
      needsSearch: "Needs-based search",
    },
  },
  es: {
    title: "COEQWAL",
    buttons: {
      getData: "Datos",
      about: "Sobre COEQWAL",
      tools: "Herramientas",
    },
    toolsDropdown: {
      scenarioExplorer: "Explorador de datos de escenarios",
      needsSearch: "Búsqueda basada en necesidades",
    },
  },
}

// NEW SIMPLIFIED HEADER
export function HeaderHome({ onDataClick, onToolsClick }: HeaderProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const { locale, isLoading } = useTranslation()

  // Tools dropdown state
  const [toolsAnchorEl, setToolsAnchorEl] = useState<null | HTMLElement>(null)
  const isToolsOpen = Boolean(toolsAnchorEl)

  // Use 'en' as default until client-side hydration is complete
  const safeLocale = !locale || isLoading ? "en" : locale
  const componentText =
    translations[safeLocale as keyof TranslationsMap] || translations.en

  const buttonVariant = isMobile ? "text" : "standard"
  const buttonStyle = {
    lineHeight: 1.1,
    height: "40px",
    minHeight: "40px",
    fontFamily: theme.typography.fontFamily,
    fontWeight: (theme) => theme.typography.button.fontWeight,
    color: "white",
  }

  const handleToolsClick = (event: React.MouseEvent<HTMLElement>) => {
    setToolsAnchorEl(event.currentTarget)
  }

  const handleToolsClose = () => {
    setToolsAnchorEl(null)
  }

  const handleToolSelection = (tool: "scenario-explorer" | "needs-search") => {
    onToolsClick?.(tool)
    handleToolsClose()
  }

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme.zIndex.appBar,
        backgroundColor: "rgba(42, 82, 135, 0.2)", // Blue decorative circle color
        borderRadius: theme.borderRadius.card,
        margin: "16px",
        width: "calc(100% - 32px)",
        boxShadow: "none",
        border: "none",
      }}
      elevation={0}
    >
      <Toolbar
        sx={{
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", paddingLeft: 1 }}>
          <Logo />
        </Box>

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{
            paddingRight: "8px",
          }}
        >
          <Button
            variant={buttonVariant}
            onClick={handleToolsClick}
            endIcon={<ArrowDropDownIcon />}
            sx={{
              ...buttonStyle,
            }}
          >
            {componentText.buttons.tools}
          </Button>
          <Menu
            anchorEl={toolsAnchorEl}
            open={isToolsOpen}
            onClose={handleToolsClose}
            sx={{
              "& .MuiPaper-root": {
                backgroundColor: "rgba(42, 82, 135, 0.95)",
                borderRadius: theme.borderRadius.card,
                mt: 1,
              },
            }}
          >
            <MenuItem
              onClick={() => handleToolSelection("scenario-explorer")}
              sx={{
                color: "white",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              {componentText.toolsDropdown.scenarioExplorer}
            </MenuItem>
            <MenuItem
              onClick={() => handleToolSelection("needs-search")}
              sx={{
                color: "white",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              {componentText.toolsDropdown.needsSearch}
            </MenuItem>
          </Menu>
          <Button
            variant={buttonVariant}
            onClick={onDataClick}
            sx={{
              ...buttonStyle,
            }}
          >
            {componentText.buttons.getData}
          </Button>
          <Button
            variant={buttonVariant}
            sx={{
              ...buttonStyle,
            }}
          >
            {componentText.buttons.about}
          </Button>
          <LanguageSwitcher />
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
