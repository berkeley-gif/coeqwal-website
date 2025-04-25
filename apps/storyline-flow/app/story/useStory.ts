import { useContext } from "react"
import StoryContext, { Storyline } from "../story/StoryContext"

const useStory = (): {
  storyline: Storyline | null
  activeSection: string
  setActiveSection: (section: string) => void
} => {
  const context = useContext(StoryContext)

  if (!context) {
    throw new Error("useStory must be used within a <StoryProvider>")
  }

  const { activeSection, setActiveSection, storyline } = context

  return { storyline, activeSection, setActiveSection }
}

export default useStory
