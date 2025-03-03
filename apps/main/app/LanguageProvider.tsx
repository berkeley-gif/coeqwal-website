"use client"

import React, { useEffect, useState } from "react"

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState("en")

  useEffect(() => {
    const browserLanguage = navigator.language.slice(0, 2) // Get the first two characters
    setLanguage(browserLanguage)
  }, [])

  return (
    <div data-language={language}>
      {children}
    </div>
  )
} 