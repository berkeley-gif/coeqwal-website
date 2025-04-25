"use client"

import { useEffect, useState, ReactNode } from "react"
import StoryContext from "./StoryContext"

const StoryProvider = ({ children }: { children: ReactNode }) => {
  const [storyline, setStory] = useState(null)
  const [activeSection, setActiveSection] = useState<string>("opener")

  useEffect(() => {
    async function fetchStoryData() {
      try {
        const response = await fetch("/locales/english.json")

        if (!response.ok) {
          throw new Error("Failed to fetch story data")
        }

        const data = await response.json()
        setStory(data)
      } catch (err) {
        console.error("Error loading story data:", err)
      }
    }

    fetchStoryData()
  }, [])

  return (
    <StoryContext.Provider
      value={{ storyline, activeSection, setActiveSection }}
    >
      {children}
    </StoryContext.Provider>
  )
}

export default StoryProvider
