"use client"

import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  type SxProps,
  useMediaQuery,
  type Theme,
} from "@repo/ui/mui"

export interface LinedListItem {
  label: string
  description?: string
  /** Dim the row (0-1). Defaults to 1. */
  opacity?: number
}

export interface LinedListProps {
  items: LinedListItem[]
  /** Text color. Defaults to current text color. */
  color?: string
  /** Optional leading icon rendered before each row's text. */
  icon?: React.ReactNode
  /** Typography variant for the label. Defaults to "subtitle1". */
  labelVariant?: "subtitle1" | "body1" | "body2"
  /** Typography variant for the optional description. Defaults to "body2". */
  descriptionVariant?: "body1" | "body2"
  /** Font weight for label text. Defaults to 600. */
  labelWeight?: number
  /** Optional max-width applied to each row's text (label + description). */
  textMaxWidth?: string | number
  sx?: SxProps<Theme>
}

export function LinedList({
  items,
  color: colorProp,
  icon,
  labelVariant = "subtitle1",
  descriptionVariant = "body2",
  textMaxWidth,
  labelWeight = 600,
  sx,
}: LinedListProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const color = colorProp ?? theme.palette.text.primary

  return (
    <List sx={{ color, px: 0, py: isMobile ? 0 : 1, ...((sx as object) ?? {}) }}>
      {items.map((item, i) => (
        <ListItem
          key={i}
          sx={{ px: isMobile ? 0 : 1, alignItems: "flex-start", opacity: item.opacity ?? 1 }}
        >
          {icon && (
            <ListItemIcon
              sx={{ color: "inherit", minWidth: isMobile ? "32px" : "40px", mr: 1.5, mt: "4px" }}
            >
              {icon}
            </ListItemIcon>
          )}
          <ListItemText
            sx={textMaxWidth ? { maxWidth: textMaxWidth } : undefined}
            primary={
              <Typography
                variant={labelVariant}
                sx={{ fontWeight: labelWeight, color: "inherit", ...(textMaxWidth ? { maxWidth: textMaxWidth } : {}), }}
              >
                {item.label}
              </Typography>
            }
            secondary={
              item.description ? (
                <Typography
                  variant={descriptionVariant}
                  sx={{ mt: 0.5, opacity: 0.85, color: "inherit" }}
                >
                  {item.description}
                </Typography>
              ) : undefined
            }
          />
        </ListItem>
      ))}
    </List>
  )
}

export default LinedList
