// apps/main/i18n/routing.ts
import { defineRouting } from "next-intl/routing"
import { locales, defaultLocale } from "../i18n.config"

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always",
  localeDetection: true,
})