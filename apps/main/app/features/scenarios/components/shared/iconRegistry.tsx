/**
 * Operations icon registry and scenario-to-icon mapping
 *
 * This module provides:
 * - `ICON_REGISTRY`: all icon definitions, mapping each id to its rendering config and tooltip metadata
 * - `SCENARIO_ICONS`: maps a scenario id to an ordered array of icon ids
 * - `getScenarioIconDefs()`: resolves the icon definitions for a scenario
 * - `getScenariosWithIcon()`: finds the scenarios that include a given icon
 * - `renderIconDef()`: renders an icon definition as a React element
 *
 * The circle-with-text rendering lives in the `OpsCircleIcon` component.
 */

import React from "react"
import { themeValues } from "@repo/ui/themes/theme"
import { OpsCircleIcon } from "./OpsCircleIcon"

const white = themeValues.palette.common.white

// ============================================================================
// Types
// ============================================================================

interface BaseIconDef {
  /** Unique icon identifier */
  id: string
  /** Tooltip header label */
  label: string
  /** Tooltip body description */
  description: string
}

interface SvgFileIconDef extends BaseIconDef {
  type: "svg-file"
  /** Path to SVG file in /public */
  path: string
}

interface CircleIconDef extends BaseIconDef {
  type: "circle" | "circle-strikethrough"
  /** Text lines to render inside the circle */
  lines: string[]
  /** Fill color for the circle */
  color: string
  /** Optional font size override (auto-calculated if omitted) */
  fontSize?: number
  /** Optional font weight override (default: 600) */
  fontWeight?: number
  /** Optional custom SVG children (e.g., salmon silhouette) */
  customSvg?: React.ReactNode
}

export type IconDef = SvgFileIconDef | CircleIconDef

// ============================================================================
// Salmon Silhouette SVG (needs redo, to look more like Chinook)
// ============================================================================

const SalmonSilhouette = (
  <g transform="translate(25, 78) scale(0.58)">
    <path
      d="M5,25 C5,25 15,10 35,10 C50,10 60,15 75,15 C85,15 95,12 110,5
         C105,15 100,20 95,22 C100,24 105,28 115,30
         C105,32 95,33 85,30 C75,35 60,38 45,35 C30,35 15,32 5,25Z"
      fill={white}
      opacity="0.85"
    />
    <circle cx="30" cy="22" r="3" fill={`rgba(0,0,0,0.3)`} />
  </g>
)

// ============================================================================
// Baseline Gear + Water Drop SVG (inlined from current_ops.svg)
// ============================================================================

const BaselineGearSvg = (
  <g>
    <path
      fill={white}
      d="M60.9,40.29l.5,1.93c1.45,4.12,3.62,7.95,5.95,11.62,3.44,5.42,7.8,9.47,5.86,16.57-3.2,11.7-19.75,12.58-24.13,1.32-3.15-8.09,2.52-13.1,6.36-19.38.75-1.23,1.49-2.49,2.17-3.75,1.39-2.6,2.74-5.41,3.29-8.31ZM55.68,58.86c.14-.19.3-.3.63-.66.35-.37-.53-.07-.67,0-5.14,2.41-6.12,10.33-2.9,14.66.47.64,1.8,2.03,3.52,2.78.14.06.19-.07.05-.24-.31-.36-.75-.84-1.03-1.26-3.32-4.74-3.15-10.71.4-15.28Z"
    />
    <path
      fill={white}
      d="M107.39,49.23h-9.42c-.79-2.68-1.85-5.26-3.18-7.69l6.65-6.66c.92-.92.92-2.41,0-3.32l-12.3-12.3c-.92-.92-2.41-.92-3.32,0l-6.65,6.66c-2.44-1.32-5.01-2.39-7.69-3.18v-9.41c0-1.29-1.06-2.35-2.35-2.35h-17.4c-1.29,0-2.35,1.06-2.35,2.35v9.41c-2.68.79-5.26,1.85-7.69,3.18l-6.65-6.66c-.92-.92-2.41-.92-3.32,0l-12.3,12.3c-.92.92-.92,2.41,0,3.32l6.65,6.66c-1.32,2.44-2.39,5.01-3.18,7.69h-9.41c-1.29,0-2.35,1.06-2.35,2.35v17.4c0,1.29,1.06,2.35,2.35,2.35h9.41c.79,2.68,1.85,5.26,3.18,7.69l-6.65,6.66c-.92.92-.92,2.41,0,3.32l12.3,12.3c.92.92,2.41.92,3.32,0l6.65-6.66c2.44,1.32,5.01,2.39,7.69,3.18v9.41c0,1.29,1.05,2.35,2.34,2.35h17.4c1.29,0,2.35-1.06,2.35-2.35v-9.41c2.68-.79,5.26-1.85,7.69-3.18l6.66,6.65c.92.92,2.41.92,3.32,0l12.3-12.3c.92-.92.92-2.41,0-3.32l-6.66-6.65c1.32-2.44,2.39-5.01,3.18-7.69h9.41c1.29,0,2.35-1.05,2.35-2.34v-17.4c0-1.29-1.06-2.35-2.35-2.35ZM60.43,91.94c-17.47,0-31.67-14.2-31.67-31.67s14.22-31.67,31.67-31.67,31.67,14.2,31.67,31.67-14.2,31.67-31.67,31.67Z"
    />
  </g>
)

