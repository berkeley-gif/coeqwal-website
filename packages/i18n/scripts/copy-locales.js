// cross-platform solution for copying locales to dist
// bc Windows exists and doesn't support Unix commands

import fs from 'fs'
import path from 'path'

const src = path.resolve('src/locales')
const dest = path.resolve('dist/locales')

console.log('📂 Copying locales...')

// Delete existing `dist/locales` if it exists
fs.rmSync(dest, { recursive: true, force: true })

// Ensure `dist/locales` exists
fs.mkdirSync(dest, { recursive: true })

// Copy all JSON files
fs.readdirSync(src).forEach(file => {
  fs.copyFileSync(path.join(src, file), path.join(dest, file))
});

console.log('✅ Locales copied successfully to dist/locales/')
