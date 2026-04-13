// apps/main/i18n.config.ts
//
// Single source of truth for locale configuration.

export const locales = ["en", "es"] as const
export type Locale = (typeof locales)[number] // → "en" | "es"
export const defaultLocale: Locale = "en"