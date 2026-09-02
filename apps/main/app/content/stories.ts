import { WATER_STORIES as STORYLINE_LINKS } from "@repo/ui"

// =============================================================================
// Story type
// =============================================================================

export interface Story {
  /** Stable identifier (e.g. "delta") */
  id: string
  /** Display label, may contain \n for line-breaks in circle layouts */
  label: string
  /** One-sentence description of what this theme covers */
  description: string
  /** Link */
  href: string
  /** Whether it's dimmed */
  dimmed: boolean
}

// Longer descriptions for the Learn-tab cards — the only thing this page
// needs beyond what @repo/ui's WATER_STORIES already has. Keyed by the
// same story key, so id/label/href/dimmed all come from one source and
// can't drift from the header/footer nav.
const STORY_DESCRIPTIONS: Record<string, string> = {
  flow: "Learn how the paths that water takes through California has been transformed by our water system",
  climate:
    "Learn how California’s water system can adapt to a changing climate",
  managed:
    "Learn how California’s water is managed for communities, agriculture, and the environment",
  equity:
    "Learn how COEQWAL helps to guide us toward a more equitable water future ",
}

export const WATER_STORIES: Story[] = STORYLINE_LINKS.map((story) => ({
  id: story.key,
  label: story.label,
  description: STORY_DESCRIPTIONS[story.key] ?? "",
  href: story.href,
  dimmed: story.disabled ?? false,
}))
