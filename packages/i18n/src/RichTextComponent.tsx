/**
 * Centralized rich text component for use with next-intl's t.rich()
 * 
 * How to add a tag:
 * 1. Add it to richTextComponent below
 * 2. Use it in translation strings <tagname>text</tagname>
 * 3. Works everywhere t.rich() is called with this config
 */

import { Box, Typography } from "@mui/material"
import type { ReactNode } from "react"
import theme from "@repo/ui/themes/theme"

export const richTextComponent = {
    // <bold>text</bold>
    bold: (chunks: ReactNode) => (
        <Box
            component="span"
            sx={{ fontWeight: "fontWeightSemiBold", fontSize: "inherit", lineHeight: "inherit" }}
        >
            {chunks}
        </Box>
    ),
    // <italic>text</italic>
    // Renders as <span> by default (set in MuiTypography variantMapping)
    italic: (chunks: ReactNode) => (
        <Box
            component="span"
            sx={{
                // fontSize is intentionally omitted from accentItalic so it inherits
                ...theme.typography.accentItalic,
                fontSize: "inherit",
                lineHeight: "inherit",
            }}
        >
            {chunks}
        </Box>
    ),
    // <p>text</p> - paragraph with bottom margin
    p: (chunks: ReactNode) => (
        <Box
            component="p"
            sx={{ mb: 2, "&:last-child": { mb: 0 }, mt: 0, fontSize: "inherit", lineHeight: "inherit" }}
        >
            {chunks}
        </Box>
    ),
    // simple line break
    br: () => <br />,
} as const

export type RichTextComponent = typeof richTextComponent