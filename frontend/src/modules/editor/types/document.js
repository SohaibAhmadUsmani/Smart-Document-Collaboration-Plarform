/**
 * Core constants and type definitions for Document Editor
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
      attrs: { blockId: 'init-block-1' },
      content: [],
    },
  ],
};

export const AUTOSAVE_DEFAULT_DEBOUNCE_MS = 1500;

export const DOCUMENT_ACTIONS = {
  SET_DOCUMENT: 'SET_DOCUMENT',
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
};
