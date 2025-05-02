"use client"

import {
  AppBar,
  Toolbar,
  Stack,
  Button,
  Box,
  useMediaQuery,
  useTheme,
} from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"
import { LanguageSwitcher } from "@repo/ui"
import { Logo } from "../../../ui/src/components/common/Logo"
import { useRef, useState } from "react"
import { motion, useMotionValueEvent, useScroll } from "framer-motion"

const MotionAppBar = motion.create(AppBar)

type HeaderTranslations = {
  title: string
  buttons: {
    home: string
    about: string
  }
}

type TranslationsMap = {
  en: HeaderTranslations
  es: HeaderTranslations
}

interface HeaderProps {
  drawerOpen?: boolean
  drawerPosition?: "left" | "right"
}

const translations: TranslationsMap = {
  en: {
    title: "COEQWAL",
    buttons: {
      home: "Home",
      about: "About COEQWAL",
    },
  },
  es: {
    title: "COEQWAL",
    buttons: {
      home: "Inicio",
      about: "Sobre COEQWAL",
    },
  },
}

export function HeaderStory({
  drawerOpen = false,
  drawerPosition = "right",
}: HeaderProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const buttonVariant = isMobile ? "text" : "standard"
  const buttonStyle = {}
  const { locale, isLoading } = useTranslation()
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

  return (
    <MotionAppBar
      animate={isHidden ? "hidden" : "visible"}
      whileHover="visible" // this doesn't do anything now
      onFocusCapture={() => setIsHidden(false)} // this doesn't do anything now, but it is for accessibility
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
        backgroundColor: theme.background.transparent,
        borderBottom: theme.border.standard,
        color: theme.palette.text.primary,
        borderRadius: theme.borderRadius.none,
        boxShadow: "none",
        "--header-height": "64.5px",
      }}
      elevation={0}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", paddingLeft: 1 }}>
          <Logo />
        </Box>
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
              paddingRight: "16px", // Fixed padding for left drawer
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
            {componentText.buttons.home}
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
    </MotionAppBar>
  )
}
