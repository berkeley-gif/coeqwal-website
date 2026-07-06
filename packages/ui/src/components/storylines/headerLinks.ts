"use client"

import type { NavDropdownOption } from "../navigation/NavDropdown"

const DEFAULT_MAIN_APP_URL =
  process.env.NEXT_PUBLIC_MAIN_APP_URL ?? "https://dev.coeqwal.org"

const STORYLINE_WATER_THEMES = [
  {
    id: "cws",
    label: "Community water systems",
    disabled: false,
  },
  {
    id: "ag_gw",
    label: "Farms and groundwater",
    disabled: false,
  },
  {
    id: "eco",
    label: "Rivers, salmon and the Delta ecosystem",
    disabled: false,
  },
  {
    id: "delta",
    label: "The Delta as a living place",
    disabled: false,
  },
  {
    id: "governance",
    label: "Water operations and impacts",
    disabled: true,
  },
] as const

function buildMainUrl(path = "", search = "") {
  return `${DEFAULT_MAIN_APP_URL}${path}${search}`
}

function goToUrl(url: string) {
  if (typeof window === "undefined") return
  window.location.href = url
}

export function getStorylineWaterThemesOptions(): NavDropdownOption[] {
  return STORYLINE_WATER_THEMES.map((theme) => ({
    key: theme.id,
    label: theme.label,
    disabled: theme.disabled,
    onClick: () => {
      goToUrl(buildMainUrl("/", `?theme=${theme.id}`))
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