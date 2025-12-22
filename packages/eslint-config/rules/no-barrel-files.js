/**
 * Custom ESLint rule to disallow barrel files (index.js/ts files that re-export multiple modules)
 * @type {import("eslint").Rule.RuleModule}
 */
export const noBarrelFilesRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow barrel files (index files that re-export multiple modules)",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: null,
    schema: [], // no options
  },
  create(context) {
    return {
      Program(node) {
        const filename = context.filename
        // Check if the file is named index.js, index.ts, index.jsx, or index.tsx
        if (/[/\\]index\.(js|ts|jsx|tsx|mjs|mts)$/.test(filename)) {
          // Count exports to determine if it's a barrel file
          const sourceCode = context.sourceCode
          const exportStatements = sourceCode.ast.body.filter(
            (node) =>
              node.type === "ExportNamedDeclaration" ||
              node.type === "ExportAllDeclaration" ||
              node.type === "ExportDefaultDeclaration",
          )

          if (exportStatements.length > 1) {
            context.report({
              node,
              message:
                "Barrel files with multiple exports are not allowed. Use explicit imports and exports instead.",
            })
          }
        }
      },
    }
  },
}

// Create a plugin with our custom rule
export const noBarrelFilesPlugin = {
  rules: {
    "no-barrel-files": noBarrelFilesRule,
  },
}
