"use client"

import type { ReactNode } from "react"
import { Box, Stack, Typography } from "../../mui-components"
import type {
  BoxProps,
  SxProps,
  Theme,
  TypographyProps,
} from "../../mui-components"
import { Text } from "./Text"
import type { MarkClassNames, MarkSx, RichText, Source } from "./types"

export interface VisualizationProps extends Omit<BoxProps, "title"> {
  title: RichText
  caption?: RichText
  source?: Source
  children: ReactNode
  titleVariant?: TypographyProps["variant"]
  captionVariant?: TypographyProps["variant"]
  headerSx?: SxProps<Theme>
  headerWrapper?: (header: ReactNode) => ReactNode
  captionSx?: SxProps<Theme>
  markSx?: MarkSx
  markClassNames?: MarkClassNames
}

export function Visualization({
  title,
  caption,
  source,
  children,
  titleVariant = "h5",
  captionVariant = "caption",
  headerSx,
  headerWrapper,
  captionSx,
  markSx,
  markClassNames,
  ...boxProps
}: VisualizationProps) {
  const header = (
    <Box sx={headerSx}>
      <Typography variant={titleVariant} sx={{ textAlign: "left" }}>
        <Text value={title} markSx={markSx} markClassNames={markClassNames} />
      </Typography>
      {(caption || source) && (
        <Typography
          variant={captionVariant}
          sx={{ opacity: 0.7, textAlign: "left", ...captionSx }}
        >
          {caption && (
            <Text
              value={caption}
              markSx={markSx}
              markClassNames={markClassNames}
            />
          )}
          {caption && source ? " " : null}
          {source ? (
            <>
              {source.prefix ?? "Source: "}
              <Box
                component="a"
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: "inherit",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  fontWeight: "inherit",
                  lineHeight: "inherit",
                  textDecoration: "underline",
                }}
              >
                {source.label}
              </Box>
              {source.suffix}
            </>
          ) : null}
        </Typography>
      )}
    </Box>
  )

  return (
    <Box {...boxProps}>
      <Stack direction="column" spacing={1} alignItems="flex-start">
        {headerWrapper ? headerWrapper(header) : header}
        {children}
      </Stack>
    </Box>
  )
}
