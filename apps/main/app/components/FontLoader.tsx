"use client"

import { useEffect } from "react"

interface FontLoaderProps {
  kitId: string
}

/**
 * Client component for loading Adobe Fonts
 * This avoids hydration errors by only running the font loading code on the client side
 */
export function FontLoader({ kitId }: FontLoaderProps) {
  useEffect(() => {
    // Load Adobe Fonts using Typekit script
    ;(function (d) {
      const config = {
        kitId,
        scriptTimeout: 3000,
        async: true,
      }

      const h = d.documentElement
      const t = setTimeout(() => {
        h.className =
          h.className.replace(/\bwf-loading\b/g, "") + " wf-inactive"
      }, config.scriptTimeout)

      const tk = d.createElement("script")
      let f = false
      const s = d.getElementsByTagName("script")[0] || null

      h.className += " wf-loading"
      tk.src = `https://use.typekit.net/${config.kitId}.js`
      tk.async = true

      // Use any type to handle non-standard properties
      ;(tk as any).onload = (tk as any).onreadystatechange = function () {
        const a = (this as any).readyState
        if (f || (a && a !== "complete" && a !== "loaded")) return
        f = true
        clearTimeout(t)
        try {
          // Typekit is added by the script
          ;(window as any).Typekit.load(config)
        } catch (e) {
          console.error("Error loading Adobe Fonts:", e)
        }
      }

      // Only insert if s exists and has a parent
      if (s && s.parentNode) {
        s.parentNode.insertBefore(tk, s)
      } else {
        // Fallback - append to head
        document.head.appendChild(tk)
      }
    })(document)
  }, [kitId]) // Only run when kitId changes

  // This component doesn't render anything
  return null
}
