/**
 * @file document.js
 * @description Core constants, action types, and default AST structure for the Document Editor.
 * @module frontend/src/modules/editor/types/document
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh file Document Editor ke core constants, reducer action types, autosave status enum,
 * aur initial blank document AST structure define karti hai.
 */

/**
 * Autosave lifecycle states.
 *
 * [ROMAN URDU]:
 * Autosave ki halat ka enum ('idle', 'saving', 'saved', 'offline_saved', 'conflict', 'error').
 */
export const SAVE_STATUS = {
  IDLE: 'idle',
  SAVING: 'saving',
  SAVED: 'saved',
  OFFLINE_SAVED: 'offline_saved',
  CONFLICT: 'conflict',
  ERROR: 'error',
};

/**
 * Default starter ProseMirror AST node tree for a brand-new document.
 *
 * [ROMAN URDU]:
 * Naye blank document ka basic AST structure jisme ek initial empty paragraph shamil hai.
 */
export const DEFAULT_DOCUMENT_AST = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      attrs: { blockId: 'init-block-1' },
      content: [],
    },
  ],
};

export const AUTOSAVE_DEFAULT_DEBOUNCE_MS = 1500;
export const MAX_OFFLINE_REVISIONS = 20;

/**
 * Reducer action type definitions for DocumentEditorContext.
 *
 * [ROMAN URDU]:
 * Document Editor reducer ke action constants.
 */
export const DOCUMENT_ACTIONS = {
  SET_DOCUMENT: 'SET_DOCUMENT',
  SET_DOCUMENT_ID: 'SET_DOCUMENT_ID',
  UPDATE_TITLE: 'UPDATE_TITLE',
  UPDATE_CONTENT: 'UPDATE_CONTENT',
  SET_SAVE_STATUS: 'SET_SAVE_STATUS',
  SET_IS_READ_ONLY: 'SET_IS_READ_ONLY',
  TOGGLE_FAVORITE: 'TOGGLE_FAVORITE',
  SET_TAGS: 'SET_TAGS',
  ADD_ATTACHMENT: 'ADD_ATTACHMENT',
  REMOVE_ATTACHMENT: 'REMOVE_ATTACHMENT',
  SET_ACTIVE_MARKS: 'SET_ACTIVE_MARKS',
  SET_ACTIVE_COMMENT_THREAD: 'SET_ACTIVE_COMMENT_THREAD',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_PERMISSIONS: 'SET_PERMISSIONS',
  SET_CONFLICT: 'SET_CONFLICT',
  RESOLVE_CONFLICT: 'RESOLVE_CONFLICT',
  SET_SAVING_BEACON: 'SET_SAVING_BEACON',
};
