import { config } from "@repo/eslint-config/react-internal"

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    rules: {
      "react/prop-types": "off",
    },
  },
  // Ignore *.peak.* scratch files — local-only dev helpers, never committed
  {
    ignores: ["**/*.peak.tsx", "**/*.peak.ts", "**/*.peak.jsx", "**/*.peak.js"],
  },
]
