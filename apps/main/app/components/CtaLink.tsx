"use client"

/**
 * CtaLink - Text-style call-to-action link
 *
 * An uppercase, letter-spaced link with a trailing icon that slides on
 * hover. Reads as part of the page's typography rather than a boxed
 * button — used where a link should feel lighter-weight than a filled
 * Button component (e.g. "Learn more about COEQWAL", "View {document}").
 *
 * The icon is passed in by the caller (NavArrow for same-page navigation,
 * an "open in new tab" icon for links that open a document) so this
 * component only owns the shared text/spacing/hover styling.
 */

import React from "react"
import { Box, Typography } from "@repo/ui/mui"

interface CtaLinkProps {
    href: string
    children: React.ReactNode
    icon: React.ReactNode
    /** Anchor target, e.g. "_blank" to open in a new tab. */
    target?: string
    /** Anchor rel; pair with target="_blank" (e.g. "noopener noreferrer"). */
    rel?: string
}

export default function CtaLink({
    href,
    children,
    icon,
    target,
    rel,
}: CtaLinkProps) {
    return (
        <a
            href={href}
            target={target}
            rel={rel}
            style={{ textDecoration: "none", color: "inherit" }}
        >
            <Box
                sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    py: 1,
                    "&:hover .cta-link-icon": { transform: "translateX(4px)" },
                }}
            >
                <Typography
                    component="span"
                    sx={(theme) => ({
                        ...theme.typography.overline,
                        fontWeight: 600,
                        letterSpacing: "0.2em",
                        lineHeight: 1.6,
                        textDecoration: "underline",
                        color: "inherit",
                    })}
                >
                    {children}
                </Typography>
                <Box
                    className="cta-link-icon"
                    sx={{ display: "inline-flex", transition: "transform 0.15s ease" }}
                >
                    {icon}
                </Box>
            </Box>
        </a>
    )
}
