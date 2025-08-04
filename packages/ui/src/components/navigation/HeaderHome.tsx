"use client"

import { AppBar, Toolbar, Stack, Button, Box } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { useMediaQuery } from "@mui/material"
import { useTranslation } from "@repo/i18n"
import { LanguageSwitcher } from "../index"
import { Logo } from "../common/Logo"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import { useState, useEffect, useRef } from "react"
import { motion } from "@repo/motion"
interface HeaderProps {
  backgroundColor: "white"
  onGlossaryClick?: () => void
  isGlossaryActive?: boolean
  onDataClick?: () => void
}

// Transition

const MotionAppBar = motion.create(AppBar)
const MotionStack = motion.create(Stack)

// Translation

type HeaderTranslations = {
  title: string
  buttons: {
    getData: string
    about: string
    glossary: string
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
      glossary: "Glossary",
    },
  },
  es: {
    title: "COEQWAL",
    buttons: {
      getData: "Datos sin procesar",
      about: "Sobre COEQWAL",
      glossary: "Glosario",
    },
  },
}

export function HeaderHome({
  onGlossaryClick,
  isGlossaryActive = false,
  onDataClick,
}: HeaderProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const { locale, isLoading } = useTranslation()

  // Transition
  // todo: refine these states into fewer
  // Track scroll position for dynamic background
  const [isScrolled, setIsScrolled] = useState(false)
  const [shrunkWidth, setShrunkWidth] = useState<number | null>(null)
  const [isExpanding, setIsExpanding] = useState(false)
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const isInitializedRef = useRef(false)
  const isManuallyExpandedRef = useRef(false)

  // Keep refs in sync with state
  useEffect(() => {
    isManuallyExpandedRef.current = isManuallyExpanded
  }, [isManuallyExpanded])

  // Measure the content width when in shrunk state
  useEffect(() => {
    if (isScrolled && toolbarRef.current) {
      // Wait for DOM to update, then measure
      setTimeout(() => {
        if (toolbarRef.current) {
          const logoWidth =
            toolbarRef.current.children[0]?.getBoundingClientRect().width || 0
          const glossaryWidth =
            toolbarRef.current.children[1]?.getBoundingClientRect().width || 0
          const padding = 32 // Account for padding
          setShrunkWidth(logoWidth + glossaryWidth + padding)
        }
      }, 50)
    }
  }, [isScrolled])

  useEffect(() => {
    // Find the main content area or intro section to place our sentinel
    const introSection =
      document.getElementById("intro") || document.querySelector("main")

    if (!introSection) {
      return
    }

    // Create a sentinel element at the top of the content
    const sentinel = document.createElement("div")
    sentinel.style.position = "absolute"
    sentinel.style.top = "100px" // 100px down from the start of content
    sentinel.style.left = "0"
    sentinel.style.height = "10px" // Slightly larger height for better detection
    sentinel.style.width = "100%"
    sentinel.style.pointerEvents = "none"
    sentinel.style.visibility = "hidden"
    sentinel.id = "scroll-sentinel"

    // Insert the sentinel into the intro section
    introSection.style.position = "relative" // Ensure it's positioned for absolute children
    introSection.appendChild(sentinel)

    // Debounce the state update
    let timeoutId: number | null = null

    // Create intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry) {
          // Clear any pending timeout
          if (timeoutId) {
            clearTimeout(timeoutId)
          }

          // Debounce the state update to prevent rapid switching
          timeoutId = window.setTimeout(() => {
            const newIsScrolled = !entry.isIntersecting
            setIsScrolled(newIsScrolled)

            // Mark as initialized after first stable detection
            if (!isInitializedRef.current) {
              isInitializedRef.current = true
              setIsInitialized(true)
            }

            // Reset manual expansion when returning to top
            if (!newIsScrolled && isManuallyExpandedRef.current) {
              setIsManuallyExpanded(false)
            }

            // Set expanding state only for natural scroll-to-top transitions
            if (!newIsScrolled && !isManuallyExpandedRef.current) {
              setIsExpanding(true)
            } else {
              setIsExpanding(false)
            }
          }, 50) // 50ms debounce
        }
      },
      {
        threshold: [0],
        rootMargin: "-50px 0px", // Add some margin to prevent edge flickering
      },
    )

    // Start observing the sentinel
    observer.observe(sentinel)

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      observer.disconnect()
      if (sentinel.parentNode) {
        sentinel.parentNode.removeChild(sentinel)
      }
    }
  }, [])

  // Use 'en' as default until client-side hydration is complete
  const safeLocale = !locale || isLoading ? "en" : locale
  const componentText =
    translations[safeLocale as keyof TranslationsMap] || translations.en

  const headerTextColor = "white"

  // Conditional styling based on variant
  const variantStyles =
{
          backgroundColor: theme.palette.nature.whisper,
          // buttonBackgroundColor: theme.palette.utility.black,
          borderRadius: "16px",
          margin: "16px",
          border: "none",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          left: 0, // Keep anchored to left when shrinking
        }

  // Calculate width for smooth animation
  const getAnimatedWidth = () => {
      if (!headerIsExpanded && shrunkWidth) {
        return `${shrunkWidth}px`
      }
      return "calc(100% - 32px)"
    } 

  const buttonVariant = isMobile ? "text" : "standard"
  const buttonStyle = {
    backgroundColor: theme.palette.blue.darkest,
    lineHeight: 1.1, // Line height for text wrapping
    height: "40px", // Increased height for more prominence
    minHeight: "40px", // Ditto
    fontFamily:
      '"neue-haas-grotesk-display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeight: 600,
    border: "1px solid",
    borderColor: "white",
    color: headerTextColor, // Use header text color for buttons
  }

  // Determine if buttons should be visible
  const shouldShowButtons =
    isInitialized &&
    // Always show buttons when not scrolled (natural expanded state)
    (!isScrolled ||
      // Or when manually expanded (but still scrolled)
      (isScrolled && isManuallyExpanded && !isExpanding))

  // Determine if header should appear expanded
  const headerIsExpanded = !isScrolled || (isScrolled && isManuallyExpanded)

  return (
    <MotionAppBar
      animate={{ width: getAnimatedWidth() }}
      transition={{
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1], // Cubic bezier for smooth easing
      }}
      onAnimationComplete={() => {
        // Only handle expanding state for natural scroll-to-top transitions
        if (isExpanding) {
          setIsExpanding(false)
        }
      }}
      position="fixed"
      sx={{
        zIndex: theme.zIndex.appBar,
        ...variantStyles,
        color: headerTextColor,
        boxShadow: "none",
        transition: "background-color 0.3s ease",
      }}
      elevation={0}
    >
      <Toolbar
        ref={toolbarRef}
        sx={{
          justifyContent: "space-between",
          overflow: "hidden", // Clip content that doesn't fit when header shrinks
          width: "100%",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", paddingLeft: 1 }}>
          <Logo />
        </Box>

        {/* Optional secondary navigation menu */}
        {/* {displaySecondaryNav && (
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
                    color: headerTextColor, // Apply the header text color to all items
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
                        color: headerTextColor,
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
        )} */}

        {/* Main navigation buttons */}
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{
            paddingRight: "8px",
          }}
        >
          {/* Close button - only visible when manually expanded */}
          {isManuallyExpanded && (
            <Button
              variant="text"
              onClick={() => {
                setIsManuallyExpanded(false)
              }}
              sx={{
                minWidth: "auto",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                padding: 0,
                color: headerTextColor,
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              <PlayArrowIcon
                sx={{ fontSize: 20, transform: "rotate(180deg)" }}
              />
            </Button>
          )}

          {/* Fading buttons group */}
          <MotionStack
            direction="row"
            spacing={2}
            alignItems="center"
            animate={{
              opacity: shouldShowButtons ? 1 : 0,
            }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
          >
            {shouldShowButtons && (
              <>
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
              </>
            )}
          </MotionStack>

          {/* Glossary button - always visible */}
          <Button
            variant={buttonVariant}
            onClick={onGlossaryClick}
            sx={{
              ...buttonStyle,
              // backgroundColor: isGlossaryActive ? "#60aacb" : undefined,

              color: isGlossaryActive ? "white" : undefined,
              "&:hover": {
                backgroundColor: isGlossaryActive ? "#7cbad5" : undefined,
              },
            }}
          >
            {componentText.buttons.glossary}
          </Button>

          {/* Expand button - only visible when collapsed */}
          {isScrolled && !isManuallyExpanded && (
            <Button
              variant="text"
              onClick={() => {
                setIsManuallyExpanded(true)
                setIsExpanding(true)
              }}
              sx={{
                minWidth: "auto",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                padding: 0,
                color: headerTextColor,
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              <PlayArrowIcon sx={{ fontSize: 20 }} />
            </Button>
          )}
        </Stack>
      </Toolbar>
    </MotionAppBar>
  )
}
