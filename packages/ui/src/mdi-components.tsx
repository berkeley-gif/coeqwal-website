"use client"

/**
 * mdi-components - Centralized MDI component re-exports
 *
 * Single entry point for all MDI components used in the application.
 * Import from @repo/ui/mdi/js or @repo/ui/mdi/react instead of @mdi/js or @mdi/react directly.
 */

// Re-export MDI components so the package is the single MDI entry point
export {
    Icon
} from "@mdi/react"

// Import and re-export specific commonly used icons
import mdiWeatherPouring from "@mdi/js"
import mdiWeatherSunny from "@mdi/js"
import mdiWeatherSunnyAlert from "@mdi/js"

// Export individually imported icons
export {
    mdiWeatherPouring,
    mdiWeatherSunny,
    mdiWeatherSunnyAlert,
}