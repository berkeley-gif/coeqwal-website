"use client"

import {
  Box,
  Typography,
  useTheme,
  type SxProps,
  type Theme,
} from "@mui/material"
import { NavArrow } from "./NavArrow"

export interface LinedListItem {
  label: string
  description?: string
  onClick?: () => void
  href?: string
  target?: string
  rel?: string
  /** Dim the row (0–1). Defaults to 1. */
  opacity?: number
}

export interface LinedListProps {
  items: LinedListItem[]
  /** Override the separator + arrow color. Defaults to current text color. */
  color?: string
  /** Show forward arrows on interactive rows. Defaults to true. */
  arrows?: boolean
  /** Typography variant for the label. Defaults to "subtitle1". */
  labelVariant?: "subtitle1" | "body1" | "body2"
  /** Typography variant for the optional description. Defaults to "body2". */
  descriptionVariant?: "body1" | "body2"
  sx?: SxProps<Theme>
}

function LinedListRow({
  item,
  color,
  arrows,
  labelVariant,
  descriptionVariant,
}: {
  item: LinedListItem
  color: string
  arrows: boolean
  labelVariant: LinedListProps["labelVariant"]
  descriptionVariant: LinedListProps["descriptionVariant"]
}) {
  const interactive = !!(item.onClick || item.href)

  return (
    <Box
      component={item.href ? "a" : "div"}
      {...(item.href ? { href: item.href } : {})}
      {...(item.target ? { target: item.target } : {})}
      {...(item.rel ? { rel: item.rel } : {})}
      onClick={item.onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        py: 2,
        borderBottom: `1px solid ${color}40`,
        cursor: interactive ? "pointer" : "default",
        textDecoration: "none",
        color: "inherit",
        opacity: item.opacity ?? 1,
        "&:last-child": { borderBottom: "none" },
        "&:hover .lined-list-arrow": { transform: "translateX(4px)" },
      }}
    >
      <Box>
        <Typography variant={labelVariant} sx={{ fontWeight: 600 }}>
          {item.label}
        </Typography>
        {item.description && (
          <Typography
            variant={descriptionVariant}
            sx={{ mt: 0.5, opacity: 0.85 }}
          >
            {item.description}
          </Typography>
        )}
      </Box>
      {arrows && interactive && (
        <NavArrow className="lined-list-arrow" opacity={0.6} bold={false} />
      )}
    </Box>
  )
}

export function LinedList({
  items,
  color: colorProp,
  arrows = true,
  labelVariant = "subtitle1",
  descriptionVariant = "body2",
  sx,
}: LinedListProps) {
  const theme = useTheme()
  const color = colorProp ?? theme.palette.text.primary

  return (
    <Box sx={{ color, ...((sx as object) ?? {}) }}>
      {items.map((item, i) => (
        <LinedListRow
          key={i}
          item={item}
          color={color}
          arrows={arrows}
          labelVariant={labelVariant}
          descriptionVariant={descriptionVariant}
        />
      ))}
    </Box>
  )
}

export default LinedList
