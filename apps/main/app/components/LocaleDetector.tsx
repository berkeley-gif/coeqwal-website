"use client"

/**  
 * LocaleDetector - Client-side locale detection for static export
*
* Middleware-based locale detection requires a server and cannot be used
* with output: "export". This component runs on the client after hydration
* and redirects to the user's preferred locale if it differs from the current one.
*
* Only runs once on first visit — if the user has manually switched locale,
* next-intl sets a NEXT_LOCALE cookie which takes precedence.
* */

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useLocale } from "next-intl"
import { locales } from "../../i18n.config"
import { switchLocale } from "../lib/switchLocale"

export function LocaleDetector() {
    const pathname = usePathname()
    const currentLocale = useLocale()

    useEffect(() => {
        const urlLocale = pathname?.split("/")[1]
        if (urlLocale && urlLocale !== "en") return
        // Check if user has already set a locale preference via the switcher.
        // next-intl sets NEXT_LOCALE cookie when user manually switches —
        // if it exists, respect their choice and don't override it.
        const hasLocaleCookie = document.cookie
            .split(";")
            .some((c) => c.trim().startsWith("NEXT_LOCALE="))

        if (hasLocaleCookie) return

        // Get browser's preferred language (e.g. "es-MX" → "es")
        const browserLocale = navigator.language.split("-")[0]
        if (!browserLocale) return

        // Only redirect if browser locale is supported and differs from current
        if (
            browserLocale !== currentLocale &&
            locales.includes(browserLocale as (typeof locales)[number])
        ) {
            // Replace locale segment in current path: /en/about → /es/about
            switchLocale(pathname, browserLocale)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Renders nothing — purely behavioral
    return null
}