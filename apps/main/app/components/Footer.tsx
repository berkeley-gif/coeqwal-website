"use client"

/**
 * Footer - Site-wide footer with credit text and a link list that
 * mirrors BaseHeader's navigation, using accordions for the two nav
 * items that are dropdowns in the header (Water Stories, Water Issues).
 *
 * Renders on the marketing pages ("/", "/data", "/about") only — the
 * Header gates the tab routes ("/learn", "/explore", "/share") out of
 * this same footer using the same isTabsPage logic, since those pages
 * have their own full-bleed layout.
 *
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.3.1: Semantic <footer> landmark
 * - WCAG 1.1.1: Alt text for logo images
 */

import * as React from "react"
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ExpandMoreIcon,
  MailOutlineIcon,
  Fade,
  useTheme,
} from "@repo/ui/mui"
import type { Theme } from "@repo/ui/mui"
import { usePathname, useRouter } from "next/navigation"
import { useTabNavigation } from "../hooks/useTabNavigation"
import { usePanelRoute } from "../hooks/usePanelRoute"
import { WATER_THEMES } from "../content/themes"

// TODO: swap placeholder logos/credit text for real COEQWAL partner assets
const PARTNER_LOGOS = [
  {
    src: "/images/about/logo-uc-ri.png",
    alt: "UC Research & Innovation",
    width: 205,
  },
  {
    src: "/images/GIF-logo.png",
    alt: "Geospatial Innovation Facilities",
    width: 185,
  },
]

// Mirrors the Water Stories dropdown in BaseHeader.tsx. Duplicated here
// (not imported) because BaseHeader keeps this URL list module-private —
// if BaseHeader's URLS ever change, update both.
const WATER_STORIES = [
  {
    key: "flow",
    label: "How water flows through California",
    href: "https://flow.coeqwal.org",
  },
  {
    key: "climate",
    label: "How climate affects California water",
    href: "https://climate.coeqwal.org",
  },
  {
    key: "managed",
    label: "How California water is managed",
    href: "https://management.coeqwal.org",
  },
  {
    key: "equity",
    label: "How equity shapes California water",
    href: "https://equity.coeqwal.org",
  },
]

// Shared by both footer accordions (Water Stories, Water Issues) so the
// expand/collapse animation logic isn't duplicated per-instance.
function footerAccordionSx(theme: Theme, isExpanded: boolean) {
  return [
    {
      backgroundColor: "transparent",
      color: theme.palette.common.white,
      boxShadow: "none",
      "&::before": { display: "none" },
      "& .MuiAccordionSummary-root": { backgroundColor: "transparent" },
      "& .MuiAccordionDetails-root": { backgroundColor: "transparent" },
    },
    isExpanded
      ? {
        "& .MuiAccordion-region": { height: "auto" },
        "& .MuiAccordionDetails-root": { display: "block" },
      }
      : {
        "& .MuiAccordion-region": { height: 0 },
        "& .MuiAccordionDetails-root": { display: "none" },
      },
  ]
}

// Reset styles so a Typography can act as an unstyled nav button,
// reused by every top-level footer link (Get Started, Tools, Data, About).
const footerLinkButtonSx = {
  background: "none",
  border: "none",
  color: "inherit",
  cursor: "pointer",
  padding: 0,
  textAlign: "inherit" as const,
}

const accordionSummarySx = {
  justifyContent: "left",
  minHeight: "25px",
  paddingLeft: 0,
  paddingRight: 0,
  "&.Mui-expanded": { minHeight: "25px", height: "25px" },
  "& .MuiAccordionSummary-content": { margin: 0, width: "auto", flexGrow: 0 },
}

