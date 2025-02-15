import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Resolves __dirname in an ES Module environment
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Defines a message object where each key is either a string
 * or recursively another message object.
 */
export interface TranslationMap {
  [key: string]: string | TranslationMap;
}

/**
 * Recursively merges two objects, with `localMessages` overriding `globalMessages`.
 * @param globalMessages - The shared/global translations
 * @param localMessages - The app-specific translations
 * @returns A deeply merged translation object
 */
function deepMerge(globalMessages: TranslationMap, localMessages: TranslationMap): TranslationMap {
  const result: TranslationMap = { ...globalMessages };

  for (const key in localMessages) {
    if (
      typeof localMessages[key] === 'object' &&
      localMessages[key] !== null &&
      !Array.isArray(localMessages[key]) &&
      typeof globalMessages[key] === 'object' &&
      globalMessages[key] !== null &&
      !Array.isArray(globalMessages[key])
    ) {
      // If both values are objects, merge them recursively
      result[key] = deepMerge(globalMessages[key], localMessages[key]);
    } else {
      // Otherwise, overwrite with local value
      result[key] = localMessages[key] ?? '';
    }
  }

  return result;
}

/**
 * Reads a JSON file synchronously.
 */
function readJsonFile(filePath: string): any {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.error(`❌ Error reading JSON file at ${filePath}:`, error);
    return {};
  }
}

/**
 * Fetches and merges global & local translations.
 * @param locale - The language code (e.g., "en" or "es")
 * @param appPath - The relative path to the local translation files in the app
 * @returns Merged translation object
 */
export async function getMessages(locale: string, appPath: string) {
  let globalMessages: TranslationMap = {};
  let localMessages: TranslationMap = {};

  // ✅ Ensure the correct path for global JSON files
  const globalFilePath = path.resolve(__dirname, `../dist/locales/${locale}.json`);

  // ✅ Ensure the correct path for local JSON files
  const localFilePath = path.resolve(appPath, `locales/${locale}.json`);

  console.log(`🔍 Checking paths before import:`);
  console.log(`🌍 Global JSON Path: ${globalFilePath}`);
  console.log(`🏠 Local JSON Path: ${localFilePath}`);

  try {
    globalMessages = readJsonFile(globalFilePath);
  } catch (error) {
    console.error(`❌ Error loading global messages from ${globalFilePath}:`, error);
  }

  try {
    localMessages = readJsonFile(localFilePath);
  } catch (error) {
    console.error(`❌ Error loading local messages from ${localFilePath}:`, error);
  }

  return deepMerge(globalMessages, localMessages);
}
