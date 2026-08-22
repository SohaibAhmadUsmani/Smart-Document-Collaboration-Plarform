/**
 * Core constants and defaults for Document Editor
 */

export const SAVE_STATUS = {
  IDLE: 'idle',
  SAVING: 'saving',
  SAVED: 'saved',
  ERROR: 'error',
};

export const DEFAULT_DOCUMENT_AST = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [],
    },
  ],
};

export const AUTOSAVE_DEFAULT_DEBOUNCE_MS = 1500;
