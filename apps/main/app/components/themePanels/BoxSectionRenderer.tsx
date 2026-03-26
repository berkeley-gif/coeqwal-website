// apps/main/components/theme-panel/BoxSectionRenderer.tsx
import { Box, Typography, useTheme, useMediaQuery } from "@repo/ui/mui"
import { motion } from "@repo/motion"
import { fadeInRight } from "../../lib/constants/motionAnimations"
import type { BoxSection } from "../../content/themes"

export function BoxSectionRenderer({ content }: { content: BoxSection }) {
  const muiTheme = useTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"))

  return (
    <Box
      component="div"
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: muiTheme.borderRadius.md,
        gap: isMobile ? muiTheme.space.listGap.md : muiTheme.space.listGap.xl,
      }}
    >
      {/* Box for a single item */}
      {content.items.map((item, i) => (
        <Box
          key={i}
          component={motion.div}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.3 }}
          variants={fadeInRight}
          sx={{
            display: "flex",
            // Stack title above content on mobile 
            flexDirection: isMobile ? "column" : "row",
            boxShadow: muiTheme.shadow.lg,
            gap: isMobile
              ? muiTheme.space.listGap.sm
              : muiTheme.space.listGap.lg,
            padding: isMobile
              ? muiTheme.space.listGap.lg
              : muiTheme.space.listGap.xl,
            maxWidth: isMobile ? "100%" : "900px",
            borderRadius: muiTheme.borderRadius.md,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              textTransform: "capitalize",
              flexShrink: 0,
              // On desktop, pin the title to a fixed width so all boxes align.
              // On mobile, let it take full width above the paragraphs.
              width: isMobile ? "100%" : "220px",
            }}
          >
            {item.title}
          </Typography>
          <Box
            component="div"
            key={i}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: muiTheme.space.listGap.md,
              // Prevent long words from overflowing on narrow screens
              minWidth: 0,
            }}
          >
            {item.paragraphs.map((p, j) => (
              <Typography key={j} variant="body1">
                {p}
              </Typography>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  )
}