// ============================================================================
// Icon Registry
// ============================================================================

/** Standard operations icon color (blue) */
const OPS_BLUE = "#2d89b7"

/** Unified theme icon color (distinct from operations blue) */
const THEME_COLOR = "#845284"

export const ICON_REGISTRY: Record<string, IconDef> = {
  // ── Theme icons

  theme_baseline: {
    id: "theme_baseline",
    type: "circle",
    lines: [],
    color: THEME_COLOR,
    customSvg: BaselineGearSvg,
    label: "Current operations",
    description:
      "Represents how California manages water today, including the laws, regulations, priorities, and decisions that affect how California's water supply is allocated.",
  },
  theme_ag_gw: {
    id: "theme_ag_gw",
    type: "circle",
    lines: ["Farms"],
    color: THEME_COLOR,
    label: "Farms, groundwater & food systems",
    description:
      "Scenario exploring groundwater management changes, such as SGMA pumping limits.",
  },
  theme_eco: {
    id: "theme_eco",
    type: "circle",
    lines: ["Rivers"],
    color: THEME_COLOR,
    label: "Rivers, salmon & ecosystems",
    description:
      "Scenario exploring changes to environmental or functional flow requirements.",
  },
  theme_cws: {
    id: "theme_cws",
    type: "circle",
    lines: ["CWS"],
    color: THEME_COLOR,
    label: "Community water systems",
    description:
      "Scenario exploring changes to community water system deliveries and allocations.",
  },
  theme_delta: {
    id: "theme_delta",
    type: "circle",
    lines: ["Delta"],
    color: THEME_COLOR,
    label: "The Delta as a living place",
    description:
      "Scenario exploring changes to Delta operations, conveyance, or export rules.",
  },

  // ── Existing SVG file icons ──────────────────────────────────────────────

  tucp: {
    id: "tucp",
    type: "svg-file",
    path: "/images/icons/tucp.svg",
    label: "TUCPs allowed",
    description:
      "Temporary Urgent Change Petitions (TUCPs, also known as TUCOs) permit changes during droughts to meet human health and safety needs and protect endangered species.",
  },
  no_tucp: {
    id: "no_tucp",
    type: "svg-file",
    path: "/images/icons/no_tucp.svg",
    label: "TUCPs not allowed",
    description:
      "Operations without Temporary Urgent Change Petitions (TUCPs).",
  },
  land_use_2020: {
    id: "land_use_2020",
    type: "svg-file",
    path: "/images/icons/land_use.svg",
    label: "2020 LandIQ land use",
    description: "Current agricultural land use data from 2020 LandIQ survey.",
  },
  land_use_2004: {
    id: "land_use_2004",
    type: "svg-file",
    path: "/images/icons/land_use_prev.svg",
    label: "Historical land use (2004-2013)",
    description:
      "Historical agricultural land use based on 2004-2013 survey data.",
  },

  // ── New circle icons.BiOps ─────────────────────────────────────────────

  biops_2019: {
    id: "biops_2019",
    type: "circle",
    lines: ["BiOps", "2019/", "2020"],
    color: OPS_BLUE,
    label: "BiOps 2019/2020",
    description:
      "Federal biological opinions from 2019/2020 governing Delta operations for endangered species protection.",
  },
  biops_2019_mod: {
    id: "biops_2019_mod",
    type: "circle",
    lines: ["BiOps", "19/20", "mod"],
    color: OPS_BLUE,
    label: "BiOps 2019/2020 modified",
    description:
      "Modified version of the 2019/2020 federal biological opinions.",
  },
  biops_2024_pa: {
    id: "biops_2024_pa",
    type: "circle",
    lines: ["BiOps", "USBR", "2024 PA"],
    color: OPS_BLUE,
    label: "BiOps USBR 2024 PA",
    description:
      "USBR 2024 Proposed Action biological opinion for Delta operations.",
  },

  // ── New circle icons.USBR / DWR ───────────────────────────────────────

  usbr_alt2v1: {
    id: "usbr_alt2v1",
    type: "circle",
    lines: ["USBR", "Alt2 V1"],
    color: OPS_BLUE,
    label: "USBR Alt2 V1",
    description:
      "USBR Alternative 2 Version 1 operational framework for coordinated CVP/SWP operations.",
  },
  usbr_alt3: {
    id: "usbr_alt3",
    type: "circle",
    lines: ["USBR", "Alt 3"],
    color: OPS_BLUE,
    label: "USBR Alt 3",
    description:
      "USBR Alternative 3 operational framework for coordinated CVP/SWP operations.",
  },
  dwr_adapt_2025: {
    id: "dwr_adapt_2025",
    type: "circle",
    lines: ["DWR", "Adapt", "2025"],
    color: OPS_BLUE,
    label: "DWR Adapt 2025",
    description:
      "DWR 2025 Adaptation strategy for State Water Project operations.",
  },

  // ── New circle icons.Delta / exports ───────────────────────────────────

  limit_delta_exports: {
    id: "limit_delta_exports",
    type: "circle",
    lines: ["Limit", "Delta", "exports"],
    color: OPS_BLUE,
    label: "Limit Delta exports",
    description:
      "Limits on water exports from the Sacramento-San Joaquin Delta.",
  },
  tunnel: {
    id: "tunnel",
    type: "circle",
    lines: ["Tunnel"],
    color: OPS_BLUE,
    label: "Delta Tunnel",
    description: "Delta conveyance tunnel infrastructure for water transport.",
  },

  // ── New circle icons.Unimpaired flow ───────────────────────────────────

  unimpaired_35: {
    id: "unimpaired_35",
    type: "circle",
    lines: ["35%", "unimp."],
    color: OPS_BLUE,
    label: "35% unimpaired flow",
    description: "35% of unimpaired flow dedicated to environmental purposes.",
  },
  unimpaired_45: {
    id: "unimpaired_45",
    type: "circle",
    lines: ["45%", "unimp."],
    color: OPS_BLUE,
    label: "45% unimpaired flow",
    description: "45% of unimpaired flow dedicated to environmental purposes.",
  },
  unimpaired_55: {
    id: "unimpaired_55",
    type: "circle",
    lines: ["55%", "unimp."],
    color: OPS_BLUE,
    label: "55% unimpaired flow",
    description: "55% of unimpaired flow dedicated to environmental purposes.",
  },
  unimpaired_65: {
    id: "unimpaired_65",
    type: "circle",
    lines: ["65%", "unimp."],
    color: OPS_BLUE,
    label: "65% unimpaired flow",
    description: "65% of unimpaired flow dedicated to environmental purposes.",
  },

  // ── New circle icons.Functional flows ──────────────────────────────────

  functional_flows: {
    id: "functional_flows",
    type: "circle",
    lines: ["Func.", "flows"],
    color: OPS_BLUE,
    label: "Functional flows",
    description:
      "Environmental flow requirements on tributaries and Delta designed to support ecosystem function.",
  },
  functional_flows_salmon: {
    id: "functional_flows_salmon",
    type: "circle",
    lines: ["Func.", "flows"],
    color: OPS_BLUE,
    label: "Functional flows (salmon)",
    description:
      "Functional flow requirements with specific salmon lifecycle considerations.",
    customSvg: SalmonSilhouette,
  },

  // ── New circle icons.Crossed out (strikethrough) ───────────────────────

  no_flow_req: {
    id: "no_flow_req",
    type: "circle-strikethrough",
    lines: ["Flow", "Req"],
    color: OPS_BLUE,
    label: "No flow requirements",
    description: "Flow requirements have been removed in this scenario.",
  },
  no_x2_flow: {
    id: "no_x2_flow",
    type: "circle-strikethrough",
    lines: ["X2 +", "Flow"],
    color: OPS_BLUE,
    label: "No X2 + Flow requirements",
    description:
      "X2 salinity standard and associated flow requirements have been removed.",
  },
  no_delta_flow: {
    id: "no_delta_flow",
    type: "circle-strikethrough",
    lines: ["Delta", "flow"],
    color: OPS_BLUE,
    label: "No Delta flow requirements",
    description:
      "Delta outflow requirements have been removed in this scenario.",
  },

  // ── New circle icons.Pumping limits ────────────────────────────────────

  limit_sj_pumping: {
    id: "limit_sj_pumping",
    type: "circle",
    lines: ["Limit", "SJ", "pump."],
    color: OPS_BLUE,
    label: "Limit SJ pumping",
    description:
      "SGMA groundwater pumping limits applied to the San Joaquin Valley region.",
  },
  limit_cv_pumping: {
    id: "limit_cv_pumping",
    type: "circle",
    lines: ["Limit", "CV", "pump."],
    color: OPS_BLUE,
    label: "Limit CV pumping",
    description:
      "SGMA groundwater pumping limits applied across the entire Central Valley.",
  },

  // ── New circle icons.Reduced ag acreage ──────────────────────────────

  reduced_sj_ag: {
    id: "reduced_sj_ag",
    type: "circle",
    lines: ["Reduce", "SJ ag"],
    color: OPS_BLUE,
    label: "Reduced SJ agricultural acreage",
    description:
      "Reduced agricultural acreage in the San Joaquin Valley to improve groundwater sustainability under SGMA.",
  },
  reduced_cv_ag: {
    id: "reduced_cv_ag",
    type: "circle",
    lines: ["Reduce", "CV ag"],
    color: OPS_BLUE,
    label: "Reduced CV agricultural acreage",
    description:
      "Reduced agricultural acreage across the entire Central Valley to improve groundwater sustainability under SGMA.",
  },

  // ── New circle icons.Shasta / Reservoir ──────────────────────────────

  shasta_carryover: {
    id: "shasta_carryover",
    type: "circle",
    lines: ["Shasta", "+20%"],
    color: OPS_BLUE,
    label: "Shasta carryover +20%",
    description:
      "Increase Shasta Reservoir carryover storage target by 20%, with CVP Settlement Contractor allocations reduced as needed.",
  },

  // ── New circle icons.CWS allocation priorities ─────────────────────────

  cws_hhs: {
    id: "cws_hhs",
    type: "circle",
    lines: ["M&I", "HHS"],
    color: OPS_BLUE,
    label: "M&I HHS priority",
    description:
      "CVP and SWP surface supplies prioritized for M&I contractors at health and human safety delivery levels.",
  },
  cws_func: {
    id: "cws_func",
    type: "circle",
    lines: ["M&I", "Func."],
    color: OPS_BLUE,
    label: "M&I functional priority",
    description:
      "CVP and SWP surface supplies prioritized for M&I contractors at functional delivery levels (70% of contract).",
  },
  cws_full: {
    id: "cws_full",
    type: "circle",
    lines: ["M&I", "Full"],
    color: OPS_BLUE,
    label: "M&I full contract priority",
    description:
      "CVP and SWP surface supplies prioritized for M&I contractors at full contract entitlement levels.",
  },
}

