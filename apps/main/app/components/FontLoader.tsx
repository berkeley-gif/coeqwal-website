"use client"

import { useEffect } from "react"

interface FontLoaderProps {
  kitId: string
  timeout?: number
}

// Define interfaces for the non-standard properties
interface TypekitConfig {
  kitId: string
  scriptTimeout: number
  async: boolean
}

/**
 * Client component for loading Adobe Fonts
 * This implementation avoids hydration errors by loading the fonts on the client side
 */
export function FontLoader({ kitId, timeout = 3000 }: FontLoaderProps) {
  useEffect(() => {
    const loadTypekit = () => {
      const config: TypekitConfig = {
        kitId,
        scriptTimeout: timeout,
        async: true,
      }

      const docEl = document.documentElement
      docEl.className += " wf-loading tk-akzidenz-grotesk-next-pro"

      const script = document.createElement("script")
      script.src = `https://use.typekit.net/${kitId}.js`
      script.async = true

      script.onload = () => {
        try {
          const typekitWindow = window as unknown as {
            Typekit?: { load: (config: TypekitConfig) => void }
          }
          if (typekitWindow.Typekit) {
            typekitWindow.Typekit.load(config)
          }
        } catch (e) {
          // Silently fail and let fallback fonts work
        }
      }

      const firstScript = document.getElementsByTagName("script")[0]
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript)
      } else {
        document.head.appendChild(script)
      }
    }

    loadTypekit()
  }, [kitId, timeout])

  return null
}
