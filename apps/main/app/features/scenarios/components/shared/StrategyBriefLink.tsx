"use client"

/**
 * StrategyBriefLink - "Read the strategy brief" link under a strategy description
 *
 * Opens the same strategy-brief page the About page's "COEQWAL scenario
 * library" dropdown links to, so users can reach the long-form documentation
 * from the explorer without hunting for it on another page.
 *
 * Renders nothing when a scenario has no brief, so callers don't need to
 * check first.
 */

// External
import React from "react"
import { icons } from "@repo/ui/mui"

// Internal
import CtaLink from "../../../../components/CtaLink"
import {
  getStrategyDocumentByScenarioId,
  getStrategyDocumentUrl,
} from "../../../../content/waterManagementStrategies"

const { OpenInNew: OpenInNewIcon } = icons

interface StrategyBriefLinkProps {
  /** Sibling-group scenario id (e.g. "s0020"), the key briefs are mapped by */
  scenarioId: string
  /** Strategy name, used to give each link a unique accessible name */
  strategyLabel: string
}

export function StrategyBriefLink({
  scenarioId,
  strategyLabel,
}: StrategyBriefLinkProps) {
  const briefDocument = getStrategyDocumentByScenarioId(scenarioId)

  // Unhappy path first: a scenario added to the API before its brief is
  // written shows no link, rather than a link to a 404.
  if (!briefDocument) return null

  return (
    <CtaLink
      variant="inline"
      href={getStrategyDocumentUrl(briefDocument.file)}
      target="_blank"
      rel="noopener noreferrer"
      icon={<OpenInNewIcon />}
      // Every row's visible text is identical, so a screen reader's link list
      // would read "Read the strategy brief" 28 times. Naming the strategy
      // (and the new tab) makes each link distinguishable.
      ariaLabel={`${strategyLabel} strategy brief (opens in a new tab)`}
      // Some explorer rows select the scenario on click; stop the event so
      // opening the brief doesn't also toggle selection.
      onClick={(e) => e.stopPropagation()}
    >
      Read the strategy brief
    </CtaLink>
  )
}
