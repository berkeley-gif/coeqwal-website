// apps/main/i18n/request.ts
//

import { getRequestConfig } from "next-intl/server"
import { locales, defaultLocale, type Locale } from "../i18n.config"

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  // Guard: fall back to default if locale is missing or invalid.
  // During static export, this value comes from generateStaticParams
  // in layout.tsx - but we still guard defensively.
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})