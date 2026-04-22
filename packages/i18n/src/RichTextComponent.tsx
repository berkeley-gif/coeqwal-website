/**
 * Centralized rich text component for use with next-intl's t.rich()
 * 
 * How to add a tag:
 * 1. Add it to richTextComponent below
 * 2. Use it in translation strings <tagname>text</tagname>
 * 3. Works everywhere t.rich() is called with this config
 */

import { Typography, Box } from "@mui/material"
import type { ReactNode } from "react"

export const richTextComponent = {
    // <bold>text</bold>
    bold: (chunks: ReactNode) => (
        <Typography component="span" sx={{ fontWeight: "fontWeightSemiBold" }}>
            {chunks}
        </Typography>
    ),
    // <italic>text</italic>
    // Renders as <span> by default (set in MuiTypography variantMapping)
    italic: (chunks: ReactNode) => (
        <Typography component="span"
            variant={"accentItalic" as any}>
            {chunks}
        </Typography>
    ),
    // <p>text</p> - paragraph with bottom margin
    p: (chunks: ReactNode) => (
        <Typography
            component="p"
        >
            {chunks}
        </Typography>
    ),
}