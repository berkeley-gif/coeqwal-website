import { WaterNeed, WaterNeedSetting } from "./types"

const DU_IDS = [
  "12_NU2",
  "72_PA",
  "71_PA4",
  "15N_NA1",
  "04_PA1",
  "21_PU",
  "17S_SA",
  "62_NU",
  "61_NA6",
  "02_SU",
  "71_PA5",
  "60N_NA1",
  "72_PR3",
  "09_SA2",
  "14_NA",
  "16_SA",
  "60N_PU",
  "63_PR3",
  "60S_NA1",
  "11_SA4",
  "61_PA1",
  "10_NU2",
  "64_NU",
  "26N_NU1",
  "07S_NA",
  "19_SA",
  "72_NU",
  "24_NA1",
  "15N_NA2",
  "26S_PU4",
  "60S_NU2",
  "24_NA2",
  "03_PU3",
  "05_NU",
  "11_SA2",
  "90_PA1",
  "64_PA3",
  "24_NU3",
  "03_SU",
  "08S_PR",
  "50_PA2",
  "11_NA",
  "02_NA",
  "62_NA1",
  "60N_NA3",
  "08N_NU",
  "63_PR2",
  "26N_PU2",
  "09_NU",
  "15S_SA",
  "17S_PR",
  "24_NU2",
  "23_NA",
  "20_NU1",
  "10_NA",
  "71_PA8",
  "20_PA",
  " ",
  "61_NA1",
  "26S_PU6",
  "11_SA3",
  "17N_NR",
  "71_PU1",
  "72_NA2",
  "16_PA",
  "60S_NA2",
  "08S_NU",
  "26N_PU3",
  "71_NA1",
  "64_XA",
  "26N_NU3",
  "90_PU",
  "64_PA2",
  "63_PR1",
  "18_NA",
  "17S_NU",
  "61_NU3",
  "62_NA5",
  "08N_PA",
  "08N_SA1",
  "23_NU",
  "10_NU1",
  "63_NA4",
  "72_PR5",
  "62_NA6",
  "05_NA",
  "24_NU4",
  "24_NU1",
  "61_NA5",
  "07N_PA",
  "09_NA",
  "71_PA6",
  "25_PU",
  "02_PA",
  "03_SA",
  "11_NU2",
  "60S_PA2",
  "73_PA2",
  "02_SA",
  "13_NU2",
  "21_NA",
  "03_PU1",
  "61_PA2",
  "61_NA3",
  "62_NA3",
  "22_SA2",
  "08S_NA1",
  "16_NU",
  "73_XA",
  "64_NA2",
  "20_NU2",
  "18_NU",
  "25_PA2",
  "17N_NA",
  "61_PA3",
  "21_NU",
  "08S_SA3",
  "26S_NU3",
  "50_PU",
  "15N_NU",
  "18_SA",
  "63_NA1",
  "62_NA4",
  "62_NA2",
  "71_PA2",
  "60N_NU1",
  "71_PA1",
  "21_PA",
  "26S_PU2",
  "04_NA",
  "26S_PU3",
  "08S_NA2",
  "60N_NA5",
  "61_NA4",
  "60S_PA1",
  "06_NA",
  "11_NU1",
  "04_NU1",
  "72_PR1",
  "04_PA2",
  "11_PR",
  "60N_NA2",
  "72_NA1",
  "08N_SA2",
  "08S_PA",
  "73_NA",
  "72_PR6",
  "07S_NU",
  "61_NA2",
  "72_PR4",
  "72_PR2",
  "26S_PU5",
  "25_NA",
  "64_PA1",
  "60S_NU1",
  "60N_NU2",
  "06_PA",
  "71_PU2",
  "71_NU",
  "03_PA",
  "16_NA1",
  "07S_PA",
  "15S_NU",
  "26S_PU1",
  "73_PA3",
  "24_NA3",
  "15S_NA2",
  "26N_NA",
  "73_NU",
  "60N_NA4",
  "17N_PR",
  "72_XA2",
  "03_PU2",
  "07N_NA",
  "08N_NA",
  "02_PU",
  "11_SA1",
  "71_NA2",
  "16_PU",
  "19_NU",
  "25_NU",
  "73_PA1",
  "90_PA2",
  "04_NU2",
  "26S_NU4",
  "14_NU",
  "72_XA1",
  "26N_PU1",
  "72_XA3",
  "22_SA1",
  "12_SA",
  "63_NA3",
  "20_NA1",
  "26N_NU5",
  "72_PU2",
  "06_NU",
  "26S_NA",
  "64_NA1",
  "17N_NU",
  "71_PA7",
  "07N_NU",
  "22_NA",
  "22_NU",
  "17S_NA",
  "26N_NU2",
  "50_PA1",
  "08S_SA1",
  "61_NU2",
  "25_PA1",
  "26S_NU1",
  "13_NA",
  "16_NA2",
  "03_NU",
  "02_NU",
  "13_NU1",
  "15N_SA",
  "61_NU1",
  "09_SA1",
  "26S_NU2",
  "71_PA3",
  "63_NU",
  "50_NA",
  "12_NA",
  "15S_NA1",
  "71_NA3",
  "03_NA",
  "26N_NU4",
  "09_PR",
  "12_NU1",
  "63_NA2",
  "08N_PR1",
  "90_NA",
  "20_NA2",
  "08S_SA2",
  "21_SA",
  "08N_PR2",
]

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
      Region: DU_IDS,
      // Region: [
      //   "Agriculture North of Delta",
      //   "Agriculture South of Delta",
      //   "More to come...",
      // ],
      Unit: ["TAF", "% of Current Operations", "More to come..."],
    },
    defaultSetting: {
      title: { Region: { type: "text", value: "12_NU2" } },
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
          value: "12_NU2",
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
