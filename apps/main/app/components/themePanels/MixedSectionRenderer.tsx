// apps/main/components/theme-panel/MixedSectionRenderer.tsx

import { Fragment } from "react"
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  OpacityIcon,
  useMediaQuery,
  useTheme,
} from "@repo/ui/mui"
import { motion } from "@repo/motion"
import { fadeInRight } from "../../lib/constants/motionAnimations"
import type { MixedSection } from "../../content/themes"
import { themeValues } from "@repo/ui/themes/theme"

function parseBoldText(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
  )
}

// Reusable alongside parseBoldText — splits on \n and inserts a space between lines or paragraphs.
function parseCaptionBlocks(text: string): React.ReactNode {
  return text.split("\n").map((line, i) => (
    <Typography key={i} variant="caption" sx={{ color: "inherit" }}>
      {line}
    </Typography>
  ))
}

export function MixedSectionRenderer({ content }: { content: MixedSection }) {
  const muiTheme = useTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"))

  return (
    <Box
      component={motion.div}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.05 }}
      variants={fadeInRight}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: content.gap ?? "16px",
      }}
    >
      {content.blocks.map((block, i) => {
        switch (block.type) {
          case "paragraph":
            return (
              <Typography
                variant="body1"
                key={i}
                sx={{
                  maxWidth: themeValues.spacing.paragraphMaxWidth.default,
                }}
              >
                {parseBoldText(block.text)}
              </Typography>
            )
          case "list":
            return (
              <List
                key={i}
                sx={{
                  // Remove default list padding.the Panel component
                  // already owns horizontal spacing
                  px: 0,
                  // Tighter vertical padding on mobile
                  py: isMobile ? 0 : 1,
                }}
              >
                {block.items.map((item, j) => (
                  <ListItem
                    sx={{
                      // Reduce horizontal padding on mobile
                      px: isMobile ? 0 : 1,
                      alignItems: "flex-start",
                    }}
                    key={j}
                  >
                    <ListItemIcon
                      sx={{
                        color: muiTheme.palette.blue.darkest,
                        // Align icon with first line of text, not center of item
                        mt: "4px",
                        minWidth: isMobile ? "32px" : "40px",
                      }}
                    >
                      <OpacityIcon
                        sx={{ fontSize: isMobile ? "1rem" : "1.25rem" }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      sx={{
                        maxWidth: themeValues.spacing.paragraphMaxWidth.default,
                      }}
                      slotProps={{
                        primary: {
                          sx: {
                            maxWidth:
                              themeValues.spacing.paragraphMaxWidth.default,
                          },
                        },
                      }}
                      primary={parseBoldText(item)}
                    />
                  </ListItem>
                ))}
              </List>
            )
          case "image":
            return (
              <Box
                key={i}
                component="figure"
                sx={{
                  margin: 0,
                  boxShadow: muiTheme.shadow.lg,
                  borderRadius: muiTheme.borderRadius.md,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: isMobile ? "stretch" : "center",
                  mx: isMobile ? 0 : "30px",
                  my: isMobile ? "16px" : "30px",
                  padding: muiTheme.space.component.xl,
                  maxWidth: isMobile ? "100%" : "900px",
                }}
              >
                <Box
                  component={motion.img}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeInRight}
                  src={block.src}
                  alt={block.alt}
                  sx={{
                    // On desktop: take up roughly half the card.
                    // On mobile: full width of the card.
                    width: isMobile ? "100%" : block.caption ? "50%" : "100%",
                    flexShrink: 0,
                    height: "auto",
                    display: "block",
                  }}
                />
                {block.caption && (
                  <Box
                    component="figcaption"
                    sx={{
                      flexGrow: 1,
                      color: muiTheme.palette.text.primary,
                      p: isMobile
                        ? muiTheme.space.listGap.md
                        : muiTheme.space.listGap.lg,

                      // On desktop: left-align reads naturally beside the image.
                      // On mobile: center reads better as a label under a full-width image.
                      gap: muiTheme.space.listGap.sm,
                      textAlign: isMobile ? "center" : "left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column"
                    }}
                  >
                    {parseCaptionBlocks(block.caption)}
                  </Box>
                )}
              </Box>
            )
          default: {
            const _exhaustive: never = block
            return null
          }
        }
      })}
    </Box>
  )
}
