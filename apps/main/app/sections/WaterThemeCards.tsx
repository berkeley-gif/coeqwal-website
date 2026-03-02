"use client"

/**
 * WaterThemeCards — extracted from IntroSection for safekeeping.
 *
 * Contains the ThemeCard component and the grid layouts for the
 * four main water-theme cards + two provisional theme cards.
 * Originally rendered as children of the "What water issues matter to you?"
 * CoeqwalPanel in IntroSection.
 */

import Image from "next/image"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { motion } from "@repo/motion"
import { ScrollReveal } from "@repo/scrollytelling"
import { WATER_THEMES } from "@repo/data/coeqwal"
import { THEME_LABEL_CONFIG } from "../content/themes"

const RULE = "1px solid #e5e5df"

const MotionBox = motion.create(Box)

/* ─────────────────────────────────────────────────────────────────────────── */
/* CONSTANTS                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

const WATER_THEME_IDS = ["cws", "ag_gw", "eco", "delta"] as const

const WATER_THEME_PHOTOS: Partial<Record<string, string>> = {
  cws: "/images/themes/FL_Porterville-9320.jpg",
  ag_gw: "/images/themes/PJH_Sprinklers_10911-2_07_15_2004.jpg",
  eco: "/images/themes/CC_salmon_underH20-5_10_15_2012.jpg",
  delta: "/images/themes/Screenshot 2026-02-25 at 11.21.jpg",
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* THEME CARD                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

/** Water-theme card — coloured header, photo, description */
function ThemeCard({
  label,
  description,
  photo,
  bg,
  textColor,
  index,
}: {
  label: string
  description: string
  photo?: string
  bg: string
  textColor: string
  index: number
}) {
  const theme = useTheme()
  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: index * 0.07 }}
      sx={{
        display: "flex",
        flexDirection: "column",
        border: RULE,
        borderRadius: theme.borderRadius.md,
        overflow: "hidden",
      }}
    >
      {/* Coloured header */}
      <Box
        sx={{
          backgroundColor: bg,
          px: { xs: 3, md: 3.5 },
          py: { xs: 2.5, md: 3 },
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1rem", md: "1.05rem" },
            lineHeight: 1.3,
            color: textColor,
          }}
        >
          {label}
        </Typography>
      </Box>

      {/* Photo */}
      <Box
        aria-hidden="true"
        sx={{
          width: "100%",
          aspectRatio: "4 / 3",
          position: "relative",
          backgroundColor: "#d8d8d8",
        }}
      >
        {photo && (
          <Image
            src={photo}
            alt=""
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        )}
      </Box>

      {/* Description */}
      <Box
        sx={{
          backgroundColor: "#fff",
          px: { xs: 3, md: 3.5 },
          py: { xs: 2.5, md: 3 },
          flex: 1,
        }}
      >
        <Typography variant="body2" sx={{ color: "#555", lineHeight: 1.7 }}>
          {description}
        </Typography>
      </Box>
    </MotionBox>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* WATER THEME CARDS GRID                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

export function WaterThemeCards({
  waterThemePalette,
}: {
  waterThemePalette: Record<string, { background: string; text: string }>
}) {
  return (
    <>
      {/* Four main theme cards — reveal the grid as it enters the viewport */}
      <ScrollReveal animation="fadeUp" amount={0.1} duration={0.5}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              lg: "repeat(4, 1fr)",
            },
            gap: { xs: 2, md: 2 },
          }}
        >
          {WATER_THEME_IDS.map((id, i) => {
            const colors = waterThemePalette[id] ?? {
              background: "#eee",
              text: "#333",
            }
            const description =
              WATER_THEMES.find((t) => t.id === id)?.description ?? ""
            return (
              <ThemeCard
                key={id}
                label={THEME_LABEL_CONFIG[id]?.label ?? id}
                description={description}
                photo={WATER_THEME_PHOTOS[id]}
                bg={colors.background}
                textColor={colors.text}
                index={i}
              />
            )
          })}
        </Box>
      </ScrollReveal>

      {/* ── Provisional themes (pending decision) ── */}
      <ScrollReveal animation="fadeUp" amount={0.1} duration={0.5} delay={0.1}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              lg: "repeat(4, 1fr)",
            },
            gap: { xs: 2, md: 2 },
            mt: 2,
          }}
        >
          {(["climate", "governance"] as const).map((id, i) => {
            const themeEntry = WATER_THEMES.find((t) => t.id === id)
            const description = themeEntry?.description ?? ""
            const label = (themeEntry?.label ?? id).replace(/\n/g, " ")
            return (
              <ThemeCard
                key={id}
                label={label}
                description={description}
                bg="#efefef"
                textColor="#444"
                index={i}
              />
            )
          })}
        </Box>
      </ScrollReveal>
    </>
  )
}
