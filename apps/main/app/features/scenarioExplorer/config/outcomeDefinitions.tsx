/**
 * Comprehensive outcome definitions for Data Explorer
 * Organized by category with full metadata
 *
 * Colors are defined in theme.palette.outcomes and referenced here by category ID.
 * Use getOutcomeCategoryColor(theme, categoryId) to get the themed color.
 */

import React from "react"
import {
  HomeIcon,
  AgricultureIcon,
  SetMealIcon,
  ScienceIcon,
  WaterDropIcon,
  type Theme,
} from "@repo/ui/mui"

export type TemporalScale = "monthly" | "annual" | "period-of-record"
export type AggregationType =
  | "annual-average"
  | "annual-cv"
  | "dry-years"
  | "trend"
  | "exceedance"
  | "minimum"
  | "maximum"
export type SpatialType =
  | "demand-unit"
  | "ag-demand-unit"
  | "river-location"
  | "delta-node"
  | "reservoir"
  | "groundwater-basin"
  | "population"
  | "regional"

export interface OutcomeMetric {
  id: string
  name: string
  category: string
  subcategory?: string
  unit: string
  temporal: TemporalScale[]
  aggregations: AggregationType[]
  spatialType: SpatialType
  spatialLocation?: string
  description: string
  isTier: boolean
  showOnMap: boolean
  notes?: string
}

/**
 * Maps category IDs to theme.palette.outcomes colors.
 * Use this function to get the themed color for a category.
 */
export const getOutcomeCategoryColor = (
  theme: Theme,
  categoryId: string,
): string => {
  const colorMap: Record<string, string> = {
    "community-water": theme.palette.outcomes.communityWater,
    "agricultural-water": theme.palette.outcomes.agriculturalWater,
    "agricultural-rice": theme.palette.outcomes.agriculturalRice,
    "environmental-water": theme.palette.outcomes.environmentalWater,
    "delta-salinity": theme.palette.outcomes.deltaSalinity,
    "reservoir-storage": theme.palette.outcomes.reservoirStorage,
    "groundwater-storage": theme.palette.outcomes.groundwaterStorage,
    "salmon-abundance": theme.palette.outcomes.salmonAbundance,
  }
  return colorMap[categoryId] || theme.palette.grey[500]
}

export const outcomeCategories = [
  {
    id: "community-water",
    name: "Community water systems",
    icon: <HomeIcon fontSize="small" />,
  },
  {
    id: "agricultural-water",
    name: "Agricultural water",
    icon: <AgricultureIcon fontSize="small" />,
  },
  {
    id: "agricultural-rice",
    name: "Agricultural economic model - Rice",
    icon: <AgricultureIcon fontSize="small" />,
  },
  {
    id: "environmental-water",
    name: "Environmental water",
    icon: <SetMealIcon fontSize="small" />,
  },
  {
    id: "delta-salinity",
    name: "Delta salinity",
    icon: <ScienceIcon fontSize="small" />,
  },
  {
    id: "reservoir-storage",
    name: "Reservoir storage",
    icon: <WaterDropIcon fontSize="small" />,
  },
  {
    id: "groundwater-storage",
    name: "Groundwater storage",
    icon: <WaterDropIcon fontSize="small" />,
  },
  {
    id: "salmon-abundance",
    name: "Salmon abundance",
    icon: <SetMealIcon fontSize="small" />,
  },
]

