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
  flow: "How water moves through California a longer description goes here",
  climate:
    "How climate change affects California water a longer description goes here",
  managed:
    "How water is managed in California a longer description goes here",
  equity:
    "How equity shapes California water a longer description goes here",
}

export const WATER_STORIES: Story[] = STORYLINE_LINKS.map((story) => ({
  id: story.key,
  label: story.label,
  description: STORY_DESCRIPTIONS[story.key] ?? "",
  href: story.href,
  dimmed: story.disabled ?? false,
}))
