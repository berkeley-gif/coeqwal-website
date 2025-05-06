export interface GrammarDataType {
  [key: string]: "text" | "float" | "integer" // e.g. { Amount: "float", Years: "integer", Unit: "text" }
}

export interface EditingFieldTarget {
  type: "title" | "rule"
  index: number // index of the part in the title or rule - indexed by the tokens in each rule
  dataType: string // type of the field)
  name: string // name of the field - assumed to be unique
  ruleIndex: number // only 0 for title, otherwise the index of the rule in the rules array
}

export interface Setting {
  [key: string]: { type: string; value: string | number }
}

export interface UserSetting {
  title: Setting
  rule: Setting[]
}

export interface FieldOptions {
  [key: string]: string[] // key-value pairs for the options, e.g. { Region: ["Agriculture North of Delta", "Agriculture South of Delta"], Unit: ["TAF", "% Baseline"] }
}

export interface WaterNeed {
  label: string // Label for the water need, e.g. "Water Delivery"
  description: string // Description of the water need
  titleGrammar: string // Grammar for the title, e.g. "For [Region], I can live with:"
  titleDataType: GrammarDataType // Data types for the title fields, e.g. { Region: "text" }
  ruleGrammar: string // Grammar for the rule, e.g. "[Amount] [Unit] in the driest [Years] out of 20 Years"
  ruleGrammarDataType: GrammarDataType // Data types for the rule fields, e.g. { Amount: "float", Years: "integer", Unit: "text" }
  defaultSetting: UserSetting // Default user settings for the water need
  fieldOptions: FieldOptions // Optional field options for the water need
}
// export type NeedsBucketWaterNeedSetting = WaterNeedSetting & {
// }

export interface WaterNeedSetting {
  name: string // Name of the water need
  setting: UserSetting // User-defined settings for the water need
  isUserDefined: boolean
  isSelected: boolean
  isSatisfiable: boolean
}
