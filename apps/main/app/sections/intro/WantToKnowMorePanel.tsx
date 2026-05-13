"use client"

/**
 * Closing panel of the IntroSection: a frame + rounded inset panel
 * inviting the user to learn / explore / share.
 *
 * `id="want-to-know-more"` sits on the OUTER white frame wrapper (not
 * the inner rounded card) so the WaterThemes panel's scroll-advance
 * arrow lands this panel with the same geometry as the panels above:
 * the frame's top `insetY` tucks behind the fixed header and the
 * inner rounded card lines up flush at `y = headerHeight`.
 */

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { motion } from "@repo/motion"

const MotionBox = motion.create(Box)

const VERBS: Array<{ verb: string; rest: string }> = [
  {
    verb: "Learn",
    rest: "how water in California\u2019s Central Valley is managed",
  },
  {
    verb: "Explore",
    rest: "how water outcomes shift under different scenarios",
  },
  {
    verb: "Share",
    rest: "your insights about California\u2019s water future",
  },
]

export function WantToKnowMorePanel() {
  const theme = useTheme()

  return (
    <Box
      id="want-to-know-more"
      sx={{
        backgroundColor: theme.palette.common.white,
        px: theme.layout.panel.insetX,
        py: theme.layout.panel.insetY,
      }}
    >
      <Box
        component="section"
        aria-label="On this site, you can"
        sx={{
          backgroundColor: "brand.panelLight",
          borderRadius: theme.layout.panel.radius,
          overflow: "hidden",
          px: theme.space.panel.padding,
          pt: theme.space.panel.padding,
          pb: `calc(${theme.space.panel.padding} + 50px)`,
        }}
      >
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Typography variant="h2Main" component="h2">
            Want to
          </Typography>
          <Typography variant="h1" component="h1">
            know more?
          </Typography>
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
          sx={{
            mt: theme.space.section.lg,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            columnGap: { md: theme.space.section.lg },
            rowGap: { xs: theme.space.section.md },
          }}
        >
          <Typography variant="body1">
            Water is limited and every choice has trade-offs. COEQWAL allows you
            to explore different water scenarios and understand how decisions
            shape potential futures for communities, farms, rivers, and the
            Delta.
          </Typography>

          <Box
            component="ul"
            sx={{
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: theme.space.gap.xl,
            }}
          >
            {VERBS.map(({ verb, rest }) => (
              <Box component="li" key={verb}>
                <Typography variant="body1">
                  <Box
                    component="span"
                    sx={{ fontWeight: "fontWeightSemiBold" }}
                  >
                    {verb}
                  </Box>{" "}
                  {rest}
                </Typography>
              </Box>
            ))}
          </Box>
        </MotionBox>
      </Box>
    </Box>
  )
}
