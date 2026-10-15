/**
 * loadErrorText - the sentence a tool shows when its model results fail to
 * load. Raw error text (HTTP status lines, API messages) is for developers;
 * visitors see this fixed sentence instead. Pure module, no React.
 *
 * Exports: MODEL_RESULTS_LOAD_ERROR.
 */

/** Shown in place of a tool's chart when its model results fail to load. */
export const MODEL_RESULTS_LOAD_ERROR =
  "Model results could not be loaded. Try again in a moment."
