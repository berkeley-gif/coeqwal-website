// apps/main/components/theme-panel/MixedSectionRenderer.tsx

import {
  Typography,
  Box,
  OpacityIcon,
  useMediaQuery,
  useTheme,
} from "@repo/ui/mui"
import { motion } from "@repo/motion"
import { fadeInRight } from "../../lib/constants/motionAnimations"
import type { MixedSection } from "../../content/themes"
import { themeValues } from "@repo/ui/themes/theme"
import { LinedList } from "@repo/ui"

function parseBoldText(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
  )
}

// Plain strings get **bold** markdown parsing; JSX (e.g. containing an
// InlineNavLink or GlossaryTermLink) is rendered as-is.
function renderRichText(text: React.ReactNode): React.ReactNode {
  return typeof text === "string" ? parseBoldText(text) : text
}

// Reusable alongside parseBoldText, splits on \n and inserts a space between lines or paragraphs.
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
                {renderRichText(block.text)}
              </Typography>
            )
          case "list":
            return (
              <LinedList
                key={i}
                items={block.items.map((text) => ({
                  label: parseBoldText(text),
                }))}
                icon={
                  <OpacityIcon
                    sx={{
                      color: muiTheme.palette.blue.darkest,
                      fontSize: isMobile ? "1rem" : "1.25rem",
                    }}
                  />
                }
                labelVariant="body1"
                textMaxWidth={themeValues.spacing.paragraphMaxWidth.default}
              />
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
                  flexDirection: "column",
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
                    width: "100%",
                    height: "auto",
                    display: "block",
                  }}
                />
                {(block.title || block.caption) && (
                  <Box
                    component="figcaption"
                    sx={{
                      color: muiTheme.palette.text.primary,
                      pt: isMobile
                        ? muiTheme.space.listGap.md
                        : muiTheme.space.listGap.lg,
                      gap: muiTheme.space.listGap.sm,
                      textAlign: isMobile ? "center" : "left",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {block.title && (
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, color: "inherit" }}
                      >
                        {block.title}
                      </Typography>
                    )}
                    {block.caption &&
                      (typeof block.caption === "string"
                        ? parseCaptionBlocks(block.caption)
                        : block.caption)}
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
