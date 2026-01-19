import js from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier"
import turboPlugin from "eslint-plugin-turbo"
import tseslint from "typescript-eslint"
import onlyWarn from "eslint-plugin-only-warn"
// import { noBarrelFilesPlugin } from "./no-barrel-files.js";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": [
        "warn",
        {
          allowList: ["NODE_ENV"],
        },
      ],
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  // todo: sort out barrel files
  /*
  {
    plugins: {
      "no-barrels": noBarrelFilesPlugin,
    },
    rules: {
      "no-barrels/no-barrel-files": "error",
    },
  },
  */
  {
    ignores: ["dist/**"],
  },
]
