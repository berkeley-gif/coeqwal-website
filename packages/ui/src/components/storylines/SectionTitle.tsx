"use client"

import { Typography } from "../../mui-components"
import type { TypographyProps } from "../../mui-components"
import { Text } from "./Text"
import type { MarkClassNames, MarkSx, RichText } from "./types"

export interface SectionTitleProps extends Omit<TypographyProps, "children"> {
  text: RichText
  markSx?: MarkSx
  markClassNames?: MarkClassNames
}

export function SectionTitle({
  text,
  variant = "h3",
  markSx,
  markClassNames,
  ...typographyProps
}: SectionTitleProps) {
  return (
    <Typography variant={variant} {...typographyProps} gutterBottom>
      <Text value={text} markSx={markSx} markClassNames={markClassNames} />
    </Typography>
  )
}