export const outcomeMetrics: OutcomeMetric[] = [
  // COMMUNITY WATER SYSTEMS
  {
    id: "cws-delivery-tier",
    name: "Community water systems delivery tier",
    category: "community-water",
    unit: "tier",
    temporal: ["period-of-record"],
    aggregations: [],
    spatialType: "demand-unit",
    description:
      "Tier  of water supply reliability determined by impact thresholds",
    isTier: true,
    showOnMap: true,
  },
  {
    id: "cws-sw-delivery-volume",
    name: "Community water systems surface water delivery volume",
    category: "community-water",
    unit: "acre-feet",
    temporal: ["monthly", "annual"],
    aggregations: ["annual-average", "annual-cv", "dry-years"],
    spatialType: "demand-unit",
    description:
      "Volumetric surface water deliveries to community (urban/municipal) demand units",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "cws-sw-delivery-shortage",
    name: "Community water systems surface water delivery volumetric shortage",
    category: "community-water",
    unit: "acre-feet",
    temporal: ["monthly", "annual"],
    aggregations: ["annual-average", "annual-cv", "dry-years"],
    spatialType: "demand-unit",
    description:
      "Volumetric surface water delivery shortage to community (urban/municipal) demand units",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "cws-sw-delivery-pct",
    name: "Community water systems surface water delivery volume (% of demand)",
    category: "community-water",
    unit: "percent",
    temporal: ["monthly", "annual"],
    aggregations: ["annual-average", "annual-cv", "dry-years"],
    spatialType: "demand-unit",
    description: "Surface water delivery as percentage of demand",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "cws-sw-shortage-pct",
    name: "Community water systems surface water delivery shortage (% of demand)",
    category: "community-water",
    unit: "percent",
    temporal: ["monthly", "annual"],
    aggregations: ["annual-average", "annual-cv", "dry-years"],
    spatialType: "demand-unit",
    description: "Water delivery shortage, expressed as percent-of-demand",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "cws-sw-reliability",
    name: "Community water systems surface water delivery reliability",
    category: "community-water",
    unit: "percent",
    temporal: ["period-of-record"],
    aggregations: ["exceedance"],
    spatialType: "demand-unit",
    description:
      "Water delivery (%), expressed relative to exceedance value (95%). For example, in 95/100 years the community experiences a 10% shortage",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "cws-gw-pumping-reduction",
    name: "Community water systems groundwater pumping reduction",
    category: "community-water",
    unit: "acre-feet",
    temporal: ["monthly", "annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "demand-unit",
    description:
      "Reduction in volumetric groundwater to achieve SGMA balance, defined as 'Demand - allowed pumping volume under SGMA'",
    isTier: false,
    showOnMap: true,
    notes:
      "Estimating 'groundwater shortages' as reductions needed to achieve groundwater balance under SGMA at basin level",
  },
  {
    id: "cws-gw-pumping-pct",
    name: "Community water systems groundwater pumping volume (% of demand)",
    category: "community-water",
    unit: "percent",
    temporal: ["monthly", "annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "demand-unit",
    description:
      "Allowed groundwater pumping volume as a percentage of total demand, defined as 'Allowed pumping/Demand'",
    isTier: false,
    showOnMap: true,
    notes: "Only for scenarios where pumping reductions ≠ 0",
  },
  {
    id: "cws-gw-reduction-pct",
    name: "Community water systems groundwater pumping reduction (% of demand)",
    category: "community-water",
    unit: "percent",
    temporal: ["monthly", "annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "demand-unit",
    description:
      "Required reduction in groundwater as a percentage of total demand, defined as 'Reduction volume/Demand'",
    isTier: false,
    showOnMap: true,
    notes: "Only for scenarios where pumping reductions ≠ 0",
  },
  {
    id: "cws-welfare-loss",
    name: "Community water systems welfare loss from surface water shortage",
    category: "community-water",
    unit: "$ USD",
    temporal: ["monthly", "annual"],
    aggregations: ["annual-average", "annual-cv", "dry-years"],
    spatialType: "demand-unit",
    description:
      "Welfare cost for surface water delivery shortage. The economic loss in household well-being that arises when the quantity of surface water delivered to residential users falls below the level needed to meet their demand",
    isTier: false,
    showOnMap: true,
  },

  // AGRICULTURAL WATER
  {
    id: "ag-revenue-tier",
    name: "Agricultural revenue tier",
    category: "agricultural-water",
    unit: "tier",
    temporal: ["period-of-record"],
    aggregations: [],
    spatialType: "ag-demand-unit",
    description:
      "Tier  of agricultural productivity (revenue) determined by impact thresholds",
    isTier: true,
    showOnMap: true,
  },
  {
    id: "ag-sw-delivery-volume",
    name: "Agricultural surface water delivery volume",
    category: "agricultural-water",
    unit: "acre-feet",
    temporal: ["monthly", "annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "ag-demand-unit",
    description:
      "Volumetric surface water deliveries to agricultural demand units",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "ag-gw-delivery-volume",
    name: "Agricultural groundwater delivery volume",
    category: "agricultural-water",
    unit: "acre-feet",
    temporal: ["monthly", "annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "ag-demand-unit",
    description: "Volumetric groundwater pumping by agricultural demand units",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "ag-sw-shortage",
    name: "Agricultural surface water delivery shortage",
    category: "agricultural-water",
    unit: "acre-feet",
    temporal: ["monthly", "annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "ag-demand-unit",
    description:
      "Volumetric surface water delivery shortage to agricultural demand units",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "ag-gw-shortage",
    name: "Agricultural groundwater delivery shortage",
    category: "agricultural-water",
    unit: "acre-feet",
    temporal: ["monthly", "annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "ag-demand-unit",
    description:
      "Volumetric groundwater delivery shortage to agricultural demand units",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "ag-total-shortage",
    name: "Agricultural water delivery shortage",
    category: "agricultural-water",
    unit: "acre-feet",
    temporal: ["monthly", "annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "ag-demand-unit",
    description:
      "Total volumetric (surface and ground) water delivery shortage to agricultural demand units",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "ag-total-shortage-pct",
    name: "Agricultural total water delivery shortage (% of demand)",
    category: "agricultural-water",
    unit: "percent",
    temporal: ["monthly", "annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "ag-demand-unit",
    description: "Water delivery shortage, expressed as percent-of-demand",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "ag-reliability",
    name: "Agricultural water delivery reliability",
    category: "agricultural-water",
    unit: "percent",
    temporal: ["period-of-record"],
    aggregations: ["exceedance"],
    spatialType: "ag-demand-unit",
    description:
      "Water delivery shortage (%), expressed relative to exceedance value (95%). For example, in 95/100 years the demand unit experiences a 10% shortage",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "ag-gross-revenues",
    name: "Agricultural gross revenues",
    category: "agricultural-water",
    unit: "$ USD",
    temporal: ["annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "ag-demand-unit",
    description: "Gross revenues in agricultural production per demand unit",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "ag-employment",
    name: "Agricultural employment",
    category: "agricultural-water",
    unit: "Jobs/year",
    temporal: ["annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "ag-demand-unit",
    description: "Employment in agricultural production per demand unit",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "ag-gdp",
    name: "Agricultural GDP",
    category: "agricultural-water",
    unit: "$ USD",
    temporal: ["annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "ag-demand-unit",
    description: "Gross domestic product per demand unit",
    isTier: false,
    showOnMap: true,
  },

  // AGRICULTURAL ECONOMIC MODEL - Rice
  {
    id: "rice-sw-delivery-volume-regional",
    name: "Agricultural surface water delivery volume (regional)",
    category: "agricultural-rice",
    unit: "Acre-Feet",
    temporal: ["annual"],
    aggregations: ["annual-average", "annual-cv", "minimum"],
    spatialType: "regional",
    spatialLocation: "Glenn, Colusa, Sutter",
    description:
      "Volumetric surface water deliveries to Glenn, Colusa and Sutter counties",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "rice-sw-delivery-volume-unit",
    name: "Agricultural surface water delivery volume",
    category: "agricultural-rice",
    unit: "Acre-Feet",
    temporal: ["annual"],
    aggregations: ["annual-average", "annual-cv", "minimum"],
    spatialType: "ag-demand-unit",
    description:
      "Volumetric surface water deliveries to agricultural demand units",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "rice-harvested-acreage",
    name: "Crop harvested acreage - Rice",
    category: "agricultural-rice",
    unit: "Acres",
    temporal: ["annual"],
    aggregations: ["annual-average", "annual-cv", "minimum"],
    spatialType: "regional",
    spatialLocation: "Glenn, Colusa, Sutter",
    description:
      "Harvested acres of Rice crop in Glenn, Colusa and Sutter counties",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "rice-projected-acreage",
    name: "Projected crop acreage - Rice",
    category: "agricultural-rice",
    unit: "Acres",
    temporal: ["annual"],
    aggregations: ["annual-average", "annual-cv", "minimum"],
    spatialType: "regional",
    spatialLocation: "Glenn, Colusa, Sutter",
    description:
      "Projected acres of Rice crop in Glenn, Colusa and Sutter counties",
    isTier: false,
    showOnMap: true,
  },

  // ENVIRONMENTAL WATER
  {
    id: "env-flow-tier",
    name: "River environmental flow tier",
    category: "environmental-water",
    unit: "tier",
    temporal: ["period-of-record"],
    aggregations: [],
    spatialType: "river-location",
    description:
      "Tier  flow condition determined by functional flow thresholds",
    isTier: true,
    showOnMap: true,
  },
  {
    id: "env-delta-ecology-tier",
    name: "Delta estuary ecology tier",
    category: "environmental-water",
    unit: "tier",
    temporal: ["period-of-record"],
    aggregations: [],
    spatialType: "delta-node",
    description: "Tier  Delta estuary condition",
    isTier: true,
    showOnMap: true,
  },
  {
    id: "env-flow-pct-unimpaired",
    name: "River flows (% unimpaired)",
    category: "environmental-water",
    unit: "percent",
    temporal: ["monthly", "annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "river-location",
    description: "Percent of unimpaired, natural flow",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "env-flow-pct-functional",
    name: "River flows (% functional flows)",
    category: "environmental-water",
    unit: "percent",
    temporal: ["monthly", "annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "river-location",
    description: "Percent of functional flow targets",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "env-flow-alteration-index",
    name: "River flow alteration index",
    category: "environmental-water",
    unit: "correlation coefficient",
    temporal: ["period-of-record"],
    aggregations: [],
    spatialType: "river-location",
    description:
      "Correlation between modeled monthly flow and unimpaired flows",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "env-delta-outflow",
    name: "Delta outflow volumes",
    category: "environmental-water",
    unit: "acre-feet",
    temporal: ["monthly", "annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "delta-node",
    description: "Volumetric Delta outflow",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "env-delta-outflow-pct",
    name: "Delta outflow volumes (% of unimpaired)",
    category: "environmental-water",
    unit: "percent",
    temporal: ["monthly", "annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "delta-node",
    description: "Delta outflow as percent of unimpaired",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "env-refuge-delivery",
    name: "Environmental water deliveries to wildlife refuges",
    category: "environmental-water",
    unit: "acre-feet",
    temporal: ["monthly", "annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "river-location",
    description: "Volumetric surface water deliveries to refuge demand units",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "env-refuge-shortage",
    name: "Wildlife refuge water delivery shortage",
    category: "environmental-water",
    unit: "acre-feet",
    temporal: ["monthly", "annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "demand-unit",
    description:
      "Volumetric surface water delivery shortage to refuge demand units",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "env-refuge-shortage-pct",
    name: "Wildlife refuge water delivery shortage (%)",
    category: "environmental-water",
    unit: "percent",
    temporal: ["monthly", "annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "demand-unit",
    description: "Water delivery shortage, expressed as percent-of-demand",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "env-refuge-reliability",
    name: "Wildlife refuge water delivery reliability",
    category: "environmental-water",
    unit: "percent",
    temporal: ["period-of-record"],
    aggregations: ["exceedance"],
    spatialType: "demand-unit",
    description:
      "Water delivery shortage (%), expressed relative to exceedance value (95%). For example, in 95/100 years the demand unit experiences a 10% shortage",
    isTier: false,
    showOnMap: true,
  },

  // DELTA SALINITY
  {
    id: "salinity-in-delta-tier",
    name: "Freshwater for in-Delta uses tier",
    category: "delta-salinity",
    unit: "tier",
    temporal: ["period-of-record"],
    aggregations: [],
    spatialType: "delta-node",
    description:
      "Tier 1-4 corresponding to suitable salinity conditions for in-delta uses",
    isTier: true,
    showOnMap: true,
  },
  {
    id: "salinity-exports-tier",
    name: "Freshwater for Delta exports tier",
    category: "delta-salinity",
    unit: "tier",
    temporal: ["period-of-record"],
    aggregations: [],
    spatialType: "delta-node",
    description:
      "Tier 1-4 corresponding to suitable salinity conditions for delta exports",
    isTier: true,
    showOnMap: true,
  },
  {
    id: "salinity-x2-april",
    name: "April X2",
    category: "delta-salinity",
    unit: "distance (km)",
    temporal: ["annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "delta-node",
    description: "X2 position in April",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "salinity-x2-september",
    name: "September X2",
    category: "delta-salinity",
    unit: "distance (km)",
    temporal: ["annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "delta-node",
    description: "X2 position in September",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "salinity-compliance-em-jp",
    name: "Salinity at compliance points (Emmaton & Jersey Point)",
    category: "delta-salinity",
    unit: "salinity",
    temporal: ["monthly"],
    aggregations: [],
    spatialType: "delta-node",
    spatialLocation: "EM, JP",
    description: "Salinity at Emmaton and Jersey Point",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "salinity-compliance-pumps",
    name: "Salinity at compliance points (Banks and Jones pumping plant)",
    category: "delta-salinity",
    unit: "salinity",
    temporal: ["monthly"],
    aggregations: [],
    spatialType: "delta-node",
    spatialLocation: "Banks, Jones",
    description: "Salinity at Banks and Jones pumping plants",
    isTier: false,
    showOnMap: true,
  },

  // RESERVOIR STORAGE
  {
    id: "reservoir-storage-tier",
    name: "Reservoir storage tier",
    category: "reservoir-storage",
    unit: "tier",
    temporal: ["period-of-record"],
    aggregations: [],
    spatialType: "reservoir",
    description:
      "Tier  of overall reservoir storage determined by historical reference thresholds",
    isTier: true,
    showOnMap: true,
  },
  {
    id: "reservoir-storage-april",
    name: "April reservoir storage volume",
    category: "reservoir-storage",
    unit: "acre-feet",
    temporal: ["annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "reservoir",
    description:
      "Storage volumes of major reservoirs (north and south of Delta) in April (start of irrigation season)",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "reservoir-storage-september",
    name: "September reservoir storage volume",
    category: "reservoir-storage",
    unit: "acre-feet",
    temporal: ["annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "reservoir",
    description:
      "Storage volumes of major reservoirs (north and south of Delta) in September (end of irrigation season)",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "reservoir-storage-april-pct",
    name: "April reservoir storage (% baseline)",
    category: "reservoir-storage",
    unit: "percent",
    temporal: ["annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "reservoir",
    description:
      "Storage volumes of major reservoirs expressed as percent of baseline",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "reservoir-storage-september-pct",
    name: "September reservoir storage (% baseline)",
    category: "reservoir-storage",
    unit: "percent",
    temporal: ["annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "reservoir",
    description:
      "Storage volumes of major reservoirs expressed as percent of baseline",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "reservoir-spill-frequency",
    name: "Spill frequency",
    category: "reservoir-storage",
    unit: "frequency",
    temporal: ["period-of-record"],
    aggregations: [],
    spatialType: "reservoir",
    description: "Number of years in which spill occurs over period of record",
    isTier: false,
    showOnMap: true,
  },

  // GROUNDWATER STORAGE
  {
    id: "gw-storage-tier",
    name: "Groundwater storage tier",
    category: "groundwater-storage",
    unit: "tier",
    temporal: ["period-of-record"],
    aggregations: [],
    spatialType: "groundwater-basin",
    description:
      "Tier  of overall groundwater storage determined by historical reference thresholds",
    isTier: true,
    showOnMap: true,
  },
  {
    id: "gw-level-change",
    name: "Groundwater level change",
    category: "groundwater-storage",
    unit: "m",
    temporal: ["annual"],
    aggregations: ["annual-average", "annual-cv", "trend"],
    spatialType: "groundwater-basin",
    description: "Change in groundwater levels",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "gw-storage-change",
    name: "Groundwater storage volume change",
    category: "groundwater-storage",
    unit: "acre-feet",
    temporal: ["annual"],
    aggregations: ["annual-average", "annual-cv", "trend"],
    spatialType: "groundwater-basin",
    description: "Change in groundwater storage volumes",
    isTier: false,
    showOnMap: true,
  },
  {
    id: "gw-storage-change-pct",
    name: "Groundwater storage change (% baseline)",
    category: "groundwater-storage",
    unit: "percent",
    temporal: ["annual"],
    aggregations: ["annual-average", "annual-cv"],
    spatialType: "groundwater-basin",
    description: "Groundwater storage, expressed as percent of baseline",
    isTier: false,
    showOnMap: true,
  },

  // SALMON ABUNDANCE
  {
    id: "salmon-tier",
    name: "Salmon tier",
    category: "salmon-abundance",
    unit: "tier",
    temporal: ["period-of-record"],
    aggregations: [],
    spatialType: "population",
    description: "Tier  of population status of winter run chinook salmon",
    isTier: true,
    showOnMap: false,
  },
  {
    id: "salmon-spawner-abundance",
    name: "Maximum percent change of 10-year rolling average spawner abundance",
    category: "salmon-abundance",
    unit: "percent change",
    temporal: ["period-of-record"],
    aggregations: ["maximum"],
    spatialType: "population",
    description:
      "Maximum percent change of the 10-year rolling average spawner abundance (compared to initial population size), using the 80th percentile. Results show the best year (largest % change) within the period of record.",
    isTier: false,
    showOnMap: false,
    notes:
      "Because we use a 10 year rolling average, this 'best year' represents 10+ years with conditions similar to or better than the value reported.",
  },
]

/**
 * Helper functions
 */

export function getMetricsByCategory(categoryId: string): OutcomeMetric[] {
  return outcomeMetrics.filter((m) => m.category === categoryId)
}

export function getMetricById(id: string): OutcomeMetric | undefined {
  return outcomeMetrics.find((m) => m.id === id)
}

export function getTierMetrics(): OutcomeMetric[] {
  return outcomeMetrics.filter((m) => m.isTier)
}

export function getMapMetrics(): OutcomeMetric[] {
  return outcomeMetrics.filter((m) => m.showOnMap)
}

export function getMetricsBySpatialType(
  spatialType: SpatialType,
): OutcomeMetric[] {
  return outcomeMetrics.filter((m) => m.spatialType === spatialType)
}
