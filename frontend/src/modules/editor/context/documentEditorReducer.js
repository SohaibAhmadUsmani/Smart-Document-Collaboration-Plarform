/**
 * @file documentEditorReducer.js
 * @description Centralized state reducer and initial state model for the Document Editor.
 * Handles document hydration, title & AST mutations, autosave statuses, active marks,
 * tags, favorites, attachments, and permissions.
 * @module frontend/src/modules/editor/context/documentEditorReducer
 * @owner Muzammil
 *
 * [ROMAN URDU]:
 * Yeh reducer Document Editor ki tamam UI aur sync state mutations ko handle karta hai.
 * Document load hone (`SET_DOCUMENT`), title update, content typing, autosave status changes,
 * 409 conflict detection (`SET_CONFLICT`), resolution (`RESOLVE_CONFLICT`), aur beacon flush track karta hai.
 */

import { SAVE_STATUS, DEFAULT_DOCUMENT_AST, DOCUMENT_ACTIONS } from '../types/document.js';

/**
 * Initial State tree for Document Editor.
 *
 * [ROMAN URDU]:
 * Document Editor ki default/initial state jisme document ID, title, rich content AST,
 * autosave status, conflict resolution payload, aur permissions mojood hain.
 */
export const initialEditorState = {
  documentId: null,
  workspaceId: null,
  folderId: null,
  title: 'Untitled Document',
  icon: null,
  coverImage: null,
  content: null,
  plainText: '',
  tags: [],
  isFavorite: false,
  favoriteCount: 0,
  attachments: [],
  version: 1,

  // Editing & Sync State
  isReadOnly: false,
  saveStatus: SAVE_STATUS.IDLE,
  lastSavedAt: null,
  saveError: null,
  isDirty: false,
  conflictData: null, // Holds { serverDocument, localContent, localPlainText, error } on HTTP 409
  isBeaconPending: false, // Tracks beforeunload background flush

  // Active Formatting & Selection State
  activeMarks: {},
  activeBlockType: 'paragraph',

  // Comments & Search
  activeCommentThreadId: null,
  searchQuery: '',

  // Permissions State
  permissions: {
    role: 'editor',
    canEdit: true,
    canComment: true,
    canDelete: false,
    canShare: false,
  },
};

/**
 * Reducer function for managing document editor state transitions.
 *
 * [ROMAN URDU]:
 * Reducer function jo har action type ke hisab se state update karta hai:
 * - `SET_DOCUMENT`: Server se naya document hydrate karta hai.
 * - `UPDATE_TITLE`: Title change karta hai aur isDirty flag set karta hai.
 * - `UPDATE_CONTENT`: Rich-text AST aur plainText ko update karta hai.
 * - `SET_SAVE_STATUS`: Autosave status (saving, saved, error, conflict) aur version sync karta hai.
 * - `SET_CONFLICT`: Version conflict (409) aane par modal data save karta hai (#14).
 * - `RESOLVE_CONFLICT`: User resolution (keep_server, keep_local, merge) ko apply karta hai (#14).
 * - `SET_SAVING_BEACON`: Unload beacon flush ka flag update karta hai (#12).
 * - `SET_ACTIVE_MARKS`: Current cursor selection ke formatting marks track karta hai.
 *
 * @param {Object} state - Current editor state
 * @param {Object} action - Dispatched action with type and payload
 * @returns {Object} Next editor state
 */
