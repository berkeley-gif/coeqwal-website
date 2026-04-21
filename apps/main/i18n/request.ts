// apps/main/i18n/request.ts
import { getRequestConfig } from "next-intl/server"
import { locales, defaultLocale, type Locale } from "../i18n.config"

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = locales.includes(requested as Locale)
    ? requested!
    : defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})