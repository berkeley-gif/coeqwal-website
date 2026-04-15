"use client"

import {
  Box,
  Typography,
  useTheme,
  type SxProps,
  type Theme,
} from "@mui/material"

export interface BarredColumnItem {
  title: string
  description?: string
}

export interface BarredColumnsProps {
  items: BarredColumnItem[]
  /** Override the rule + text color. Defaults to current text color. */
  color?: string
  /** Typography variant for the title. Defaults to "body2". */
  titleVariant?: "subtitle1" | "body1" | "body2"
  /** Typography variant for the description. Defaults to "body2". */
  descriptionVariant?: "body1" | "body2"
  /** Gap between columns. Defaults to theme.space.section.sm. */
  columnGap?: string | number
  sx?: SxProps<Theme>
}

export function BarredColumns({
  items,
  color: colorProp,
  titleVariant = "body2",
  descriptionVariant = "body2",
  columnGap,
  sx,
}: BarredColumnsProps) {
  const theme = useTheme()
  const color = colorProp ?? theme.palette.text.primary
  const rule = `1px solid ${color}40`
  const gap = columnGap ?? theme.space.section.sm

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        columnGap: gap,
        color,
        ...((sx as object) ?? {}),
      }}
    >
      {items.map(({ title, description }) => (
        <Box
          key={title}
          sx={{
            borderTop: rule,
            borderBottom: rule,
            py: 2,
          }}
        >
          <Typography variant={titleVariant} sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {description && (
            <Typography
              variant={descriptionVariant}
              sx={{ mt: 0.5, opacity: 0.85 }}
            >
              {description}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  )
}

export default BarredColumns