export function Footer() {
  // All hooks called unconditionally, every render — the early return
  // below must come AFTER this block, or navigating between a tabs
  // route and a marketing route mid-session throws "rendered more
  // hooks than during the previous render."
  const pathname = usePathname()
  const theme = useTheme()
  const router = useRouter()
  const { navigateToTab } = useTabNavigation()
  const { openThemePanel } = usePanelRoute()

  // Tracks which single footer accordion (if any) is open, by key
  const [expandedPanel, setExpandedPanel] = React.useState<string | false>(
    false,
  )
  const handleAccordionChange =
    (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) =>
      setExpandedPanel(isExpanded ? panel : false)

  const isTabsPage =
    pathname === "/learn" || pathname === "/explore" || pathname === "/share"
  if (isTabsPage) return null

  const waterIssues = WATER_THEMES.map((wt) => ({
    key: wt.id,
    label: wt.label.replace(/\n/g, " "),
    onClick: () => openThemePanel(wt.id),
    disabled: wt.sections.length === 0,
  }))

  return (
    <Box
      component="footer"
      aria-label="Site footer"
      sx={{
        color: theme.palette.common.white,
        backgroundColor: theme.palette.common.black,
        py: { xs: 8, lg: 8 },
        px: { xs: 2, lg: 13 },
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
        textAlign: { xs: "center", lg: "left" },
      }}
    >
      {/* Left: credit text + partner logos */}
      <Box
        sx={{
          flexBasis: { lg: "65%" },
          borderRight: { lg: `1px solid ${theme.palette.common.white}` },
          pr: { lg: 12 },
        }}
      >
        <Typography variant="dashboard">
          {/* TODO: replace with real COEQWAL credit text */}
          This research project is supported by funds from the California
          Climate Action Seed and Matching Grants Program of the University of
          California (Grant Number R02CM7222). This funding is part of the
          California Climate Action Initiative, a $100 million investment in
          climate action research and innovation projects in the California
          State Budget Act of 2022-2023.
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            py: { xs: 5, lg: 2 },
            flexWrap: { xs: "wrap", lg: "nowrap" },
            justifyContent: { xs: "center", lg: "flex-start" },
          }}
        >
          {PARTNER_LOGOS.map((logo) => (
            <Box
              key={logo.src}
              component="img"
              src={logo.src}
              alt={logo.alt}
              sx={{ width: logo.width, height: "auto" }}
            />
          ))}
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            pt: 1,
          }}
        >
          <Typography
            variant="compactSubtitle"
            sx={{ display: "block", lineHeight: 1.5 }}
          >
            We thank our partners at DWR, Freshwaters Illustrated and Kike Arnal
            for the imagery used in this site
          </Typography>
          <Typography variant="compactSubtitle" sx={{ display: "block" }}>
            © COEQWAL 2026
          </Typography>
        </Box>
      </Box>

      {/* Right: nav links mirroring BaseHeader */}
      <Box
        sx={{
          flexBasis: { lg: "35%" },
          pl: { lg: 12 },
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          fontSize: "16px",
        }}
      >
        {/* Get Started */}
        <Typography
          variant="caption"
          component="button"
          onClick={() => navigateToTab("learn")}
          sx={footerLinkButtonSx}
        >
          Get Started
        </Typography>

        {/* Water Stories (submenu accordion, mirrors BaseHeader's dropdown) */}
        <Accordion
          expanded={expandedPanel === "water-stories"}
          onChange={handleAccordionChange("water-stories")}
          elevation={0}
          TransitionComponent={
            Fade as unknown as React.ComponentProps<
              typeof Accordion
            >["TransitionComponent"]
          }
          TransitionProps={{ timeout: 500 }}
          sx={footerAccordionSx(theme, expandedPanel === "water-stories")}
        >
          <AccordionSummary
            expandIcon={
              <ExpandMoreIcon sx={{ color: theme.palette.common.white }} />
            }
            aria-controls="footer-water-stories-content"
            id="footer-water-stories-header"
            sx={accordionSummarySx}
          >
            <Typography
              component="span"
              variant="caption"
              sx={{ fontSize: "16px" }}
            >
              Water Stories
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              component="ul"
              sx={{ listStyle: "none", padding: 0, fontSize: "14px" }}
            >
              {WATER_STORIES.map((story) => (
                <li key={story.key}>
                  <Typography
                    component="a"
                    href={story.href}
                    target="_blank"
                    variant="dashboard"
                    sx={{ color: "inherit" }}
                  >
                    {story.label}
                  </Typography>
                </li>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Water Issues (submenu accordion, mirrors BaseHeader's waterThemesOptions dropdown) */}
        <Accordion
          expanded={expandedPanel === "water-issues"}
          onChange={handleAccordionChange("water-issues")}
          elevation={0}
          TransitionComponent={
            Fade as unknown as React.ComponentProps<
              typeof Accordion
            >["TransitionComponent"]
          }
          TransitionProps={{ timeout: 500 }}
          sx={footerAccordionSx(theme, expandedPanel === "water-issues")}
        >
          <AccordionSummary
            expandIcon={
              <ExpandMoreIcon sx={{ color: theme.palette.common.white }} />
            }
            aria-controls="footer-water-issues-content"
            id="footer-water-issues-header"
            sx={accordionSummarySx}
          >
            <Typography
              component="span"
              variant="caption"
              sx={{ fontSize: "16px" }}
            >
              Water Issues
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              component="ul"
              sx={{ listStyle: "none", padding: 0, fontSize: "14px" }}
            >
              {waterIssues.map((issue) => (
                <li key={issue.key}>
                  <Typography
                    component="a"
                    target="_blank"
                    onClick={issue.disabled ? undefined : issue.onClick}
                    aria-disabled={issue.disabled}
                    variant="dashboard"
                    sx={{
                      color: "inherit",
                      textDecoration: "underline",
                      ...(issue.disabled && {
                        opacity: 0.5,
                        pointerEvents: "none",
                      }),
                    }}
                  >
                    {issue.label}
                  </Typography>
                </li>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Tools */}
        <Typography
          variant="caption"
          component="button"
          onClick={() => navigateToTab("explore")}
          sx={footerLinkButtonSx}
        >
          Tools
        </Typography>

        {/* Data */}
        <Typography
          variant="caption"
          component="button"
          onClick={() => router.push("/data")}
          sx={footerLinkButtonSx}
        >
          Data
        </Typography>

        {/* About Us */}
        <Typography
          variant="caption"
          component="button"
          onClick={() => router.push("/about")}
          sx={footerLinkButtonSx}
        >
          About Us
        </Typography>

        <Typography
          variant="caption"
          component="a"
          href="mailto:coeqwal@berkeley.edu"
          sx={{ color: "inherit" }}
        >
          <MailOutlineIcon sx={{ fontSize: "1em", mr: 1 }} />
          Contact Us
        </Typography>
      </Box>
    </Box>
  )
}
