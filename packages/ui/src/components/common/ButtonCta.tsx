"use client"

/** Text CTA with an arrow */

import Link from "next/link"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import {
    NavArrow,
} from "@repo/ui"

export function ButtonCta({
    children,
    href,
}: {
    children: React.ReactNode
    href?: string
}) {
    const theme = useTheme()

    return (
        <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
            <Box
                sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    py: 1,
                    "&:hover .about-arrow": { transform: "translateX(4px)" },
                }}
            >
                <Typography
                    component="span"
                    sx={(theme) => ({
                        ...theme.typography.overline,
                        fontWeight: 600,
                        letterSpacing: "0.2em",
                        lineHeight: 1.2,
                        color: "inherit",
                    })}
                >
                    {children}
                </Typography>
                <NavArrow className="about-arrow" />
            </Box>
        </Link>
    )
}

export default ButtonCta