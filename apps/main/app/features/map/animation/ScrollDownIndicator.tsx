"use client"

/**
 * ScrollDownIndicator - the bottom-edge fade + chevron shown when a sibling
 * scroll container has more content past the visible edge. Purely visual;
 * pairs with useScrollDownIndicator, which computes `visible`. Vertical
 * sibling of ScrollRightIndicator (scenarioExplorer/explorer/tools/chrome/
 * layout/).
 */

import { Box, KeyboardArrowDownIcon, useTheme } from "@repo/ui/mui"

interface ScrollDownIndicatorProps {
    visible: boolean
    fadeColor?: string
}

export default function ScrollDownIndicator({
    visible,
    fadeColor,
}: ScrollDownIndicatorProps) {
    const theme = useTheme()

    if (!visible) return null

    return (
        <Box
            sx={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 42,
                borderRadius: 2,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                pointerEvents: "none",
                background: `linear-gradient(to bottom, transparent, ${fadeColor ?? theme.palette.brand.sky
                    } 70%)`,
            }}
        >
            <KeyboardArrowDownIcon sx={{ fontSize: 22, color: theme.palette.common.white }} />
        </Box>
    )
}
