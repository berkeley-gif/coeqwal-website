"use client"

import { useEffect } from "react"

interface FontLoaderProps {
  kitId: string
}

// Define interfaces for the non-standard properties
interface TypekitConfig {
  kitId: string
  scriptTimeout: number
  async: boolean
}

/**
 * Client component for loading Adobe Fonts
 * This avoids hydration errors by only running the font loading code on the client side
 */
export function FontLoader({ kitId }: FontLoaderProps) {
  useEffect(() => {
    // Using a function that wraps the Typekit loading code
    const loadTypekit = () => {
      const config: TypekitConfig = {
        kitId,
        scriptTimeout: 3000,
        async: true,
      }

      // Get document element for class manipulation
      const docEl = document.documentElement

      // Create timeout that sets inactive class if load fails
      const timeout = setTimeout(() => {
        docEl.className =
          docEl.className.replace(/\bwf-loading\b/g, "") + " wf-inactive"
      }, config.scriptTimeout)

      // Add loading class
      docEl.className += " wf-loading"

      // Create script element
      const script = document.createElement("script")
      script.src = `https://use.typekit.net/${config.kitId}.js`
      script.async = true

      let loaded = false

      // Handle the script load event
      script.onload = () => {
        if (loaded) return
        loaded = true
        clearTimeout(timeout)

        try {
          // Safely access Typekit global
          const typekitWindow = window as unknown as {
            Typekit?: { load: (config: TypekitConfig) => void }
          }
          if (typekitWindow.Typekit) {
            typekitWindow.Typekit.load(config)
          }
        } catch (e) {
          console.error("Error loading Adobe Fonts:", e)
        }
      }

      // Find first script element to insert before
      const firstScript = document.getElementsByTagName("script")[0]

      // Insert the script element
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript)
      } else {
        // Fallback - append to head
        document.head.appendChild(script)
      }
    }

    // Execute the function
    loadTypekit()
  }, [kitId]) // Only run when kitId changes

  // This component doesn't render anything
  return null
}
