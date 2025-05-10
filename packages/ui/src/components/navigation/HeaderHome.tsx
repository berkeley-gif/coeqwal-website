"use client"

import { AppBar, Toolbar, Stack, Button, Box } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { useMediaQuery } from "@mui/material"
import { useTranslation } from "@repo/i18n"
import { LanguageSwitcher } from "../index"
import { Logo } from "../common/Logo"
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"

type HeaderTranslations = {
  title: string
  buttons: {
    getData: string
    about: string
  }
}

type TranslationsMap = {
  en: HeaderTranslations
  es: HeaderTranslations
}

// Incoming: secondary nav option
export interface SecondaryNavItem {
  key: string
  label: string
  sectionId: string
}

interface HeaderProps {
  drawerOpen?: boolean
  drawerPosition?: "left" | "right"
  activeSection?: string
  onSectionClick?: (sectionId: string) => void
  showSecondaryNav?: boolean
  secondaryNavItems?: SecondaryNavItem[]
}

const translations: TranslationsMap = {
  en: {
    title: "COEQWAL",
    buttons: {
      getData: "Raw Data",
      about: "About COEQWAL",
    },
  },
  es: {
    title: "COEQWAL",
    buttons: {
      getData: "Datos sin procesar",
      about: "Sobre COEQWAL",
    },
  },
}

// Define which sections should have BLACK text (all others will have white)
// TODO: generalize this
const blackSections = [
  "hero", // Home section
  "combined-panel", // Scenario search section
]

// This maps sections to their parent section in the UI
// Used for arrow display when scrolling through combined sections
const sectionParentMap: Record<string, string | undefined> = {
  challenges: "managing-water", // Map challenges section to managing-water button
  calsim: "managing-water",
}

export function HeaderHome({
  drawerOpen = false,
  drawerPosition = "right",
  activeSection,
  onSectionClick,
  showSecondaryNav = false,
  secondaryNavItems = [], // Default to empty array, bc optional
}: HeaderProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const isTablet = useMediaQuery(theme.breakpoints.down("md"))
  const buttonVariant = isMobile ? "text" : "standard"
  const buttonStyle = {
    lineHeight: 1.1, // Line height for text wrapping
    height: "36px", // Fixed height to match language switcher
    minHeight: "36px", // Ditto
  }
  const { locale, isLoading } = useTranslation()

  // Use 'en' as default until client-side hydration is complete
  const safeLocale = !locale || isLoading ? "en" : locale
  const componentText =
    translations[safeLocale as keyof TranslationsMap] || translations.en

  // Only show secondary navigation if explicitly enabled and not on mobile
  const displaySecondaryNav =
    showSecondaryNav && !isMobile && secondaryNavItems.length > 0

  // Determine the text color for all navigation items based on active section
  // Default to white, switch to black for specific sections
  const textColor = blackSections.includes(activeSection || "")
    ? "black"
    : "white"

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme.zIndex.appBar,
        backgroundColor: "white",
        borderBottom: "none",
        color: theme.palette.text.primary,
        borderRadius: theme.borderRadius.none,
        boxShadow: "none",
      }}
      elevation={0}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", paddingLeft: 1 }}>
          <Logo />
        </Box>

        {/* Optional secondary navigation menu */}
        {displaySecondaryNav && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              flexGrow: 1,
              justifyContent: "center",
              display: { xs: "none", md: "flex" },
              mx: 2,
            }}
          >
            {secondaryNavItems.map((item) => {
              // Check if this section is directly active or if it's the parent of the active section
              const isActive =
                activeSection === item.sectionId ||
                sectionParentMap[activeSection || ""] === item.sectionId

              return (
                <Button
                  key={item.key}
                  variant="text"
                  disableRipple
                  onClick={() => onSectionClick?.(item.sectionId)}
                  sx={{
                    color: textColor, // Apply the same color to all items
                    minWidth: "auto",
                    px: isTablet ? 1 : 2,
                    fontSize: theme.typography.nav.fontSize,
                    position: "relative",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    fontWeight: isActive ? 600 : 500,
                    transition: "color 0.3s ease",
                    lineHeight: 1.1, // Slightly more spacing between lines when wrapped
                    "&:hover": {
                      backgroundColor: "transparent",
                    },
                    "&.MuiButtonBase-root:hover": {
                      backgroundColor: "transparent",
                    },
                  }}
                >
                  {item.label}
                  {isActive && (
                    <ArrowDropDownIcon
                      sx={{
                        position: "absolute",
                        bottom: -12,
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: 24,
                        color: textColor,
                        animation: "fadeIn 0.3s ease-in-out",
                        "@keyframes fadeIn": {
                          "0%": {
                            opacity: 0,
                            transform: "translateX(-50%) translateY(-5px)",
                          },
                          "100%": {
                            opacity: 1,
                            transform: "translateX(-50%) translateY(0)",
                          },
                        },
                      }}
                    />
                  )}
                </Button>
              )
            })}
          </Stack>
        )}

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={(theme) => ({
            // If drawer is on the right side
            ...(drawerPosition === "right" && {
              paddingRight: drawerOpen
                ? `calc(${theme.layout.drawer.width}px + 16px)` // Wide padding when drawer is open
                : `calc(${theme.layout.drawer.closedWidth}px + 16px)`, // Narrower padding when drawer is closed
            }),
            // If drawer is on the left side
            ...(drawerPosition === "left" && {
              paddingRight: "16px",
            }),
            transition: theme.transitions.create("padding", {
              easing: theme.transitions.easing.sharp,
              duration: drawerOpen
                ? theme.transitions.duration.enteringScreen
                : theme.transitions.duration.leavingScreen,
            }),
          })}
        >
          <Button
            variant={buttonVariant}
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
