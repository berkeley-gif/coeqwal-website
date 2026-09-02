"use client"

/**
 * InlineNavLink
 *
 * Inline text that navigates elsewhere in the site — either to one of the
 * three main tabs (via navigateToTab, so the Tabs context state stays in
 * sync with the URL — a plain router.push to a tab route leaves that state
 * stale) or to a plain route like "/data". Use this instead of hand-rolling
 * a styled Typography-as-button each time copy needs an inline link.
 */

import { Typography } from "@repo/ui/mui"
import { useRouter } from "next/navigation"
import { useTabNavigation } from "../hooks/useTabNavigation"
import type { TabKey } from "../types/tabs"

const TAB_KEYS: readonly TabKey[] = ["learn", "explore", "share"]

function isTabKey(to: string): to is TabKey {
  return (TAB_KEYS as readonly string[]).includes(to)
}

interface InlineNavLinkProps {
  /** A TabKey ("learn" | "explore" | "share") or any other route, e.g. "/data" */
  to: TabKey | string
  children: string
}

export function InlineNavLink({ to, children }: InlineNavLinkProps) {
  const router = useRouter()
  const { navigateToTab } = useTabNavigation()

  const handleClick = () => {
    if (isTabKey(to)) {
      navigateToTab(to)
    } else {
      router.push(to)
    }
  }

  return (
    <Typography
      component="button"
      type="button"
      onClick={handleClick}
      sx={{
        background: "none",
        border: "none",
        color: "inherit",
        cursor: "pointer",
        padding: 0,
        font: "inherit",
        textDecoration: "underline",
      }}
    >
      {children}
    </Typography>
  )
}