export function documentEditorReducer(state, action) {
  switch (action.type) {
    case DOCUMENT_ACTIONS.SET_DOCUMENT: {
      const doc = action.payload || {};
      return {
        ...state,
        documentId: doc.documentId || doc.id || doc._id || state.documentId,
        workspaceId: doc.workspaceId || state.workspaceId,
        folderId: doc.folderId || null,
        title: doc.title || 'Untitled Document',
        icon: doc.icon || null,
        coverImage: doc.coverImage || null,
        content: doc.content || DEFAULT_DOCUMENT_AST,
        plainText: doc.plainText || '',
        tags: Array.isArray(doc.tags) ? doc.tags : [],
        isFavorite: Boolean(doc.isFavorite),
        favoriteCount: doc.favoritedBy?.length || 0,
        attachments: Array.isArray(doc.attachments) ? doc.attachments : [],
        version: doc.version || 1,
        isDirty: false,
        saveStatus: SAVE_STATUS.SAVED,
        conflictData: null,
        saveError: null,
        lastSavedAt: doc.updatedAt ? new Date(doc.updatedAt) : null,
      };
    }

    case DOCUMENT_ACTIONS.SET_DOCUMENT_ID:
      return {
        ...state,
        documentId: action.payload,
        content: null,
        plainText: '',
        title: 'Untitled Document',
        activeCommentThreadId: null,
        isDirty: false,
        saveStatus: SAVE_STATUS.IDLE,
      };

    case DOCUMENT_ACTIONS.UPDATE_TITLE:
      return {
        ...state,
        title: action.payload,
        isDirty: true,
      };

    case DOCUMENT_ACTIONS.UPDATE_CONTENT:
      return {
        ...state,
        content: action.payload.content,
        plainText: action.payload.plainText !== undefined ? action.payload.plainText : state.plainText,
        isDirty: true,
      };

    case DOCUMENT_ACTIONS.SET_SAVE_STATUS:
      return {
        ...state,
        saveStatus: action.payload.status,
        lastSavedAt: action.payload.lastSavedAt || state.lastSavedAt,
        saveError: action.payload.error || null,
        isDirty: action.payload.status === SAVE_STATUS.SAVED ? false : state.isDirty,
        version: action.payload.version || state.version,
      };

    case DOCUMENT_ACTIONS.SET_IS_READ_ONLY:
      return {
        ...state,
        isReadOnly: Boolean(action.payload),
      };

    case DOCUMENT_ACTIONS.TOGGLE_FAVORITE:
      return {
        ...state,
        isFavorite: !state.isFavorite,
        favoriteCount: state.isFavorite ? Math.max(0, state.favoriteCount - 1) : state.favoriteCount + 1,
      };

    case DOCUMENT_ACTIONS.SET_TAGS:
      return {
        ...state,
        tags: Array.isArray(action.payload) ? action.payload : state.tags,
      };

    case DOCUMENT_ACTIONS.ADD_ATTACHMENT:
      return {
        ...state,
        attachments: [...state.attachments, action.payload],
      };

    case DOCUMENT_ACTIONS.REMOVE_ATTACHMENT:
      return {
        ...state,
        attachments: state.attachments.filter((a) => a.attachmentId !== action.payload),
      };

    case DOCUMENT_ACTIONS.SET_ACTIVE_MARKS:
      return {
        ...state,
        activeMarks: action.payload || {},
      };

    case DOCUMENT_ACTIONS.SET_ACTIVE_COMMENT_THREAD:
      return {
        ...state,
        activeCommentThreadId: action.payload,
      };

    case DOCUMENT_ACTIONS.SET_SEARCH_QUERY:
      return {
        ...state,
        searchQuery: action.payload || '',
      };

    case DOCUMENT_ACTIONS.SET_PERMISSIONS:
      return {
        ...state,
        permissions: {
          ...state.permissions,
          ...action.payload,
        },
      };

    // [Issue #14]: Handle 409 Optimistic Concurrency Conflict
    // [ROMAN URDU]: Jab 409 conflict aye to server doc aur local edits ko save kar ke user ko modal dikhane ke liye state set karta hai.
    case DOCUMENT_ACTIONS.SET_CONFLICT:
      return {
        ...state,
        saveStatus: SAVE_STATUS.CONFLICT,
        conflictData: action.payload || null,
        saveError:
          action.payload?.error ||
          action.payload?.message ||
          'Version conflict detected: Another collaborator saved newer changes.',
      };

    // [Issue #14]: Resolve 409 Conflict with user choice ('keep_server' | 'keep_local' | 'merge')
    // [ROMAN URDU]: User ke faislay ke mutabiq server version ya local version ya merged content ko state mein apply karta hai.
    case DOCUMENT_ACTIONS.RESOLVE_CONFLICT: {
      const { resolution, serverDocument, mergedContent, mergedPlainText, serverVersion, baseVersion } =
        action.payload || {};

      if (resolution === 'keep_server' && serverDocument) {
        return {
          ...state,
          content: serverDocument.content || state.content,
          plainText: serverDocument.plainText || state.plainText,
          version: serverDocument.version || state.version + 1,
          title: serverDocument.title || state.title,
          tags: serverDocument.tags || state.tags,
          saveStatus: SAVE_STATUS.SAVED,
          conflictData: null,
          saveError: null,
          isDirty: false,
          lastSavedAt: new Date(),
        };
      }

      if (resolution === 'keep_local') {
        const nextVersion =
          baseVersion || (serverDocument ? serverDocument.version : serverVersion) || state.version;
        return {
          ...state,
          version: nextVersion,
          saveStatus: SAVE_STATUS.IDLE,
          conflictData: null,
          saveError: null,
          isDirty: true,
        };
      }

      if (resolution === 'merge') {
        const nextVersion =
          baseVersion || (serverDocument ? serverDocument.version : serverVersion) || state.version;
        return {
          ...state,
          content: mergedContent || state.content,
          plainText: mergedPlainText !== undefined ? mergedPlainText : state.plainText,
          version: nextVersion,
          saveStatus: SAVE_STATUS.IDLE,
          conflictData: null,
          saveError: null,
          isDirty: true,
        };
      }

      return {
        ...state,
        conflictData: null,
        saveError: null,
        saveStatus: SAVE_STATUS.IDLE,
      };
    }

    // [Issue #12]: Track beforeunload navigator.sendBeacon save attempt
    // [ROMAN URDU]: Tab band honay par background save trigger honay ka status track karta hai.
    case DOCUMENT_ACTIONS.SET_SAVING_BEACON:
      return {
        ...state,
        isBeaconPending: Boolean(action.payload),
      };

    default:
      return state;
  }
}
