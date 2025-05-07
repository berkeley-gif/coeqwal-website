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
      Region: [
        "Agriculture North of Delta",
        "Agriculture South of Delta",
        "More to come...",
      ],
      Unit: ["TAF", "% of Current Operations", "More to come..."],
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
      Region: ["Area ABC", "Area XYZ", "More to come..."],
      "Tier Number": ["1", "2", "3"],
    },
    defaultSetting: {
      title: { Region: { type: "text", value: "Area ABC" } },
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
    description:
      "Specify requirements related to Drinking Water, defined by tiers.",
    titleGrammar: "For Drinking Water quality over [Region], I can live with:",
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
      Region: ["Area ABC", "Area XYZ"],
      "Tier Number": ["1", "2", "3"],
    },
    defaultSetting: {
      title: { Region: { type: "text", value: "Area ABC" } },
      rule: [
        {
          "Tier Number": { type: "text", value: "1" },
          Years: { type: "number", value: 1 },
        },
      ],
    },
  },
  {
    label: "Delta Salinity",
    description:
      "Specify requirements related to Delta Salinity, defined by tiers.",
    titleGrammar:
      "For Delta Salinity Requirements over [Region], I can live with:",
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
      Region: ["Area ABC", "Area XYZ"],
      "Tier Number": ["1", "2", "3"],
    },
    defaultSetting: {
      title: { Region: { type: "text", value: "Area ABC" } },
      rule: [
        {
          "Tier Number": { type: "text", value: "1" },
          Years: { type: "number", value: 1 },
        },
      ],
    },
  },
  {
    label: "More to come...",
    description: "Placeholder",
    titleGrammar: "For PLACEHOLDER over [Region], I can live with:",
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
      Region: ["Area ABC", "Area XYZ"],
      "Tier Number": ["1", "2", "3"],
    },
    defaultSetting: {
      title: { Region: { type: "text", value: "Area ABC" } },
      rule: [
        {
          "Tier Number": { type: "text", value: "1" },
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
  isSatisfiable: false,
  isUserDefined: false,
  isSelected: false,
}

export const DEFAULT_OTHER_WATER_NEEDS: WaterNeedSetting[] = [
  {
    name: "Water Delivery",
    setting: {
      title: {
        Region: {
          type: "text",
          value: "Agriculture North of Delta",
        },
      },
      rule: [
        {
          Amount: {
            type: "number",
            value: 100,
          },
          Years: {
            type: "number",
            value: 1,
          },
          Unit: {
            type: "text",
            value: "TAF",
          },
        },
        {
          Amount: {
            type: "number",
            value: "150",
          },
          Years: {
            type: "number",
            value: "5",
          },
          Unit: {
            type: "text",
            value: "TAF",
          },
        },
      ],
    },
    isSatisfiable: false,
    isUserDefined: false,
    isSelected: false,
  },
  {
    name: "Salmon",
    setting: {
      title: {
        Region: {
          type: "text",
          value: "Area ABC",
        },
      },
      rule: [
        {
          "Tier Number": {
            type: "text",
            value: "1",
          },
          Years: {
            type: "number",
            value: 1,
          },
        },
        {
          "Tier Number": {
            type: "text",
            value: "2",
          },
          Years: {
            type: "number",
            value: "10",
          },
        },
        {
          "Tier Number": {
            type: "text",
            value: "3",
          },
          Years: {
            type: "number",
            value: "15",
          },
        },
      ],
    },
    isSatisfiable: false,
    isUserDefined: false,
    isSelected: false,
  },
  {
    name: "Drinking Water",
    setting: {
      title: {
        Region: {
          type: "text",
          value: "Area ABC",
        },
      },
      rule: [
        {
          "Tier Number": {
            type: "text",
            value: "1",
          },
          Years: {
            type: "number",
            value: 1,
          },
        },
        {
          "Tier Number": {
            type: "text",
            value: "2",
          },
          Years: {
            type: "number",
            value: "19",
          },
        },
      ],
    },
    isSatisfiable: true,
    isUserDefined: false,
    isSelected: false,
  },
]

export const SELECTED_COLOR = "#B0B0B0"
export const SYNERGY_COLOR = "#D6E5BD"
export const UNSATISFIABLE_COLOR = "#FFCBCB"
