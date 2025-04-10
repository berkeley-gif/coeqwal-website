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
 * Client component for loading Adobe Fonts. Started with Adobe Fonts Typekit script, but it was causing hydration errors.
 * This avoids hydration errors by only running the font loading code on the client side
 *
 * @param kitId - The Adobe Fonts/Typekit project ID
 * @param timeout - Optional timeout in ms (default: 3000ms)
 */
export function FontLoader({ kitId, timeout = 3000 }: FontLoaderProps) {
  useEffect(() => {
    // Using a function that wraps the Typekit loading code
    const loadTypekit = () => {
      const config: TypekitConfig = {
        kitId,
        scriptTimeout: timeout,
        async: true,
      }

      // Get document element for class manipulation
      const docEl = document.documentElement

      // Add loading class
      docEl.className += " wf-loading"

      // Create promise-based timeout
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => {
          // Only reject if document doesn't have wf-active class
          if (!docEl.className.includes("wf-active")) {
            reject(new Error("Font loading timed out"))
          }
        }, timeout)
      })

      // Create script element
      const script = document.createElement("script")
      script.src = `https://use.typekit.net/${kitId}.js`
      script.async = true

      // Create a promise for script loading
      const scriptPromise = new Promise<void>((resolve, reject) => {
        script.onload = () => {
          try {
            // Safely access Typekit global
            const typekitWindow = window as unknown as {
              Typekit?: { load: (config: TypekitConfig) => void }
            }
            if (typekitWindow.Typekit) {
              typekitWindow.Typekit.load(config)
              resolve()
            } else {
              reject(new Error("Typekit not available after script loaded"))
            }
          } catch (e) {
            reject(e)
          }
        }

        script.onerror = () => {
          reject(new Error("Failed to load Typekit script"))
        }
      })

      // Add the script to the DOM
      const firstScript = document.getElementsByTagName("script")[0]
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript)
      } else {
        document.head.appendChild(script)
      }

      // Use Promise.race to handle timeout
      Promise.race([scriptPromise, timeoutPromise]).catch((error) => {
        console.warn("Adobe Fonts loading issue:", error)
        // Remove loading class and add inactive class on failure
        docEl.className =
          docEl.className.replace(/\bwf-loading\b/g, "") + " wf-inactive"

        // Use native Font Loading API as fallback
        if ("fonts" in document) {
          document.fonts.ready.then(() => {
            console.info("System fonts loaded as fallback")
          })
        }
      })
    }

    // Execute
    loadTypekit()

    // Cleanup
    return () => {
      // Could remove any custom classes if needed on unmount
    }
  }, [kitId, timeout]) // Only run when kitId or timeout changes

  // This component doesn't render anything
  return null
}