// ============================================================================
// Scenario-to-Icons Mapping
// ============================================================================

/**
 * Maps scenario IDs to their ordered list of operation icon IDs.
 * The first icon is always the theme icon.
 */
export const SCENARIO_ICONS: Record<string, string[]> = {
  s0002: ["theme_baseline", "no_tucp", "land_use_2004", "biops_2019"],
  s0010: ["theme_delta", "tunnel", "no_tucp", "land_use_2004", "biops_2019"],
  s0011: ["theme_baseline", "tucp", "land_use_2004", "biops_2019"],
  s0020: ["theme_baseline", "tucp", "land_use_2020", "biops_2019"],
  s0021: ["theme_baseline", "no_tucp", "land_use_2020", "biops_2019"],
  s0022: [
    "theme_baseline",
    "usbr_alt2v1",
    "no_tucp",
    "land_use_2004",
    "biops_2024_pa",
  ],
  s0023: [
    "theme_baseline",
    "usbr_alt2v1",
    "no_tucp",
    "land_use_2020",
    "biops_2024_pa",
  ],
  s0024: [
    "theme_baseline",
    "usbr_alt2v1",
    "tucp",
    "land_use_2020",
    "biops_2024_pa",
  ],
  s0025: [
    "theme_ag_gw",
    "limit_sj_pumping",
    "tucp",
    "land_use_2020",
    "biops_2019",
  ],
  s0027: [
    "theme_ag_gw",
    "limit_cv_pumping",
    "tucp",
    "land_use_2020",
    "biops_2019",
  ],
  s0029: [
    "theme_eco",
    "functional_flows",
    "tucp",
    "land_use_2020",
    "biops_2019",
  ],
  s0026: [
    "theme_ag_gw",
    "reduced_sj_ag",
    "tucp",
    "land_use_2020",
    "biops_2019",
  ],
  s0028: [
    "theme_ag_gw",
    "reduced_cv_ag",
    "tucp",
    "land_use_2020",
    "biops_2019",
  ],
  s0031: [
    "theme_eco",
    "functional_flows_salmon",
    "tucp",
    "land_use_2020",
    "biops_2019",
  ],
  s0032: [
    "theme_eco",
    "functional_flows",
    "reduced_cv_ag",
    "tucp",
    "land_use_2020",
    "biops_2019",
  ],
  s0033: [
    "theme_eco",
    "functional_flows_salmon",
    "reduced_cv_ag",
    "tucp",
    "land_use_2020",
    "biops_2019",
  ],
  s0046: [
    "theme_eco",
    "functional_flows",
    "no_delta_flow",
    "tucp",
    "land_use_2020",
    "biops_2019_mod",
  ],
  s0065: [
    "theme_delta",
    "dwr_adapt_2025",
    "tunnel",
    "tucp",
    "land_use_2020",
    "biops_2019_mod",
  ],
  s0030: ["theme_eco", "no_flow_req", "tucp", "land_use_2020", "biops_2019"],
  s0035: ["theme_cws", "cws_hhs", "tucp", "land_use_2020", "biops_2019"],
  s0036: ["theme_cws", "cws_func", "tucp", "land_use_2020", "biops_2019"],
  s0037: ["theme_cws", "cws_full", "tucp", "land_use_2020", "biops_2019"],
  s0039: [
    "theme_delta",
    "usbr_alt3",
    "unimpaired_65",
    "limit_delta_exports",
    "tucp",
    "land_use_2020",
    "biops_2019_mod",
  ],
  s0040: [
    "theme_delta",
    "usbr_alt3",
    "unimpaired_35",
    "limit_delta_exports",
    "tucp",
    "land_use_2020",
    "biops_2019_mod",
  ],
  s0041: [
    "theme_delta",
    "usbr_alt3",
    "unimpaired_45",
    "limit_delta_exports",
    "tucp",
    "land_use_2020",
    "biops_2019_mod",
  ],
  s0042: [
    "theme_delta",
    "usbr_alt3",
    "unimpaired_55",
    "limit_delta_exports",
    "tucp",
    "land_use_2020",
    "biops_2019_mod",
  ],
  s0044: [
    "theme_delta",
    "shasta_carryover",
    "tucp",
    "land_use_2020",
    "biops_2019_mod",
  ],
  s0045: [
    "theme_delta",
    "no_x2_flow",
    "tucp",
    "land_use_2020",
    "biops_2019_mod",
  ],
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all scenario IDs that include a given operation icon.
 * Used to select all scenarios sharing an operation when an icon is clicked.
 */
export function getScenariosWithIcon(iconId: string): string[] {
  return Object.entries(SCENARIO_ICONS)
    .filter(([, icons]) => icons.includes(iconId))
    .map(([scenarioId]) => scenarioId)
}

/**
 * Get the resolved icon definitions for a given scenario.
 * Returns an empty array if the scenario has no icon mapping.
 */
export function getScenarioIconDefs(scenarioId: string): IconDef[] {
  const iconIds = SCENARIO_ICONS[scenarioId]
  if (!iconIds) return []

  return iconIds
    .filter((id) => !id.startsWith("theme_"))
    .map((id) => ICON_REGISTRY[id])
    .filter((def): def is IconDef => def != null)
}

/**
 * Render an icon definition as a React element.
 * Used by OperationsIconGroup to render each icon.
 */
export function renderIconDef(def: IconDef): React.ReactNode {
  if (def.type === "svg-file") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={def.path}
        alt={def.label}
        style={{ width: "100%", height: "100%", pointerEvents: "none" }}
      />
    )
  }

  return (
    <OpsCircleIcon
      lines={def.lines}
      color={def.color}
      strikethrough={def.type === "circle-strikethrough"}
      fontSize={def.fontSize}
      fontWeight={def.fontWeight}
    >
      {def.customSvg}
    </OpsCircleIcon>
  )
}
