import { UserSetting, Setting } from "./types"

export function getRuleText(userSetting: UserSetting, ruleGrammar: string) {
  const ruleParts = userSetting.rule.map(() => ruleGrammar.split(/(\[.*?\])/))
  const text = ruleParts.map((rulePart, ruleIndex) => {
    const returnPartString = (setting: Setting, part: string) => {
      const match = part.match(/^\[(.+?)\]$/)
      if (!match) {
        return part
      }

      const key = match?.[1] || ""
      const value = setting?.[key]?.value
      return value
    }
    return rulePart
      .map((part) => {
        if (userSetting.rule[ruleIndex])
          return returnPartString(userSetting.rule[ruleIndex], part)
      })
      .filter((d) => d !== "")
      .join("")
  })
  const formattedText = text.join(", ")
  return formattedText.trim()
}

export function getTitleText(userSetting: UserSetting, titleGrammar: string) {
  const titleParts = titleGrammar.split(/(\[.*?\])/)
  const text = titleParts
    .map((part) => {
      const match = part.match(/^\[(.+?)\]$/)
      if (!match) {
        return part
      }

      const key = match?.[1] || ""
      const value = userSetting.title[key]?.value
      return value
    })
    .filter((d) => d !== "")
    .join("")
  return text.trim()
}
