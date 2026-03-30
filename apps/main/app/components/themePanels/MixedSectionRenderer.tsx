// apps/main/components/theme-panel/MixedSectionRenderer.tsx

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

export function MixedSectionRenderer({ content }: { content: MixedSection }) {
  const muiTheme = useTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"))

  return (
    <Box
      component={motion.div}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
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
                  maxWidth: themeValues.spacing.paragraphMaxSize,
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
                  // Remove default list padding — the Panel component
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
                        maxWidth: themeValues.spacing.paragraphMaxSize,
                      }}
                      slotProps={{
                        primary: {
                          sx: {
                            // Match body1 for consistency — MUI ListItemText
                            // defaults to body2 which is visually inconsistent
                            // with surrounding paragraphs
                            ...muiTheme.typography.body1,
                            maxWidth: themeValues.spacing.paragraphMaxSize,
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
                  // Tighter margin on mobile — avoids competing with Panel padding
                  mx: isMobile ? 0 : "30px",
                  my: isMobile ? "16px" : "30px",
                  display: "flex",
                  alignItems: "center",
                  flexDirection: "column",
                }}
              >
                <Box
                  component={motion.img}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: false, amount: 0.3 }}
                  variants={fadeInRight}
                  src={block.src}
                  alt={block.alt}
                  sx={{
                    width: "100%",
                    // On desktop, cap image width so it doesn't stretch too wide
                    maxWidth: isMobile ? "100%" : "800px",
                    margin: "0 auto",
                    height: "auto",
                    display: "block",
                    borderRadius: muiTheme.borderRadius.md,
                  }}
                />
                {block.caption && (
                  <Typography
                    component="figcaption"
                    variant="caption"
                    sx={{
                      mt: 1,
                      color: muiTheme.palette.grey[600],
                      textAlign: "center",
                      // Match image width constraint
                      maxWidth: isMobile ? "100%" : "800px",
                    }}
                  >
                    {block.caption}
                  </Typography>
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
