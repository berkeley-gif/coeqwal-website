"use client"

/**
 * TwoColumnInterstitial - Split panel with headline/body on the left and
 * a navigable link list on the right.
 *
 * Responsive: stacks vertically on mobile, side-by-side on md+.
 */

import { Box, Typography, useTheme } from "@mui/material"
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"

/** A single link row with label and forward arrow */
export interface InterstitialLink {
  /** Display text */
  label: string
  /** Optional click handler */
  onClick?: () => void
  /** Optional href (renders as anchor-like behavior) */
  href?: string
  /** Link target, e.g. "_blank" for external links */
  target?: string
  /** Rel attribute, e.g. "noopener noreferrer" for external links */
  rel?: string
}

export interface TwoColumnInterstitialProps {
  /** Headline text (left column, top) */
  headline: string
  /** Supporting body text below the headline */
  body: string
  /** Label above the link list (right column) */
  linkListLabel: string
  /** Navigable link rows */
  links: InterstitialLink[]
  /** Optional scroll prompt text (left column, bottom). Set to null to hide. */
  scrollPrompt?: string | null
  /** Optional click handler for the scroll prompt */
  onScrollPromptClick?: () => void
  /** Text color override (defaults to theme.palette.blue.darkest) */
  color?: string
}

/** Individual link row */
function LinkRow({ link, color }: { link: InterstitialLink; color: string }) {
  return (
    <Box
      component={link.href ? "a" : "div"}
      {...(link.href ? { href: link.href } : {})}
      {...(link.target ? { target: link.target } : {})}
      {...(link.rel ? { rel: link.rel } : {})}
      onClick={link.onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        py: 2,
        borderBottom: `1px solid ${color}20`,
        cursor: "pointer",
        textDecoration: "none",
        color: "inherit",
        "&:last-child": { borderBottom: "none" },
        "&:hover .interstitial-arrow": { transform: "translateX(4px)" },
      }}
    >
      <Typography variant="subtitle1">{link.label}</Typography>
      <ArrowForwardIcon
        className="interstitial-arrow"
        sx={{
          fontSize: "1.1rem",
          opacity: 0.6,
          flexShrink: 0,
          transition: "transform 0.15s ease",
        }}
      />
    </Box>
  )
}

export function TwoColumnInterstitial({
  headline,
  body,
  linkListLabel,
  links,
  scrollPrompt = "Scroll to explore",
  onScrollPromptClick,
  color: colorProp,
}: TwoColumnInterstitialProps) {
  const theme = useTheme()
  const color = colorProp ?? theme.palette.common.white

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: { xs: 3, md: 6 },
        py: { xs: 3, md: 4 },
        px: theme.space.panel.padding,
        color,
      }}
    >
      {/* Left column: headline + body + scroll prompt */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography variant="tabLabel" sx={{ maxWidth: "22ch", lineHeight: 1.25, textTransform: "none" }}>
            {headline}
          </Typography>
          <Typography
            variant="body2"
            component="p"
            sx={{ maxWidth: "40ch", opacity: 0.85, lineHeight: 1.5 }}
          >
            {body}
          </Typography>
        </Box>
        {scrollPrompt !== null && (
          <Box
            role={onScrollPromptClick ? "button" : undefined}
            tabIndex={onScrollPromptClick ? 0 : undefined}
            onClick={onScrollPromptClick}
            onKeyDown={
              onScrollPromptClick
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onScrollPromptClick()
                    }
                  }
                : undefined
            }
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              pt: 3,
              cursor: "pointer",
              opacity: 0.5,
              "&:hover": { opacity: 0.8 },
              "&:hover .scroll-arrow": {
                transform: "rotate(90deg) translateX(4px)",
              },
            }}
          >
            <Typography variant="overline">
              {scrollPrompt}
            </Typography>
            <ArrowForwardIcon
              className="scroll-arrow"
              sx={{
                fontSize: "1.1rem",
                transform: "rotate(90deg)",
                transition: "transform 0.15s ease",
              }}
            />
          </Box>
        )}
      </Box>

      {/* Right column: labeled link list (hidden when no links) */}
      {links.length > 0 && (
        <Box sx={{ flex: 1 }}>
          {linkListLabel && (
            <Typography
              variant="overline"
              component="h4"
              sx={{ mb: 1, opacity: 0.6 }}
            >
              {linkListLabel}
            </Typography>
          )}
          {links.map((link, i) => (
            <LinkRow key={i} link={link} color={color} />
          ))}
        </Box>
      )}
    </Box>
  )
}

export default TwoColumnInterstitial
