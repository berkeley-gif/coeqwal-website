"use client"

import type { NavDropdownOption } from "./NavDropdown"

const DEFAULT_MAIN_APP_URL =
  process.env.NEXT_PUBLIC_MAIN_APP_URL ?? "https://dev.coeqwal.org"

export type WaterStoryKey = "flow" | "climate" | "managed" | "equity"

export type WaterThemeKey = "cws" | "ag_gw" | "eco" | "delta"

type WaterStory = {
  key: WaterStoryKey
  label: string
  href: string
  hostnameMatchers: string[]
  disabled?: boolean
}

type WaterTheme = {
  key: WaterThemeKey
  label: string
}

type WaterStoryOptionsConfig = {
  labels?: Partial<Record<WaterStoryKey, string>>
  activeKey?: WaterStoryKey | null
}

type WaterThemeOptionsConfig = {
  activeKey?: string | null
  disabledKeys?: readonly string[]
  onThemeClick?: (themeKey: WaterThemeKey) => void
}

export const WATER_STORIES: WaterStory[] = [
  {
    key: "flow",
    label: "How water moves through California",
    href: "https://flow.coeqwal.org",
    hostnameMatchers: ["flow.coeqwal"],
  },
  {
    key: "climate",
    label: "How climate change affects California water",
    href: "https://climate.coeqwal.org",
    hostnameMatchers: ["climate.coeqwal"],
  },
  {
    key: "managed",
    label: "How water is managed in California",
    href: "https://management.coeqwal.org",
    hostnameMatchers: ["management.coeqwal"],
    disabled: true,
  },
  {
    key: "equity",
    label: "How equity shapes California water",
    href: "https://equity.coeqwal.org",
    hostnameMatchers: ["equity.coeqwal"],
  },
]

export const WATER_THEMES: WaterTheme[] = [
  {
    key: "cws",
    label: "Community water systems",
  },
  {
    key: "ag_gw",
    label: "Farms and groundwater",
  },
  {
    key: "eco",
    label: "Rivers and salmon",
  },
  {
    key: "delta",
    label: "The Delta as a living place",
  },
]

function buildMainUrl(path = "", search = "") {
  return `${DEFAULT_MAIN_APP_URL}${path}${search}`
}

function goToUrl(url: string) {
  if (typeof window === "undefined") return
  window.location.href = url
}

export function getActiveWaterStory(hostname: string): WaterStoryKey | null {
  return (
    WATER_STORIES.find((story) =>
      story.hostnameMatchers.some((matcher) => hostname.includes(matcher)),
    )?.key ?? null
  )
}

export function getWaterStoryOptions({
  labels,
  activeKey,
}: WaterStoryOptionsConfig = {}): NavDropdownOption[] {
  return WATER_STORIES.map((story) => ({
    key: story.key,
    label: labels?.[story.key] ?? story.label,
    active: activeKey === story.key,
    disabled: story.disabled,
    onClick: () => {
      if (story.disabled) return
      goToUrl(story.href)
    },
  }))
}

export function getWaterThemeOptions({
  activeKey,
  disabledKeys = [],
  onThemeClick,
}: WaterThemeOptionsConfig = {}): NavDropdownOption[] {
  return WATER_THEMES.map((theme) => ({
    key: theme.key,
    label: theme.label,
    active: activeKey === theme.key,
    disabled: disabledKeys.includes(theme.key),
    onClick: () => {
      if (onThemeClick) {
        onThemeClick(theme.key)
        return
      }

      goToUrl(buildMainUrl("/", `?theme=${theme.key}`))
    },
  }))
}

export function goToMainHome() {
  goToUrl(buildMainUrl("/"))
}

export function goToMainAbout() {
  goToUrl(buildMainUrl("/about"))
}

export function goToMainData() {
  goToUrl(buildMainUrl("/data"))
}
