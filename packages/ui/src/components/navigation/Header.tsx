"use client"

import { AppBar, Toolbar, Stack, Button, Box } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { useMediaQuery } from "@mui/material"
import { useTranslation } from "@repo/i18n"
import { LanguageSwitcher } from "../index"
import { Logo } from "../common/Logo"
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown"
import { motion, useMotionValueEvent, useScroll } from "@repo/motion"
import { useRef, useState } from "react"

const MotionAppBar = motion.create(AppBar)

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

// Secondary nav option (optional)
export interface SecondaryNavItem {
  key: string
  label: string
  sectionId: string
}

interface HeaderProps {
  activeSection?: string
  onSectionClick?: (sectionId: string) => void
  showSecondaryNav?: boolean
  secondaryNavItems?: SecondaryNavItem[]
  onDataClick?: () => void
}

const translations: TranslationsMap = {
  en: {
    title: "COEQWAL",
    buttons: {
      about: "About COEQWAL",
      getData: "Download data",
    },
  },
  es: {
    title: "COEQWAL",
    buttons: {
      about: "Sobre COEQWAL",
      getData: "Descargar datos",
    },
  },
}

// This maps sections to their parent section in the UI
// Used for arrow display when scrolling through combined sections
const sectionParentMap: Record<string, string | undefined> = {
  challenges: "managing-water", // Map challenges section to managing-water button
  calsim: "managing-water",
}

export function Header({
  activeSection,
  onSectionClick,
  showSecondaryNav = false,
  secondaryNavItems = [], // Default to empty array, bc optional
  onDataClick,
}: HeaderProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const isTablet = useMediaQuery(theme.breakpoints.down("md"))
  const buttonVariant = isMobile ? "text" : "standard"
  const buttonStyle = {
    lineHeight: 1.1, // Line height for text wrapping
    height: theme.spacing(4.5), // 36px to match language switcher
    minHeight: theme.spacing(4.5), // 36px
  }
  const { locale, isLoading } = useTranslation()

  // Scroll-based hide/show functionality
  const [isHidden, setIsHidden] = useState(false)
  const { scrollY } = useScroll()
  const lastYRef = useRef(0)

  useMotionValueEvent(scrollY, "change", (latest) => {
    const difference = latest - lastYRef.current
    if (Math.abs(difference) > 10) {
      setIsHidden(difference > 0)
    }
    lastYRef.current = latest
  })

  // Use 'en' as default until client-side hydration is complete
  const safeLocale = !locale || isLoading ? "en" : locale
  const componentText =
    translations[safeLocale as keyof TranslationsMap] || translations.en

  // Only show secondary navigation if explicitly enabled and not on mobile
  const displaySecondaryNav =
    showSecondaryNav && !isMobile && secondaryNavItems.length > 0

  // Set text color to always be white
  const textColor = "white"

  return (
    <MotionAppBar
      animate={isHidden ? "hidden" : "visible"}
      whileHover="visible"
      onFocusCapture={() => setIsHidden(false)} // Accessibility: show header when focused
      variants={{
        hidden: {
          y: "-100%",
        },
        visible: {
          y: "0%",
        },
      }}
      transition={{ duration: 0.3 }}
      position="fixed"
      sx={{
        zIndex: theme.zIndex.appBar,
        backgroundColor: "transparent",
        borderBottom: theme.border.standard,
        color: theme.palette.text.primary,
        borderRadius: theme.borderRadius.none,
        boxShadow: "none",
      }}
      elevation={0}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", pl: 2 }}>
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
                    color: textColor,
                    minWidth: "auto",
                    px: isTablet ? 1 : 2,
                    fontSize: theme.typography.nav.fontSize,
                    position: "relative",
                    textTransform: "uppercase",
                    letterSpacing: "0.03rem",
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
          sx={{
            pr: 2,
          }}
        >
          <Button
            variant={buttonVariant}
            sx={{
              ...buttonStyle,
              color: textColor,
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                backgroundColor: "white",
                color: (theme) => theme.palette.blue.darkest,
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(52, 69, 116, 0.4)",
                "&::before": {
                  opacity: 1,
                },
              },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: "-100%",
                width: "100%",
                height: "100%",
                background:
                  "linear-gradient(90deg, transparent, rgba(52, 69, 116, 0.1), transparent)",
                transition: "left 0.5s ease",
                opacity: 0,
              },
              "&:hover::before": {
                left: "100%",
              },
            }}
          >
            {componentText.buttons.about}
          </Button>
          <Button
            variant={buttonVariant}
            onClick={onDataClick}
            sx={{
              ...buttonStyle,
              color: textColor,
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                backgroundColor: "white",
                color: (theme) => theme.palette.blue.darkest,
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(52, 69, 116, 0.4)",
                "&::before": {
                  opacity: 1,
                },
              },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: "-100%",
                width: "100%",
                height: "100%",
                background:
                  "linear-gradient(90deg, transparent, rgba(52, 69, 116, 0.1), transparent)",
                transition: "left 0.5s ease",
                opacity: 0,
              },
              "&:hover::before": {
                left: "100%",
              },
            }}
          >
            {componentText.buttons.getData}
          </Button>
          <LanguageSwitcher />
        </Stack>
      </Toolbar>
    </MotionAppBar>
  )
}
