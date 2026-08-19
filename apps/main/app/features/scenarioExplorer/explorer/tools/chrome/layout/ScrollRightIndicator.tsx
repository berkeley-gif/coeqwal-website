"use client"

/**
 * ScrollRightIndicator - the right-edge fade + chevron shown when a sibling
 * scroll container has more content past the visible edge. Purely visual;
 * pairs with useScrollRightIndicator, which computes `visible`.
 */

import { Box, ChevronRightIcon, useTheme } from "@repo/ui/mui"

interface ScrollRightIndicatorProps {
    visible: boolean
    fadeColor?: string
}

export default function ScrollRightIndicator({
    visible,
    fadeColor,
}: ScrollRightIndicatorProps) {
    const theme = useTheme()

    if (!visible) return null

    return (
        <Box
            sx={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                width: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                pointerEvents: "none",
                background: `linear-gradient(to right, transparent, ${fadeColor ?? theme.palette.common.white
                    } 70%)`,
            }}
        >
            <ChevronRightIcon sx={{ fontSize: 18, color: theme.palette.grey[500] }} />
        </Box>
    )
}
