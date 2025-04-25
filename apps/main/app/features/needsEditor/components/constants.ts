import { WaterNeed, WaterNeedSetting } from "./types"

export const WATER_NEED_TYPES: WaterNeed[] = [
  {
    label: "Water Delivery",
    description:
      "Specify requirements for a CalSim Demand Unit, Reservoirs, Groundwater Storage, or CalSim Outflows.",
    titleGrammar: "For [Region], I can live with:",
    titleDataType: {
      Region: "text", // e.g. "Agriculture North of Delta"
    },
    ruleGrammar: "[Amount] [Unit] in the driest [Years] out of every 20 Years",
    ruleGrammarDataType: {
      Amount: "float", // e.g. 200
      Years: "integer", // e.g. 1
      Unit: "text", // e.g. "TAF"
    },
    fieldOptions: {
      Region: ["Agriculture North of Delta", "Agriculture South of Delta"],
      Unit: ["TAF", "% of Current Operations"],
    },
    defaultSetting: {
      title: { Region: { type: "text", value: "Agriculture North of Delta" } },
      rule: [
        {
          Amount: { type: "number", value: 100 },
          Years: { type: "number", value: 1 },
          Unit: { type: "text", value: "TAF" },
        },
      ],
    },
  },
  {
    label: "Salmon",
    description:
      "Specify requirements related to salmon populations, defined by tiers.",
    titleGrammar: "For Salmon Population over [Region], I can live with:",
    titleDataType: {
      Region: "text", // e.g. "Agriculture North of Delta"
    },
    ruleGrammar:
      "Tier [Tier Number] in the worst [Years] out of every 20 years",
    ruleGrammarDataType: {
      "Tier Number": "text", // e.g. 1,2,3
      Years: "integer", // e.g. 1
      Unit: "text", // e.g. "taf"
    },
    fieldOptions: {
      Region: ["Area X", "Area Y"],
      "Tier Number": ["1", "2", "3"],
    },
    defaultSetting: {
      title: { Region: { type: "text", value: "Area X" } },
      rule: [
        {
          "Tier Number": { type: "text", value: "1" },
          Years: { type: "number", value: 1 },
        },
      ],
    },
  },
  // {
  //   label: "Equity",
  //   description:
  //     "Specify requirements related to equity including distributional equity, <other> equity, etc.",
  //   titleGrammar: "For [Region], I can live with:",
  //   titleDataType: {
  //     Region: "text", // e.g. "Agriculture North of Delta"
  //   },
  //   ruleGrammar: "[Amount] [Unit] in the driest [Years] out of 20 Years",
  //   ruleGrammarDataType: {
  //     Amount: "float", // e.g. 200
  //     Years: "integer", // e.g. 1
  //     Unit: "text", // e.g. "TAF"
  //   },
  // },
  {
    label: "Drinking Water",
    description: "Drinking water-related",
    titleGrammar: "For [Region], I can live with:",
    titleDataType: {
      Region: "text", // e.g. "Agriculture North of Delta"
    },
    ruleGrammar:
      "Tier [Tier Number] in the worst [Years] out of every 20 Years",
    ruleGrammarDataType: {
      "Tier Number": "text", // e.g. 1,2,3
      Years: "integer", // e.g. 1
      Unit: "text", // e.g. "TAF"
    },
    fieldOptions: {
      Region: ["Area X", "Area Y"],
      "Tier Number": ["1", "2", "3"],
    },
    defaultSetting: {
      title: { Region: { type: "text", value: "Area X" } },
      rule: [
        {
          "Tier Number": { type: "text", value: 1 },
          Years: { type: "number", value: 1 },
        },
      ],
    },
  },
  {
    label: "Delta Salinity",
    description: "Delta salinity-related",
    titleGrammar: "For [Region], I can live with:",
    titleDataType: {
      Region: "text", // e.g. "Agriculture North of Delta"
    },
    ruleGrammar: "[Amount] [Unit] in the driest [Years] out of 20 Years",
    ruleGrammarDataType: {
      Amount: "float", // e.g. 200
      Years: "integer", // e.g. 1
      Unit: "text", // e.g. "TAF"
    },
    fieldOptions: {
      Region: ["Area X", "Area Y"],
      "Tier Number": ["1", "2", "3"],
    },
    defaultSetting: {
      title: { Region: { type: "text", value: "Area X" } },
      rule: [
        {
          "Tier Number": { type: "text", value: 1 },
          Years: { type: "number", value: 1 },
        },
      ],
    },
  },
  {
    label: "Water Quality",
    description: "Water quality-related",
    titleGrammar: "For [Region], I can live with:",
    titleDataType: {
      Region: "text", // e.g. "Agriculture North of Delta"
    },
    ruleGrammar: "[Amount] [Unit] in the driest [Years] out of 20 Years",
    ruleGrammarDataType: {
      Amount: "float", // e.g. 200
      Years: "integer", // e.g. 1
      Unit: "text", // e.g. "TAF"
    },
    fieldOptions: {
      Region: ["Area X", "Area Y"],
      "Tier Number": ["1", "2", "3"],
    },
    defaultSetting: {
      title: { Region: { type: "text", value: "Area X" } },
      rule: [
        {
          "Tier Number": { type: "text", value: 1 },
          Years: { type: "number", value: 1 },
        },
      ],
    },
  },
]

export const BLANK_WATER_NEED: WaterNeedSetting = {
  name: "",
  setting: {
    title: {},
    rule: [{}],
  },
}
